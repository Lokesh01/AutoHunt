"use server";

import { serializeCarData } from "@/lib/helper";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

type BookTestDriveTypes = {
  carId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes: string;
};

export async function bookTestDrive({
  carId,
  bookingDate,
  startTime,
  endTime,
  notes,
}: BookTestDriveTypes) {
  try {
    const { userId } = await auth();

    if (!userId) throw new Error("You must be logged in to book a test drive");

    //find user testdrive
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) throw new Error("User not found in database");

    //check if car exists and is available
    const car = await db.car.findUnique({
      where: { id: carId, status: "AVAILABLE" },
    });

    if (!car) throw new Error("Car not available for test drive");

    //check if slot already booked
    const existingBooking = await db.testDriveBooking.findFirst({
      where: {
        carId,
        bookingDate: new Date(bookingDate),
        startTime,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (existingBooking)
      throw new Error(
        "This slot is already booked. Please choose another slot."
      );

    //once all checks clear create new booking
    const booking = await db.testDriveBooking.create({
      data: {
        userId: user.id,
        carId,
        bookingDate: new Date(bookingDate),
        startTime,
        endTime,
        notes: notes || null,
        status: "PENDING",
      },
    });

    //revalidate relevant paths
    revalidatePath(`/test-drive/${carId}`);
    revalidatePath(`/cars/${carId}`);

    return {
      success: true,
      data: booking,
    };
  } catch (error) {
    console.error("Error booking test drive:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error) || "Failed to book test drive",
    };
  }
}

//fetch user testdrive bookings
export async function getUserTestDrives() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    //get the user from our db
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    //all checks passed
    const bookings = await db.testDriveBooking.findMany({
      where: {
        userId: user.id,
      },
      include: {
        car: true,
      },
      orderBy: { bookingDate: "desc" },
    });

    //format the bookings
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      carId: booking.carId,
      car: serializeCarData(booking.car),
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
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

//cancel test drives
export async function cancelTestDrive(bookingId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    //get the user from our db
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    //get the booking
    const booking = await db.testDriveBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    //check if user owns this booking
    if (booking.userId !== user.id || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized to cancel this booking",
      };
    }

    //check if booking can be cancelled
    if (booking.status === "CANCELLED") {
      return {
        success: false,
        error: "This booking has already been cancelled",
      };
    }

    if (booking.status === "COMPLETED") {
      return {
        success: false,
        error:
          "This booking has already been completed, Can not be cancelled now.",
      };
    }

    //update booking status
    await db.testDriveBooking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
      },
    });

    //revalidate relevant paths
    revalidatePath(`/reservations`);
    revalidatePath(`/admin/test-drives`);

    return {
      success: true,
      message: "Test drive cancelled successfully",
    };
  } catch (error) {
    console.error("Error cancelling test drive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
