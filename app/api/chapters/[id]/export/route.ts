import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db/prisma";
import { exportToRewr } from "@/lib/utils/rewr-format";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: params.id,
        story: {
          userId: session.user.id,
        },
      },
      include: {
        story: true,
        scenes: {
          include: {
            versions: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const rewrData = exportToRewr(chapter.story, chapter);

    return NextResponse.json(rewrData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${chapter.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.rewr"`,
      },
    });
  } catch (error) {
    console.error("Error exporting chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

