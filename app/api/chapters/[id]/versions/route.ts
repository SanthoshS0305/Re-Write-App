import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db/prisma";
import { countWords } from "@/lib/utils/word-count";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: params.id,
        story: {
          userId: session.user.id,
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const versions = await prisma.chapterVersion.findMany({
      where: { chapterId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Error fetching chapter versions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { label, content, scenesState } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify user owns the chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: params.id,
        story: {
          userId: session.user.id,
        },
      },
      include: {
        scenes: true,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const wordCount = countWords(content);
    const scenesSnapshot = scenesState || chapter.scenes.map((s) => ({
      id: s.id,
      label: s.label,
      startPos: s.startPos,
      endPos: s.endPos,
      currentVersion: s.currentVersion,
    }));

    const version = await prisma.chapterVersion.create({
      data: {
        chapterId: params.id,
        label: label?.trim() || null,
        content,
        wordCount,
        scenesState: scenesSnapshot,
      },
    });

    return NextResponse.json(version);
  } catch (error) {
    console.error("Error creating chapter version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

