import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import type { User as PrismaUser } from "./generated/prisma";

export type AppUser = PrismaUser | null;

export const checkUser = async (): Promise<AppUser> => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name: name || null,
        imageUrl: user.imageUrl || null,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return newUser;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("An unknown error occurred in checkUser");
    }
    return null;
  }
};
