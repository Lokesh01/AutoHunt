"use client";

import { FeaturedCars } from "@/lib/data";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import Image from "next/image";
import { CarIcon, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

type CardProps = {
  car: FeaturedCars;
};

const CarCard = ({ car }: CardProps) => {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(car.wishlisted);

  const handleToggleSave = async (e) => {};

  return (
    <Card className="overflow-hidden hover:shadow-lg transition group py-0">
      <div className="relative h-48">
        {car.images && car.images.length > 0 ? (
          <div className="relative w-full h-full">
            <Image
              src={car.images[0]}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <CarIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 cursor-pointer bg-white/90 rounded-full p-1.5 ${
            isSaved
              ? "text-red-500 hover:text-red-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={handleToggleSave}
        >
          <Heart className={isSaved ? "fill-current" : ""} size={20} />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="flex flex-col mb-2">
          <h3 className="text-lg font-bold line-clamp-1">
            {car.make} {car.model}
          </h3>
          <span className="text-xl font-bold text-red-500 dark:text-red-400">
            ${car.price.toLocaleString()}
          </span>
        </div>

        <div className="text-gray-600 dark:text-white/60 mb-2 flex items-center">
          <span>{car.year}</span>
          <span className="mx-2">•</span>
          <span>{car.transmission}</span>
          <span className="mx-2">•</span>
          <span>{car.fuelType}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-gray-50 dark:text-black">
            {car.bodyType}
          </Badge>
          <Badge variant="outline" className="bg-gray-50 dark:text-black">
            {car.mileage.toLocaleString()} miles
          </Badge>
          <Badge variant="outline" className="bg-gray-50 dark:text-black">
            {car.color}
          </Badge>
        </div>

        <div className="flex justify-between">
          <Button
            className="flex-1 glow-effect cursor-pointer"
            onClick={() => router.push(`/cars/${car.id}`)}
          >
            View Car
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarCard;
