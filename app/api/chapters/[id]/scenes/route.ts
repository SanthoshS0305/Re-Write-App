import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db/prisma";

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

    const scenes = await prisma.scene.findMany({
      where: { chapterId: params.id },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { startPos: "asc" },
    });

    return NextResponse.json(scenes);
  } catch (error) {
    console.error("Error fetching scenes:", error);
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

    const { label, startPos, endPos, content } = await request.json();

    if (!label || !startPos || endPos === undefined) {
      return NextResponse.json(
        { error: "Label, startPos, and endPos are required" },
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
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Check for overlapping scenes
    const overlappingScene = await prisma.scene.findFirst({
      where: {
        chapterId: params.id,
        OR: [
          {
            AND: [
              { startPos: { lte: startPos } },
              { endPos: { gte: startPos } },
            ],
          },
          {
            AND: [
              { startPos: { lte: endPos } },
              { endPos: { gte: endPos } },
            ],
          },
          {
            AND: [
              { startPos: { gte: startPos } },
              { endPos: { lte: endPos } },
            ],
          },
        ],
      },
    });

    if (overlappingScene) {
      return NextResponse.json(
        { error: "Scene overlaps with existing scene" },
        { status: 400 }
      );
    }

    // Create scene with initial version
    const scene = await prisma.scene.create({
      data: {
        label: label.trim(),
        startPos,
        endPos,
        chapterId: params.id,
        versions: {
          create: {
            content: content || { type: "doc", content: [] },
          },
        },
      },
      include: {
        versions: true,
      },
    });

    // Set current version
    await prisma.scene.update({
      where: { id: scene.id },
      data: { currentVersion: scene.versions[0].id },
    });

    const updatedScene = await prisma.scene.findUnique({
      where: { id: scene.id },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(updatedScene);
  } catch (error) {
    console.error("Error creating scene:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

