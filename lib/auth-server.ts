import { auth } from "@/lib/auth";

// Helper function to get server session in NextAuth v5
export async function getServerSession() {
  return await auth();
}

