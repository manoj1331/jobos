import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, format } from "date-fns";

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const now = new Date();

  const [
    allJobs,
    interviews,
    statusCounts,
    monthlyApplications,
    topSkills,
    rejectionReasons,
  ] = await Promise.all([
    prisma.job.findMany({
      where: { userId },
      select: {
        status: true,
        priority: true,
        remote: true,
        location: true,
        applicationDate: true,
        requiredSkills: true,
        matchScore: true,
        salaryMin: true,
        salaryMax: true,
        createdAt: true,
      },
    }),
    prisma.interview.findMany({
      where: { job: { userId } },
      select: { type: true, outcome: true, date: true },
    }),
    prisma.job.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    }),
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char(date_trunc('month', "applicationDate"), 'YYYY-MM') as month,
             COUNT(*) as count
      FROM jobs
      WHERE "userId" = ${userId}
        AND "applicationDate" >= ${subMonths(now, 11)}
        AND "applicationDate" IS NOT NULL
      GROUP BY date_trunc('month', "applicationDate")
      ORDER BY date_trunc('month', "applicationDate")
    `,
    prisma.$queryRaw<{ skill: string; count: bigint }[]>`
      SELECT unnest("requiredSkills") as skill, COUNT(*) as count
      FROM jobs
      WHERE "userId" = ${userId}
      GROUP BY skill
      ORDER BY count DESC
      LIMIT 15
    `,
    prisma.job.groupBy({
      by: ["rejectionReason"],
      where: { userId, status: "rejected", rejectionReason: { not: null } },
      _count: { rejectionReason: true },
      orderBy: { _count: { rejectionReason: "desc" } },
      take: 10,
    }),
  ]);

  const applied = allJobs.filter(j => !["saved", "researching", "ready"].includes(j.status));
  const withInterviews = allJobs.filter(j => ["phone_screen", "technical", "system_design", "manager_round", "hr_round", "final_round", "offer", "negotiation", "accepted"].includes(j.status));
  const withOffers = allJobs.filter(j => ["offer", "negotiation", "accepted"].includes(j.status));
  const accepted = allJobs.filter(j => j.status === "accepted");

  const funnel = [
    { stage: "Applied", count: applied.length },
    { stage: "Interviews", count: withInterviews.length },
    { stage: "Offers", count: withOffers.length },
    { stage: "Accepted", count: accepted.length },
  ];

  const byLocation = Object.entries(
    allJobs.reduce((acc, j) => {
      const loc = j.location ?? "Remote";
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byRemote = [
    { type: "Remote", count: allJobs.filter(j => j.remote === "remote").length },
    { type: "Hybrid", count: allJobs.filter(j => j.remote === "hybrid").length },
    { type: "Onsite", count: allJobs.filter(j => j.remote === "onsite").length },
  ];

  return NextResponse.json({
    funnel,
    statusCounts: statusCounts.map(s => ({ status: s.status, count: s._count.status })),
    monthlyApplications: monthlyApplications.map(r => ({ month: r.month, count: Number(r.count) })),
    topSkills: topSkills.map(r => ({ skill: r.skill, count: Number(r.count) })),
    rejectionReasons: rejectionReasons.map(r => ({
      reason: r.rejectionReason ?? "Unknown",
      count: r._count.rejectionReason,
    })),
    byLocation,
    byRemote,
    interviewTypes: interviews.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totals: {
      total: allJobs.length,
      applied: applied.length,
      interviews: withInterviews.length,
      offers: withOffers.length,
      accepted: accepted.length,
      responseRate: applied.length > 0 ? Math.round((withInterviews.length / applied.length) * 100) : 0,
      offerRate: applied.length > 0 ? Math.round((withOffers.length / applied.length) * 100) : 0,
    },
  });
}
