import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { startOfMonth, startOfWeek, endOfMonth, subMonths, format } from "date-fns";

export async function GET() {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [
    totalJobs,
    totalCompanies,
    totalRecruiters,
    applied,
    interviews,
    offers,
    accepted,
    rejected,
    ghosted,
    thisWeek,
    thisMonth,
    upcomingInterviews,
    upcomingDeadlines,
    recentActivity,
    monthlyData,
  ] = await Promise.all([
    prisma.job.count({ where: { userId } }),
    prisma.company.count({ where: { userId } }),
    prisma.recruiter.count({ where: { userId } }),
    prisma.job.count({ where: { userId, status: { in: ["applied", "phone_screen", "technical", "system_design", "manager_round", "hr_round", "final_round", "offer", "negotiation", "accepted", "rejected"] } } }),
    prisma.interview.count({ where: { job: { userId } } }),
    prisma.job.count({ where: { userId, status: { in: ["offer", "negotiation"] } } }),
    prisma.job.count({ where: { userId, status: "accepted" } }),
    prisma.job.count({ where: { userId, status: "rejected" } }),
    prisma.job.count({
      where: {
        userId,
        status: "applied",
        applicationDate: { lt: subMonths(now, 1) },
      },
    }),
    prisma.job.count({ where: { userId, applicationDate: { gte: weekStart } } }),
    prisma.job.count({ where: { userId, applicationDate: { gte: monthStart } } }),
    prisma.interview.findMany({
      where: { job: { userId }, date: { gte: now } },
      orderBy: { date: "asc" },
      take: 5,
      include: { job: { include: { company: true } } },
    }),
    prisma.job.findMany({
      where: { userId, deadline: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { deadline: "asc" },
      take: 5,
      include: { company: true },
    }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char(date_trunc('month', "applicationDate"), 'Mon') as month,
             COUNT(*) as count
      FROM jobs
      WHERE "userId" = ${userId}
        AND "applicationDate" >= ${subMonths(now, 5)}
        AND "applicationDate" IS NOT NULL
      GROUP BY date_trunc('month', "applicationDate")
      ORDER BY date_trunc('month', "applicationDate")
    `,
  ]);

  const totalApplied = applied;
  const responseRate = totalApplied > 0 ? Math.round(((interviews) / totalApplied) * 100) : 0;
  const interviewRate = totalApplied > 0 ? Math.round((interviews / totalApplied) * 100) : 0;
  const offerRate = totalApplied > 0 ? Math.round(((offers + accepted) / totalApplied) * 100) : 0;

  return NextResponse.json({
    stats: {
      totalJobs,
      totalCompanies,
      totalRecruiters,
      applied: totalApplied,
      interviews,
      offers,
      accepted,
      rejected,
      ghosted,
      thisWeek,
      thisMonth,
      responseRate,
      interviewRate,
      offerRate,
    },
    upcomingInterviews,
    upcomingDeadlines,
    recentActivity,
    monthlyData: monthlyData.map(r => ({ month: r.month, count: Number(r.count) })),
  });
}
