"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import type { DayOfWeek, UserRole } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";
import { getUserFromDb } from "./utils/auth-util";

export type CreateWorkingHourInput = {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
};

//get dealership info with working hours
export async function getDealershipInfo() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    //get dealership record
    let dealership = await db.dealershipInfo.findFirst({
      include: {
        workingHours: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
      },
    });

    // if no dealership exists, create a default one
    if (!dealership) {
      dealership = await db.dealershipInfo.create({
        data: {
          // Default values will be used from schema
          workingHours: {
            create: [
              {
                dayOfWeek: "MONDAY",
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: "TUESDAY",
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: "WEDNESDAY",
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: "THURSDAY",
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: "FRIDAY",
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: true,
              },
              {
                dayOfWeek: "SATURDAY",
                openTime: "10:00",
                closeTime: "16:00",
                isOpen: true,
              },
              {
                dayOfWeek: "SUNDAY",
                openTime: "10:00",
                closeTime: "16:00",
                isOpen: false,
              },
            ],
          },
        },
        include: {
          workingHours: {
            orderBy: {
              dayOfWeek: "asc",
            },
          },
        },
      });
    }

    //format the data
    return {
      success: true,
      data: {
        ...dealership,
        createdAt: dealership.createdAt.toISOString(),
        updatedAt: dealership.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    throw new Error(
      "Error fetching dealership info:" +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

//save working hours
export async function saveWorkingHours(workingHours: CreateWorkingHourInput[]) {
  try {
    //check if user is admin
    const user = await getUserFromDb();

    if (!user || user.role !== "ADMIN") {
      throw new Error(
        "Unauthorized: Admin access required to perform this action!"
      );
    }

    //get current dealership info
    const dealership = await db.dealershipInfo.findFirst();

    if (!dealership) {
      throw new Error("Dealership info not found!");
    }

    //update working hours - first delete existing hours
    await db.workingHour.deleteMany({
      where: {
        dealershipId: dealership.id,
      },
    });

    //create new working hours
    for (const hour of workingHours) {
      await db.workingHour.create({
        data: {
          dayOfWeek: hour.dayOfWeek as DayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isOpen: hour.isOpen,
          dealershipId: dealership.id,
        },
      });
    }

    //revalidate paths
    revalidatePath("/admin/settings");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    throw new Error(
      "Error saving working hours:" +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

//get all users
export async function getUsers() {
  try {
    //check if user is admin
    const user = await getUserFromDb();

    if (!user || user.role !== "ADMIN") {
      throw new Error(
        "Unauthorized: Admin access required to perform this action!"
      );
    }

    const users = await db.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    throw new Error(
      "Error fetching users:" +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

//update user role
export async function updateUserRole(userId: string, role: UserRole) {
  try {
    //check if user is admin
    const adminUser = await getUserFromDb();

    if (!adminUser || adminUser.role !== "ADMIN") {
      throw new Error(
        "Unauthorized: Admin access required to perform this action!"
      );
    }

    //update role
    await db.user.update({
      where: { id: userId },
      data: { role },
    });

    //revalidate path
    revalidatePath("/admin/settings");

    return {
      success: true,
    };
  } catch (error) {
    throw new Error(
      "Error in updating user role:" +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
