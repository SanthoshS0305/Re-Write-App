"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import TypewriterText from "@/components/typewriter-text";

export default function LandingContent() {
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

      {/* Content column */}
      <div className="relative z-10 flex flex-col items-center gap-[10px] py-[10px] w-[33vw] [container-type:inline-size]">

        {/* Intro — layout-animated so it shifts as card height changes */}
        <motion.div
          layout
          layoutId="auth-intro"
          className="flex items-center gap-[10px] font-display text-[36px] leading-normal text-center"
        >
          <span style={{ color: "var(--aqua)" }}>Hello, Author,</span>
          <span style={{ color: "var(--light-gray)" }}>
            <TypewriterText text="Welcome to" />
          </span>
        </motion.div>

        {/* Logo card — shared element with login/signup */}
        <motion.div
          layoutId="auth-card"
          className="w-full flex flex-col items-center rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] select-none"
          style={{ backgroundColor: "var(--dark-green)", padding: "3cqw" }}
        >
          <motion.div layoutId="auth-logo" className="font-display leading-none" style={{ fontSize: "23cqw" }}>
            <span style={{ color: "var(--aqua)" }}>Re</span>
            <span style={{ color: "black" }}>:</span>
            <span style={{ color: "var(--light-gray)" }}>Write</span>
          </motion.div>
        </motion.div>

        {/* Blurb */}
        <motion.div
          layout
          className="font-display text-[24px] leading-snug text-center flex flex-col items-center"
          style={{ color: "var(--light-gray)" }}
        >
          <p className="m-0">A web-based story writing app made by authors, for authors.</p>
          <p className="m-0">You get scene management, version control, and offline writing, so your story is always organized and saved.</p>
          <p className="m-0">Create an account and start writing today.</p>
        </motion.div>

        {/* CTAs */}
        <motion.div layout className="flex gap-[8px] items-center justify-center px-[8px] py-[16px] w-full">
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
        </motion.div>
      </div>
    </div>
  );
}
