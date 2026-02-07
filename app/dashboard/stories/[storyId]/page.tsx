import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db/prisma";
import { StoryDetailContent } from "@/components/dashboard/StoryDetailContent";

export default async function StoryDetailPage({
  params,
}: {
  params: { storyId: string };
}) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const story = await prisma.story.findFirst({
    where: {
      id: params.storyId,
      userId: session.user.id,
    },
    include: {
      chapters: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!story) {
    redirect("/dashboard");
  }

  return <StoryDetailContent story={story} />;
}

