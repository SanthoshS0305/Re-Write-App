import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db/prisma";
import { EditorPageContent } from "@/components/editor/EditorPageContent";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      story: {
        userId: session.user.id,
      },
    },
    include: {
      story: true,
    },
  });

  if (!chapter) {
    redirect("/dashboard");
  }

  return <EditorPageContent chapter={chapter} />;
}

