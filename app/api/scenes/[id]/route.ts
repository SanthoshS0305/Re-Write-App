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

    const scene = await prisma.scene.findFirst({
      where: {
        id: params.id,
        chapter: {
          story: {
            userId: session.user.id,
          },
        },
      },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
        },
        chapter: true,
      },
    });

    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    return NextResponse.json(scene);
  } catch (error) {
    console.error("Error fetching scene:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Verify user owns the scene
    const existingScene = await prisma.scene.findFirst({
      where: {
        id: params.id,
        chapter: {
          story: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingScene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.label !== undefined) {
      updateData.label = body.label.trim();
    }
    if (body.startPos !== undefined) {
      updateData.startPos = body.startPos;
    }
    if (body.endPos !== undefined) {
      updateData.endPos = body.endPos;
    }
    if (body.currentVersion !== undefined) {
      updateData.currentVersion = body.currentVersion;
    }

    const scene = await prisma.scene.update({
      where: { id: params.id },
      data: updateData,
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(scene);
  } catch (error) {
    console.error("Error updating scene:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scene = await prisma.scene.deleteMany({
      where: {
        id: params.id,
        chapter: {
          story: {
            userId: session.user.id,
          },
        },
      },
    });

    if (scene.count === 0) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Scene deleted successfully" });
  } catch (error) {
    console.error("Error deleting scene:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

