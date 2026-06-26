import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "JobOS — Personal Job Search Operating System",
  description: "Your command center for the entire job search process",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full dark">
      <body className="h-full bg-[#0f0f13] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
