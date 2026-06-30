import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Re:Write — Story Writing App for Authors",
  description:
    "Re:Write is a web-based story writing app made by authors, for authors. You get scene management, version control, and offline writing, so your story is always organized and saved.",
};

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ backgroundColor: "var(--dark-mint-green)" }} />
        <img
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          src="/images/forest_bg.jpg"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-[33vw] [container-type:inline-size]">
        {/* Card — contains everything */}
        <div
          className="fade-up flex flex-col items-center gap-[20px] rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] px-[30px] py-[40px]"
          style={{ backgroundColor: "var(--dark-green)" }}
        >
          {/* Intro */}
          <div className="flex gap-[10px] items-center justify-center flex-wrap">
            <span className="font-display text-[36px] leading-normal" style={{ color: "var(--aqua)" }}>
              Hello, Author,
            </span>
            <span className="font-display text-[36px] leading-normal" style={{ color: "var(--light-gray)" }}>
              Welcome to
            </span>
          </div>

          {/* Logo */}
          <div className="font-display leading-none select-none" style={{ fontSize: "23cqw" }}>
            <span style={{ color: "var(--aqua)" }}>Re</span>
            <span style={{ color: "black" }}>:</span>
            <span style={{ color: "var(--light-gray)" }}>Write</span>
          </div>

          {/* Blurb */}
          <div
            className="font-display text-[24px] leading-snug text-center flex flex-col items-center gap-0"
            style={{ color: "var(--light-gray)" }}
          >
            <p>A web-based story writing app made by authors, for authors.</p>
            <p>You get scene management, version control, and offline writing, so your story is always organized and saved.</p>
            <p>Create an account and start writing today.</p>
          </div>

          {/* CTAs */}
          <div className="flex gap-[8px] items-center justify-center w-full">
            <Link
              href="/login"
              className="flex-1 font-display text-[27px] flex items-center justify-center px-[16px] py-[8px] rounded-[30px] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--green-highlight)", border: "3px solid black", color: "black" }}
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="flex-1 font-display text-[27px] flex items-center justify-center px-[16px] py-[8px] rounded-[30px] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--green-highlight)", border: "3px solid black", color: "black" }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
