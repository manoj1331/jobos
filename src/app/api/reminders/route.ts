import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const reminders = await prisma.reminder.findMany({
    where: { userId, isDone: false },
    orderBy: { dueAt: "asc" },
  });

  return NextResponse.json({ reminders });
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const reminder = await prisma.reminder.create({
    data: {
      userId,
      title: body.title,
      description: body.description,
      dueAt: new Date(body.dueAt),
      type: body.type ?? "general",
      jobId: body.jobId,
      companyId: body.companyId,
    },
  });

  return NextResponse.json(reminder, { status: 201 });
}
