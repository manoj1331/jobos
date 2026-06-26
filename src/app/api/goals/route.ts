import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const goals = await prisma.goal.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const goal = await prisma.goal.create({
    data: {
      userId,
      title: body.title,
      target: body.target,
      unit: body.unit,
      period: body.period,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
