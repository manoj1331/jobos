import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const q = new URL(req.url).searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const [jobs, companies, recruiters] = await Promise.all([
    prisma.job.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { company: { name: { contains: q, mode: "insensitive" } } },
          { location: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { company: { select: { name: true } } },
      take: 5,
    }),
    prisma.company.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { industry: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.recruiter.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    results: [
      ...jobs.map(j => ({ type: "job", id: j.id, title: j.title, subtitle: j.company?.name ?? "", url: `/jobs/${j.id}` })),
      ...companies.map(c => ({ type: "company", id: c.id, title: c.name, subtitle: c.industry ?? "", url: `/companies/${c.id}` })),
      ...recruiters.map(r => ({ type: "recruiter", id: r.id, title: r.name, subtitle: r.email ?? "", url: `/recruiters` })),
    ],
  });
}
