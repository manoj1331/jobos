import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const recruiter = await prisma.recruiter.findFirst({ where: { id, userId } });
  if (!recruiter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.recruiter.update({
    where: { id },
    data: {
      ...body,
      lastContact: body.lastContact ? new Date(body.lastContact) : undefined,
      nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const recruiter = await prisma.recruiter.findFirst({ where: { id, userId } });
  if (!recruiter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recruiter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
