import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { versionId } = await request.json();

    if (!versionId) {
      return NextResponse.json(
        { error: "versionId is required" },
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

    // Verify version belongs to scene
    const version = await prisma.sceneVersion.findFirst({
      where: {
        id: versionId,
        sceneId: params.id,
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Update scene to use this version
    await prisma.scene.update({
      where: { id: params.id },
      data: { currentVersion: versionId },
    });

    return NextResponse.json({
      message: "Version applied successfully",
      version,
    });
  } catch (error) {
    console.error("Error applying scene version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

