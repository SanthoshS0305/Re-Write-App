import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LandingContent from "@/components/landing-content";

export const metadata: Metadata = {
  title: "Re:Write — Story Writing App for Authors",
  description:
    "Re:Write is a web-based story writing app made by authors, for authors. You get scene management, version control, and offline writing, so your story is always organized and saved.",
};

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return <LandingContent />;
}
