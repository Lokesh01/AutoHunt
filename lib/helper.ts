import type { Car as PrismaCarType } from "./generated/prisma";

export type SerializedCarType = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number; // ← number instead of Decimal
  mileage: number;
  color: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  seats: number | null;
  description: string;
  status: "AVAILABLE" | "UNAVAILABLE" | "SOLD";
  featured: boolean;
  images: string[];
  createdAt: string; // ← serialized as string
  updatedAt: string;
  wishlisted: boolean; // ← extra field
};


export const serializeCarData = (car: PrismaCarType, wishlisted: boolean = false) => {
  return {
    ...car,
    price: car.price ? parseFloat(car.price.toString()) : 0,
    createdAt: car.createdAt?.toISOString(),
    updatedAt: car.updatedAt?.toISOString(),
    wishlisted: wishlisted,
  };
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};
