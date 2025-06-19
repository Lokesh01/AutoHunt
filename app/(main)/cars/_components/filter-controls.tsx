import React from "react";
import { CarFiltersType, CurrentFiltersType } from "./car-filters";
import { Slider } from "@/components/ui/slider";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PropTypes = {
  filters: CarFiltersType;
  currentFilters: CurrentFiltersType;
  onFilterChange: (
    filterName: keyof CurrentFiltersType,
    value: string | [number, number]
  ) => void;
  onClearFilter: (filterName: keyof CurrentFiltersType) => void;
};

const CarFilterControls = ({
  filters,
  currentFilters,
  onFilterChange,
  onClearFilter,
}: PropTypes) => {
  const { make, bodyType, fuelType, transmission, priceRange } = currentFilters;
  console.log("lok currentFilters", currentFilters);
  console.log("lok filters", filters);

  const filterSections = [
    {
      id: "make",
      title: "Make",
      option: filters.makes?.map((make) => ({ value: make, label: make })),
      currentValue: make,
      onChange: (value: string) => onFilterChange("make", value),
    },
    {
      id: "bodyType",
      title: "Body Type",
      options: filters.bodyTypes?.map((type) => ({ value: type, label: type })),
      currentValue: bodyType,
      onChange: (value: string) => onFilterChange("bodyType", value),
    },
    {
      id: "fuelType",
      title: "Fuel Type",
      options: filters.fuelTypes?.map((type) => ({ value: type, label: type })),
      currentValue: fuelType,
      onChange: (value: string) => onFilterChange("fuelType", value),
    },
    {
      id: "transmission",
      title: "Transmission",
      options: filters.transmissionTypes?.map((type) => ({
        value: type,
        label: type,
      })),
      currentValue: transmission,
      onChange: (value: string) => onFilterChange("transmission", value),
    },
  ];
  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-4">
        <h3 className="font-medium">Price Range</h3>
        <div className="px-2">
          <Slider
            min={filters.priceRange?.min}
            max={filters.priceRange?.max}
            step={100}
            value={priceRange}
            onValueChange={(value) =>
              onFilterChange("priceRange", value as [number, number])
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">{priceRange[0]}</div>
          <div className="font-medium text-sm">{priceRange[1]}</div>
        </div>
      </div>

      {/* Filter Categories */}
      {filterSections.map((section) => (
        <div key={section.id} className="space-y-3">
          <h4 className="text-sm font-medium flex justify-between">
            <span>{section.title}</span>
            {section.currentValue && (
              <button
                className="text-xs text-gray-600 dark:text-gray-400 flex items-center cursor-pointer
                           hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors"
                onClick={() =>
                  onClearFilter(section.id as keyof CurrentFiltersType)
                }
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </button>
            )}
          </h4>

          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {section.options?.map((option) => (
              <Badge
                key={option.value}
                variant={
                  section.currentValue === option.value ? "default" : "outline"
                }
                className={`cursor-pointer px-3 py-1 ${
                  section.currentValue === option.value
                    ? "bg-red-200 hover:bg-red-300 text-red-900 border-red-200"
                    : "bg-white hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() =>
                  section.onChange(
                    section.currentValue === option.value ? "" : option.value
                  )
                }
              >
                {option.label}
                {section.currentValue === option.value && <Check />}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CarFilterControls;
