"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CarCard from "@/components/car-card";
import { SerializedCarType } from "@/lib/helper";

type SavedCarsListPropsType = {
  initialData: {
    success: boolean;
    error?: string;
    data?: SerializedCarType[];
  };
};

const SavedCarsList = ({ initialData }: SavedCarsListPropsType) => {
  //no saved cars
  if (!initialData?.data || initialData?.data.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-gray-50 dark:bg-gray-900/60 dark:border-gray-700">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
          <Heart className="h-8 w-8 text-gray-500 dark:text-gray-400" />
        </div>

        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
          No Saved Cars
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          You haven&apos;t saved any cars yet. Browse our listings and click the
          heart icon to save cars for later.
        </p>
        <Button variant="default" asChild className="mt-4">
          <Link href="/cars">Browse Cars</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {initialData?.data.map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
};

export default SavedCarsList;
