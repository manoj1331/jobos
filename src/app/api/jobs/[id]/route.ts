import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().optional(),
  companyId: z.string().optional().nullable(),
  location: z.string().optional(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  employmentType: z.string().optional(),
  remote: z.string().optional(),
  jobUrl: z.string().optional(),
  postingDate: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  priority: z.string().optional(),
  status: z.string().optional(),
  boardColumn: z.string().optional(),
  boardOrder: z.number().optional(),
  notes: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  matchScore: z.number().optional().nullable(),
  applicationDate: z.string().optional().nullable(),
  lastFollowUp: z.string().optional().nullable(),
  offerAmount: z.number().optional().nullable(),
  offerDeadline: z.string().optional().nullable(),
  rejectionReason: z.string().optional(),
  isArchived: z.boolean().optional(),
  resumeUsed: z.string().optional(),
  coverLetterUsed: z.string().optional(),
  referral: z.boolean().optional(),
  referralName: z.string().optional(),
  hiringManager: z.string().optional(),
  recruiterId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: { id, userId },
    include: {
      company: true,
      recruiter: true,
      interviews: { orderBy: { date: "asc" } },
      tags: { include: { tag: true } },
      documents: { include: { document: true } },
      emails: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const job = await prisma.job.findFirst({ where: { id, userId } });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.job.update({
      where: { id },
      data: {
        ...data,
        postingDate: data.postingDate ? new Date(data.postingDate) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        applicationDate: data.applicationDate ? new Date(data.applicationDate) : undefined,
        lastFollowUp: data.lastFollowUp ? new Date(data.lastFollowUp) : undefined,
        offerDeadline: data.offerDeadline ? new Date(data.offerDeadline) : undefined,
      },
      include: {
        company: { select: { id: true, name: true, logo: true } },
      },
    });

    if (data.status && data.status !== job.status) {
      await prisma.activity.create({
        data: {
          userId,
          jobId: id,
          type: "status_changed",
          title: `Status changed to ${data.status}`,
          details: job.title,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const job = await prisma.job.findFirst({ where: { id, userId } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
