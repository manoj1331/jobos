import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  location: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().default("USD"),
  employmentType: z.string().default("full-time"),
  remote: z.string().default("onsite"),
  jobUrl: z.string().optional(),
  postingDate: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.string().default("medium"),
  status: z.string().default("saved"),
  notes: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
  matchScore: z.number().optional(),
  boardColumn: z.string().default("saved"),
});

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const priority = searchParams.get("priority");
  const archived = searchParams.get("archived") === "true";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = { userId, isArchived: archived };
  if (status && status !== "all") where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { name: { contains: search, mode: "insensitive" } } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, logo: true, website: true } },
        recruiter: { select: { id: true, name: true } },
        interviews: { orderBy: { date: "asc" } },
        tags: { include: { tag: true } },
        _count: { select: { interviews: true } },
      },
      orderBy: [{ boardOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({ jobs, total, page, limit });
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // Auto-create company if name provided but no ID
    let companyId = data.companyId;
    if (!companyId && data.companyName) {
      const existing = await prisma.company.findFirst({
        where: { userId, name: { equals: data.companyName, mode: "insensitive" } },
      });
      if (existing) {
        companyId = existing.id;
      } else {
        const company = await prisma.company.create({
          data: { userId, name: data.companyName },
        });
        companyId = company.id;
      }
    }

    // Duplicate detection
    const duplicate = await prisma.job.findFirst({
      where: {
        userId,
        title: { equals: data.title, mode: "insensitive" },
        companyId: companyId ?? undefined,
        isArchived: false,
      },
    });

    const job = await prisma.job.create({
      data: {
        userId,
        companyId,
        title: data.title,
        location: data.location,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency,
        employmentType: data.employmentType,
        remote: data.remote,
        jobUrl: data.jobUrl,
        postingDate: data.postingDate ? new Date(data.postingDate) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        priority: data.priority,
        status: data.status,
        notes: data.notes,
        requiredSkills: data.requiredSkills,
        matchScore: data.matchScore,
        boardColumn: data.boardColumn ?? data.status,
        isDuplicate: !!duplicate,
      },
      include: {
        company: { select: { id: true, name: true, logo: true } },
      },
    });

    await prisma.activity.create({
      data: {
        userId,
        jobId: job.id,
        type: "job_added",
        title: `Added job: ${job.title}`,
        details: job.company?.name,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
