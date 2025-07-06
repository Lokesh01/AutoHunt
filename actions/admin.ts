"use server";

import { serializeCarData } from "@/lib/helper";
import { db } from "@/lib/prisma";
import type { BookingStatus } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";
import { getUserFromDb } from "./utils/auth-util";
import { GetDashboardDataResult } from "@/app/types/dashboardTypes";

export async function getAdmin() {
  const user = await getUserFromDb();

  if (!user || user.role !== "ADMIN") {
    return { authorized: false, reason: "not-admin" };
  }

  return { authorized: true, user };
}

// Get All Test Drives for admin with filters
export async function getAdminTestDrives({
  search = "",
  status = "",
}: {
  search: string;
  status: string;
}) {
  try {
    //verify admin status
    const user = await getUserFromDb();

    if (!user || user.role !== "ADMIN") {
      throw new Error(
        "Unauthorized: Admin access required to perform this action!"
      );
    }

    //build where condition
    const where = {};

    //add status filter
    if (status) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      where.status = status;
    }

    //add search filter
    if (search) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      where.OR = [
        {
          car: {
            OR: [
              { make: { contains: search, mode: "insensitive" } },
              { model: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    //get bookings
    const bookings = await db.testDriveBooking.findMany({
      where,
      include: {
        car: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            phone: true,
          },
        },
      },
      orderBy: [{ bookingDate: "desc" }, { startTime: "asc" }],
    });

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      carId: booking.carId,
      car: serializeCarData(booking.car),
      userId: booking.userId,
      user: booking.user,
      bookingDate: booking.bookingDate.toISOString(),
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: formattedBookings,
    };
  } catch (error) {
    console.error("Error fetching test drives:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error fetching test drives",
    };
  }
}

export async function updateTestDriveStatus(
  bookingId: string,
  newStatus: BookingStatus
) {
  try {
    //verify admin status
    const user = await getUserFromDb();

    if (!user || user.role !== "ADMIN") {
      throw new Error(
        "Unauthorized: Admin access required to perform this action!"
      );
    }

    //get the bookings
    const booking = await db.testDriveBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ];

    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: "Invalid status",
      };
    }

    //update status
    await db.testDriveBooking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    //revalidate paths
    revalidatePath("/admin/test-drives");
    revalidatePath("/reservations");

    return {
      success: true,
      message: "Test drive status updated successfully",
    };
  } catch (error) {
    throw new Error(
      "Error updating test drive status:" +
        (error instanceof Error
          ? error.message
          : "Error updating test drive status")
    );
  }
}

export async function getDashboardData(): Promise<GetDashboardDataResult> {
  try {
    // Get user
    const user = await getUserFromDb();

    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    //fetch all necessary data in a single parallel req
    const [cars, testDrives] = await Promise.all([
      //get all cars with minimal fields
      db.car.findMany({
        select: {
          id: true,
          status: true,
          featured: true,
        },
      }),

      //get all test drives
      db.testDriveBooking.findMany({
        select: {
          id: true,
          status: true,
          carId: true,
        },
      }),
    ]);

    //calculate car statistics
    const totalCars = cars.length;
    const availableCars = cars.filter(
      (car) => car.status === "AVAILABLE"
    ).length;
    const soldCars = cars.filter((car) => car.status === "SOLD").length;
    const unavailableCars = cars.filter(
      (car) => car.status === "UNAVAILABLE"
    ).length;
    const featuredCars = cars.filter((car) => car.featured === true).length;

    //calculate test drive statistics
    const totalTestDrives = testDrives.length;
    const pendingTestDrives = testDrives.filter(
      (testDrive) => testDrive.status === "PENDING"
    ).length;
    const confirmedTestDrives = testDrives.filter(
      (testDrive) => testDrive.status === "CONFIRMED"
    ).length;
    const completedTestDrives = testDrives.filter(
      (testDrive) => testDrive.status === "COMPLETED"
    ).length;
    const cancelledTestDrives = testDrives.filter(
      (td) => td.status === "CANCELLED"
    ).length;
    const noShowTestDrives = testDrives.filter(
      (td) => td.status === "NO_SHOW"
    ).length;

    //calculate test drive conversion rates
    const completedTestDrivesCarIds = testDrives
      .filter((td) => td.status === "COMPLETED")
      .map((td) => td.carId);
    const soldCarsAfterTestDrive = cars.filter(
      (car) =>
        car.status === "SOLD" && completedTestDrivesCarIds.includes(car.id)
    ).length;
    const conversionRate =
      completedTestDrives > 0
        ? (soldCarsAfterTestDrive / completedTestDrives) * 100
        : 0;

    return {
      success: true,
      data: {
        cars: {
          total: totalCars,
          available: availableCars,
          sold: soldCars,
          unavailable: unavailableCars,
          featured: featuredCars,
        },
        testDrives: {
          total: totalTestDrives,
          pending: pendingTestDrives,
          confirmed: confirmedTestDrives,
          completed: completedTestDrives,
          cancelled: cancelledTestDrives,
          noShow: noShowTestDrives,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
        },
      },
    };
  } catch (error) {
    console.error(
      "Error fetching dashboard data:",
      error instanceof Error ? error.message : "Error fetching dashboard data"
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching data",
    };
  }
}
