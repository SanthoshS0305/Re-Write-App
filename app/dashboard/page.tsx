import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db/prisma";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const stories = await prisma.story.findMany({
    where: { userId: session.user.id },
    include: {
      chapters: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return <DashboardContent stories={stories} />;
}

