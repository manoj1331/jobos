import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  companyId: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  location: z.string().optional(),
  title: z.string().optional(),
  lastContact: z.string().optional(),
  nextFollowUp: z.string().optional(),
  relationshipStatus: z.string().default("new"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { userId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const recruiters = await prisma.recruiter.findMany({
    where,
    include: {
      company: { select: { id: true, name: true, logo: true } },
      _count: { select: { jobs: true, emails: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ recruiters });
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const recruiter = await prisma.recruiter.create({
      data: {
        userId,
        ...data,
        lastContact: data.lastContact ? new Date(data.lastContact) : undefined,
        nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : undefined,
      },
    });

    return NextResponse.json(recruiter, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
