import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id,
        story: {
          userId: session.user.id,
        },
      },
      include: {
        story: true,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json({ data: chapter });
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const existingChapter = await prisma.chapter.findFirst({
      where: {
        id,
        story: {
          userId: session.user.id,
        },
      },
    });

    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const updateData: Prisma.ChapterUpdateInput = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }
    if (body.content !== undefined) {
      updateData.content = body.content as Prisma.InputJsonValue;
    }
    if (body.wordCount !== undefined) {
      updateData.wordCount = Number(body.wordCount);
    }

    const chapter = await prisma.chapter.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: chapter });
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.chapter.findFirst({
      where: {
        id,
        story: {
          userId: session.user.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    await prisma.chapter.delete({ where: { id } });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
