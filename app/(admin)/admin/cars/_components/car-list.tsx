"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const CarsList = () => {
  const router = useRouter();
  // State for search and dialogs
  const [search, setSearch] = useState("");
  return (
    <div className="space-y-4">
      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Button
          className="flex items-center"
          onClick={() => router.push("/admin/cars/create")}
        >
          <Plus className="h-4 w-4" />
          Add Car
        </Button>

        {/* Simple Search Form */}
        <form onSubmit={() => {}} className="flex w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search cars..."
              className="pl-9
             w-full sm:w-60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarsList;
