import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    // Verify user owns the story
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: session.user.id,
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const chapters = await prisma.chapter.findMany({
      where: { storyId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, storyId } = await request.json();

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    // Verify user owns the story
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: session.user.id,
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Get the highest order number
    const lastChapter = await prisma.chapter.findFirst({
      where: { storyId },
      orderBy: { order: "desc" },
    });

    const newOrder = lastChapter ? lastChapter.order + 1 : 1;

    // Create empty ProseMirror document
    const emptyContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
        },
      ],
    };

    const chapter = await prisma.chapter.create({
      data: {
        title: title.trim(),
        storyId,
        order: newOrder,
        content: emptyContent,
        wordCount: 0,
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

