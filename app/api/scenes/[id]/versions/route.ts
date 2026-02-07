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

    // Verify user owns the scene
    const scene = await prisma.scene.findFirst({
      where: {
        id: params.id,
        chapter: {
          story: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const versions = await prisma.sceneVersion.findMany({
      where: { sceneId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Error fetching scene versions:", error);
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

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify user owns the scene
    const scene = await prisma.scene.findFirst({
      where: {
        id: params.id,
        chapter: {
          story: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const version = await prisma.sceneVersion.create({
      data: {
        sceneId: params.id,
        content,
      },
    });

    return NextResponse.json(version);
  } catch (error) {
    console.error("Error creating scene version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

