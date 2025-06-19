"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge, Filter, Sliders, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import CarFilterControls from "./filter-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CarFiltersType = {
  makes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmissionTypes: string[];
  priceRange: {
    min: number;
    max: number;
  };
};

export type CurrentFiltersType = {
  make: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  priceRange: [number, number];
  priceRangeMin: number;
  priceRangeMax: number;
};

const CarFilters = ({ filters }: { filters: CarFiltersType }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current filter values from searchParams with proper types
  const currentMake = searchParams.get("make") ?? "";
  const currentBodyType = searchParams.get("bodyType") ?? "";
  const currentFuelType = searchParams.get("fuelType") ?? "";
  const currentTransmission = searchParams.get("transmission") ?? "";
  const currentMinPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : filters.priceRange?.min;
  const currentMaxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : filters.priceRange?.max;
  const currentSortBy = searchParams.get("sortBy") ?? "newest";

  // Local state with proper types
  const [make, setMake] = useState<string>(currentMake);
  const [bodyType, setBodyType] = useState<string>(currentBodyType);
  const [fuelType, setFuelType] = useState<string>(currentFuelType);
  const [transmission, setTransmission] = useState<string>(currentTransmission);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    currentMinPrice,
    currentMaxPrice,
  ]);
  const [sortBy, setSortBy] = useState<string>(currentSortBy);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // Update local state when URL params change
  useEffect(() => {
    setMake(currentMake);
    setBodyType(currentBodyType);
    setFuelType(currentFuelType);
    setTransmission(currentTransmission);
    setPriceRange([currentMinPrice, currentMaxPrice]);
    setSortBy(currentSortBy);
  }, [
    currentMake,
    currentBodyType,
    currentFuelType,
    currentTransmission,
    currentMinPrice,
    currentMaxPrice,
    currentSortBy,
  ]);

  // Count active filters
  const activeFilterCount = [
    make,
    bodyType,
    fuelType,
    transmission,
    currentMinPrice > filters.priceRange?.min ||
      currentMaxPrice < filters.priceRange?.max,
  ].filter(Boolean).length;

  // Update URL when filters change
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (make) params.set("make", make);
    if (bodyType) params.set("bodyType", bodyType);
    if (fuelType) params.set("fuelType", fuelType);
    if (transmission) params.set("transmission", transmission);
    if (priceRange[0] > filters.priceRange?.min)
      params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < filters.priceRange?.max)
      params.set("maxPrice", priceRange[1].toString());
    if (sortBy !== "newest") params.set("sortBy", sortBy);

    // Preserve search and page params if they exist
    const search = searchParams.get("search");
    const page = searchParams.get("page");
    if (search) params.set("search", search);
    if (page && page !== "1") params.set("page", page);

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.push(url);
    setIsSheetOpen(false);
  }, [
    make,
    bodyType,
    fuelType,
    transmission,
    priceRange,
    sortBy,
    pathname,
    searchParams,
    filters.priceRange?.min,
    filters.priceRange?.max,
  ]);

  // Handle filter changes
  const handleFilterChange = (
    filterName: keyof CurrentFiltersType,
    value: string | [number, number]
  ) => {
    switch (filterName) {
      case "make":
        if (typeof value === "string") setMake(value);
        break;
      case "bodyType":
        if (typeof value === "string") setBodyType(value);
        break;
      case "fuelType":
        if (typeof value === "string") setFuelType(value);
        break;
      case "transmission":
        if (typeof value === "string") setTransmission(value);
        break;
      case "priceRange":
        if (Array.isArray(value)) setPriceRange(value);
        break;
      default:
        break;
    }
  };

  // Handle clearing specific filter
  const handleClearFilter = (filterName: keyof CurrentFiltersType) => {
    handleFilterChange(filterName, "");
  };

  // Clear all filters
  const clearAllFilters = () => {
    setMake("");
    setBodyType("");
    setFuelType("");
    setTransmission("");
    setPriceRange([filters.priceRange?.min, filters.priceRange?.max]);
    setSortBy("newest");

    // Keep search term if exists
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) params.set("search", search);

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.push(url);
    setIsSheetOpen(false);
  };

  // Current filters object for the controls component
  const currentFilters: CurrentFiltersType = {
    make,
    bodyType,
    fuelType,
    transmission,
    priceRange,
    priceRangeMin: filters.priceRange?.min,
    priceRangeMax: filters.priceRange?.max,
  };

  return (
    <div className="flex lg:flex-col justify-between gap-4">
      {/* Mobile Filters */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-gray-900"
            >
              <SheetHeader>
                <SheetTitle className="text-gray-900 dark:text-gray-100">
                  Filters
                </SheetTitle>
              </SheetHeader>

              <div className="py-6">
                <CarFilterControls
                  filters={filters}
                  currentFilters={currentFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilter={handleClearFilter}
                />
              </div>

              <SheetFooter className="sm:justify-between flex-row pt-2 border-t border-gray-200 dark:border-gray-700 space-x-4 mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearAllFilters}
                  className="flex-1 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                >
                  Clear All
                </Button>
                <Button
                  type="button"
                  onClick={applyFilters}
                  className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
                >
                  Show Results
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Sort by */}
      <Select
        value={sortBy}
        onValueChange={(value) => {
          setSortBy(value);
          // Apply filters immediately when sort changes
          setTimeout(() => applyFilters(), 0);
        }}
      >
        <SelectTrigger className="w-[180px] lg:w-full">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {[
            { value: "newest", label: "Newest First" },
            { value: "priceAsc", label: "Price: Low to High" },
            { value: "priceDesc", label: "Price: High to Low" },
          ].map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Desktop filters */}
      <div className="hidden lg:block sticky top-24">
        <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900/70">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium flex items-center">
              <Sliders className="w-4 h-4 mr-2" />
              Filters
            </h3>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                onClick={clearAllFilters}
              >
                <X className="mr-1 h-3 w-3" />
                Clear All
              </Button>
            )}
          </div>

          <div className="p-4">
            <CarFilterControls
              filters={filters}
              currentFilters={currentFilters}
              onFilterChange={handleFilterChange}
              onClearFilter={handleClearFilter}
            />
          </div>

          <div className="px-4 py-4 border-t">
            <Button
              onClick={applyFilters}
              className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarFilters;
