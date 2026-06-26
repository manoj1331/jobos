import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  website: z.string().optional(),
  careersUrl: z.string().optional(),
  linkedin: z.string().optional(),
  logo: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: z.string().optional(),
  headquarters: z.string().optional(),
  glassdoorRating: z.number().optional(),
  levelsFyiNotes: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  hiringStatus: z.string().default("unknown"),
  remotePolicy: z.string().default("unknown"),
  visaSponsorship: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  priority: z.string().default("medium"),
  notes: z.string().optional(),
  status: z.string().default("active"),
});

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const industry = searchParams.get("industry");
  const priority = searchParams.get("priority");
  const favorite = searchParams.get("favorite") === "true";

  const where: Record<string, unknown> = { userId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { industry: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }
  if (industry) where.industry = industry;
  if (priority) where.priority = priority;
  if (favorite) where.isFavorite = true;

  const companies = await prisma.company.findMany({
    where,
    include: {
      _count: { select: { jobs: true, recruiters: true } },
      tags: { include: { tag: true } },
    },
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ companies });
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const company = await prisma.company.create({
      data: { userId, ...data },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
