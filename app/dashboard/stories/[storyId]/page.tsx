import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { StoryDetailContent } from "@/components/dashboard/StoryDetailContent";

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <StoryDetailContent storyId={storyId} />;
}
