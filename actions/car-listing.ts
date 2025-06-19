"use server";

import { db } from "@/lib/prisma";
import { CarWhereInput } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { serializeCarData } from "@/lib/helper";
import { Pagination } from "@/components/ui/pagination";

export type GetFilteredCarsParams = {
  search?: string;
  make?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "priceAsc" | "priceDesc";
  page?: number;
  limit?: number;
};

//get simplified filters for the car marketplace
export async function getCarFilters() {
  try {
    //get unique makes
    const makes = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { make: true },
      distinct: ["make"],
      orderBy: { make: "asc" },
    });

    //get unique body types
    const bodyTypes = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { bodyType: true },
      distinct: ["bodyType"],
      orderBy: { bodyType: "asc" },
    });

    //get unique fuel types
    const fuelTypes = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { fuelType: true },
      distinct: ["fuelType"],
      orderBy: { fuelType: "asc" },
    });

    //get unique transmission types
    const transmissionTypes = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { transmission: true },
      distinct: ["transmission"],
      orderBy: { transmission: "asc" },
    });

    //get min and max price range
    const priceAggregations = await db.car.aggregate({
      where: { status: "AVAILABLE" },
      _min: { price: true },
      _max: { price: true },
    });

    return {
      success: true,
      data: {
        makes: makes.map((item) => item.make),
        bodyTypes: bodyTypes.map((item) => item.bodyType),
        fuelTypes: fuelTypes.map((item) => item.fuelType),
        transmissionTypes: transmissionTypes.map((item) => item.transmission),
        priceRange: {
          min: priceAggregations._min.price
            ? parseFloat(priceAggregations._min.price.toString())
            : 0,
          max: priceAggregations._max.price
            ? parseFloat(priceAggregations._max.price.toString())
            : 100000,
        },
      },
    };
  } catch (error) {
    throw new Error(
      `Error fetching car filters: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

//get filtered cars
export async function getFilteredCars({
  search = "",
  make = "",
  bodyType = "",
  fuelType = "",
  transmission = "",
  minPrice = 0,
  maxPrice = Number.MAX_SAFE_INTEGER,
  sortBy = "newest", // Options: newest, priceAsc, priceDesc
  page = 1,
  limit = 6,
}: GetFilteredCarsParams) {
  try {
    //get current user if authenticated
    const { userId } = await auth();
    let dbUser = null;

    if (userId) {
      dbUser = await db.user.findUnique({
        where: { clerkUserId: userId },
      });
    }

    //building where condition
    let where: CarWhereInput = {
      status: "AVAILABLE",
    };

    if (search) {
      where.OR = [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (make) where.make = { equals: make, mode: "insensitive" };
    if (bodyType) where.bodyType = { equals: bodyType, mode: "insensitive" };
    if (fuelType) where.fuelType = { equals: fuelType, mode: "insensitive" };
    if (transmission)
      where.transmission = { equals: transmission, mode: "insensitive" };

    //add price range
    where.price = {
      gte: typeof minPrice === 'string' ? parseFloat(minPrice) : minPrice || 0,
    };

    if (maxPrice && maxPrice < Number.MAX_SAFE_INTEGER) {
      where.price.lte =
        typeof maxPrice === "string" ? parseFloat(maxPrice) : maxPrice;
    }

    //calculate pagination
    const skip = (page - 1) * limit;

    //determine sort order
    let orderBy = {};

    switch (sortBy) {
      case "priceAsc":
        orderBy = { price: "asc" };
        break;
      case "priceDesc":
        orderBy = { price: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    //get total count for pagination
    const totalCars = await db.car.count({ where });

    //executing main query
    const cars = await db.car.findMany({
      where,
      take: limit,
      skip,
      orderBy,
    });

    //if we have a user, check which cars are wishlisted
    let wishlisted: Set<string>;
    if (dbUser) {
      const savedCars = await db.userSavedCar.findMany({
        where: { userId: dbUser.id },
        select: { carId: true },
      });

      wishlisted = new Set(savedCars.map((saved) => saved.carId));
    }

    // Serialize and check wishlist status
    const serializedCars = cars.map((car) =>
      serializeCarData(car, wishlisted.has(car.id))
    );

    return {
      success: true,
      data: serializedCars,
      pagination: {
        total: totalCars,
        page,
        limit,
        pages: Math.ceil(totalCars / limit),
      },
    };
  } catch (error) {
    throw new Error(
      `Gemini API error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

//toggle cars in user's wishlist
export async function toggleSavedCar(carId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    //check if car exists
    const car = await db.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    //check if car is already saved
    const existingSave = await db.userSavedCar.findUnique({
      where: {
        userId_carId: {
          userId: user.id,
          carId,
        },
      },
    });

    //if car is already saved, remove it
    if (existingSave) {
      await db.userSavedCar.delete({
        where: {
          userId_carId: {
            userId: user.id,
            carId,
          },
        },
      });
      revalidatePath(`/saved-cars`);
      return {
        success: true,
        saved: false,
        message: "Car removed from wishlist",
      };
    }

    //if car not saved, add it
    await db.userSavedCar.create({
      data: {
        userId: user.id,
        carId,
      },
    });

    revalidatePath(`/saved-cars`);
    return {
      success: true,
      saved: true,
      message: "Car added to wishlist",
    };
  } catch (error) {
    throw new Error(
      `Error toggling saved car: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

//get car details by id
export async function getCarById(carId: string) {
  try {
    const { userId } = await auth();
    let dbUser = null;

    if (userId) {
      dbUser = await db.user.findUnique({
        where: { clerkUserId: userId },
      });
    }

    //get car details
    const car = await db.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    //check if car is wishlisted
    let isWishlisted = false;
    if (dbUser) {
      const savedCars = await db.userSavedCar.findUnique({
        where: {
          userId_carId: {
            userId: dbUser.id,
            carId,
          },
        },
      });

      isWishlisted = !!savedCars;
    }

    //check if user has already booked a test drive for this car
    const existingTestDrive = await db.testDriveBooking.findFirst({
      where: {
        userId: dbUser?.id,
        carId,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let userTestDrive = null;
    if (existingTestDrive) {
      userTestDrive = {
        id: existingTestDrive.id,
        status: existingTestDrive.status,
        bookingDate: existingTestDrive.bookingDate.toISOString(),
      };
    }

    // Get dealership info for test drive availability
    const dealership = await db.dealershipInfo.findFirst({
      include: {
        workingHours: true,
      },
    });

    return {
      success: true,
      data: {
        ...serializeCarData(car, isWishlisted),
        testDriveInfo: {
          userTestDrive,
          dealership: dealership
            ? {
                ...dealership,
                createdAt: dealership.createdAt.toISOString(),
                updatedAt: dealership.updatedAt.toISOString(),
                workingHours: dealership.workingHours.map((hour) => ({
                  ...hour,
                  createdAt: hour.createdAt.toISOString(),
                  updatedAt: hour.updatedAt.toISOString(),
                })),
              }
            : null,
        },
      },
    };
  } catch (error) {
    throw new Error(
      `Error fetching car details: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

//get user saved cars
export async function getSavedCars() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    //get the user from our database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    //get saved cars with their details
    const savedCars = await db.userSavedCar.findMany({
      where: {
        userId: user.id,
      },
      include: {
        car: true,
      },
      orderBy: {
        savedAt: "desc",
      },
    });

    //extract and format car data
    const cars = savedCars.map((saved) => serializeCarData(saved.car));

    return {
      success: true,
      data: cars,
    };
  } catch (error) {
    console.error("Error fetching saved cars:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
