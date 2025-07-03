import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function getUserFromDb() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: No user ID found");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  return user;
}
