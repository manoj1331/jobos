import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // templates | emails

  if (type === "templates") {
    const templates = await prisma.emailTemplate.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return NextResponse.json({ templates });
  }

  const emails = await prisma.email.findMany({
    where: { userId },
    include: {
      recruiter: { select: { name: true } },
      job: { select: { title: true, company: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ emails });
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const body = await req.json();

  if (body.type === "template") {
    const template = await prisma.emailTemplate.create({
      data: {
        userId,
        name: body.name,
        category: body.category,
        subject: body.subject,
        body: body.body,
        variables: body.variables ?? [],
      },
    });
    return NextResponse.json(template, { status: 201 });
  }

  const email = await prisma.email.create({
    data: {
      userId,
      to: body.to,
      subject: body.subject,
      body: body.body,
      status: body.status ?? "draft",
      recruiterId: body.recruiterId,
      jobId: body.jobId,
      templateId: body.templateId,
      sentAt: body.status === "sent" ? new Date() : undefined,
    },
  });

  if (body.templateId) {
    await prisma.emailTemplate.update({
      where: { id: body.templateId },
      data: { usageCount: { increment: 1 } },
    });
  }

  return NextResponse.json(email, { status: 201 });
}
