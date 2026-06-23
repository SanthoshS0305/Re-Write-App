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
      <div className="relative z-10 flex flex-col items-center gap-[16px] py-[20px] px-[16px]">
        {/* Greeting */}
        <p className="fade-up font-display text-[64px] leading-normal text-center" style={{ color: "var(--aqua)" }}>
          Hello, Author.
        </p>

        {/* Hero card */}
        <div
          className="fade-up fade-up-delay-1 flex flex-col items-center gap-[28px] rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] px-[48px] py-[48px] max-w-[680px] w-full"
          style={{ backgroundColor: "var(--dark-green)" }}
        >
          {/* Logo */}
          <div className="font-display text-[96px] leading-none select-none">
            <span style={{ color: "var(--aqua)" }}>Re</span>
            <span style={{ color: "black" }}>:</span>
            <span style={{ color: "var(--light-gray)" }}>Write</span>
          </div>

          {/* Blurb */}
          <p
            className="font-display text-[20px] leading-relaxed text-center"
            style={{ color: "var(--light-gray)", maxWidth: 520 }}
          >
            A web-based story writing app made by authors, for authors. You get
            scene management, version control, and offline writing, so your story
            is always organized and saved.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-[16px] w-full">
            <Link
              href="/signup"
              className="font-display hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: "var(--green-highlight)",
                border: "3px solid black",
                borderRadius: 30,
                fontSize: 36,
                color: "black",
                height: 60,
                padding: "0 48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Create an account
            </Link>

            <div className="flex gap-[8px] items-center font-display text-[24px]">
              <span style={{ color: "var(--light-gray)" }}>Already an author?</span>
              <Link
                href="/login"
                className="hover:opacity-80 transition-opacity"
                style={{ color: "var(--green-lowlight)" }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
