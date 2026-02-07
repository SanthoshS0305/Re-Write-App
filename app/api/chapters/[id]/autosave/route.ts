import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db/prisma";
import { countWords } from "@/lib/utils/word-count";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    // Verify user owns the chapter
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        id: params.id,
        story: {
          userId: session.user.id,
        },
      },
    });

    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const wordCount = countWords(content);

    const chapter = await prisma.chapter.update({
      where: { id: params.id },
      data: {
        content,
        wordCount,
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Error auto-saving chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

