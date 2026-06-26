import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const jobs = await prisma.job.findMany({
    where: { userId, isArchived: false },
    include: {
      company: { select: { id: true, name: true, logo: true } },
      interviews: { orderBy: { date: "asc" }, take: 1 },
      _count: { select: { interviews: true } },
    },
    orderBy: { boardOrder: "asc" },
  });

  return NextResponse.json({ jobs });
}

export async function PATCH(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const { jobId, column, order } = await req.json();

  const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      boardColumn: column,
      status: column,
      boardOrder: order,
      applicationDate: column === "applied" && !job.applicationDate ? new Date() : undefined,
    },
  });

  if (column !== job.boardColumn) {
    await prisma.activity.create({
      data: {
        userId,
        jobId,
        type: "pipeline_moved",
        title: `Moved to ${column}`,
        details: job.title,
      },
    });
  }

  return NextResponse.json(updated);
}
