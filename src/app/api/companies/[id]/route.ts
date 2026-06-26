import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const company = await prisma.company.findFirst({
    where: { id, userId },
    include: {
      jobs: { include: { interviews: true }, orderBy: { createdAt: "desc" } },
      recruiters: true,
      tags: { include: { tag: true } },
      _count: { select: { jobs: true, recruiters: true } },
    },
  });

  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(company);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const company = await prisma.company.findFirst({ where: { id, userId } });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.company.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const company = await prisma.company.findFirst({ where: { id, userId } });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.company.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
