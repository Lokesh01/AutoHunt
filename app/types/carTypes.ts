import type { BookingStatus, CarStatus } from "@/lib/generated/prisma";
import { SerializedCarType } from "@/lib/helper";

export interface WorkingHour {
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Dealership {
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: WorkingHour[];
  name: string;
}

export interface UserTestDrive {
  id: string;
  carId: string;
  car: SerializedCarType;
  status: BookingStatus;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestDriveInfo {
  userTestDrive: UserTestDrive | null;
  dealership: Dealership | null;
}

export interface Car {
  id: string;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  seats?: number | null;
  images: string[];
  description: string;
  status: CarStatus;
  wishlisted: boolean;
  featured: boolean;
  testDriveInfo: TestDriveInfo;
}
