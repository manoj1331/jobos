import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    // Seed default email templates
    await prisma.emailTemplate.createMany({
      data: [
        {
          userId: user.id,
          name: "Cold Outreach",
          category: "cold_outreach",
          subject: "Exploring opportunities at {{Company}}",
          body: "Hi {{RecruiterName}},\n\nI hope this finds you well. I came across {{Company}} and was impressed by your work in {{Industry}}. I'm a {{Position}} with experience in {{Skills}} and would love to explore potential opportunities.\n\nWould you be open to a brief conversation?\n\nBest,\n{{MyName}}",
          variables: ["RecruiterName", "Company", "Industry", "Position", "Skills", "MyName"],
          isDefault: true,
        },
        {
          userId: user.id,
          name: "Application Follow-up",
          category: "follow_up",
          subject: "Following up on my application for {{Position}} at {{Company}}",
          body: "Hi {{RecruiterName}},\n\nI wanted to follow up on my application for the {{Position}} role at {{Company}} submitted on {{ApplicationDate}}. I remain very excited about this opportunity and would love to discuss how my background in {{Skills}} could be a great fit.\n\nThank you for your time.\n\nBest,\n{{MyName}}",
          variables: ["RecruiterName", "Position", "Company", "ApplicationDate", "Skills", "MyName"],
          isDefault: true,
        },
        {
          userId: user.id,
          name: "Interview Thank You",
          category: "thank_you",
          subject: "Thank you - {{Position}} Interview at {{Company}}",
          body: "Hi {{RecruiterName}},\n\nThank you for the wonderful conversation today about the {{Position}} role at {{Company}}. I'm even more excited about the opportunity after learning about {{Topic}}.\n\nI look forward to the next steps.\n\nBest,\n{{MyName}}",
          variables: ["RecruiterName", "Position", "Company", "Topic", "MyName"],
          isDefault: true,
        },
        {
          userId: user.id,
          name: "Referral Request",
          category: "referral",
          subject: "Referral request for {{Position}} at {{Company}}",
          body: "Hi {{Name}},\n\nI hope you're doing well! I noticed you work at {{Company}} and wanted to reach out. I'm very interested in the {{Position}} role and was wondering if you'd be willing to refer me or share any insights about the team.\n\nI'd really appreciate your help!\n\nBest,\n{{MyName}}",
          variables: ["Name", "Company", "Position", "MyName"],
          isDefault: true,
        },
      ],
    });

    // Seed default goals
    await prisma.goal.createMany({
      data: [
        { userId: user.id, title: "Weekly Applications", target: 5, unit: "applications", period: "weekly" },
        { userId: user.id, title: "Monthly Applications", target: 20, unit: "applications", period: "monthly" },
        { userId: user.id, title: "Companies Researched", target: 10, unit: "companies", period: "weekly" },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
