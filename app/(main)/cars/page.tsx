import { getCarFilters } from "@/actions/car-listing";
import React from "react";
import CarFilters from "./_components/car-filters";
import CarsListing from "./_components/cars-listing";

export const metadata = {
  title: "Cars | AutoHunt",
  description: "Browse and search for your dream car",
};

const CarsPage = async () => {
  const filtersData = await getCarFilters();
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-6xl mb-4 gradient-title">Browse Cars</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* filter section */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <CarFilters filters = {filtersData.data} />
        </div>

        {/* car listing */}
        <div className="flex-1">
          <CarsListing />
        </div>
      </div>
    </div>
  );
};

export default CarsPage;
