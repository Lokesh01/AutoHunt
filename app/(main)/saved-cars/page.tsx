import { getSavedCars } from "@/actions/car-listing";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import SavedCarsList from "./_components/saved-cars-list";

export const metadata = {
  title: "Saved Cars | AutoHunt",
  description: "View your saved cars and favorites",
};

const SavedCars = async () => {
  //check authentication on server
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect=/saved-cars");
  }

  //fetch savedCars result
  const savedCarsResult = await getSavedCars();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-6xl mb-6 gradient-title">Your CURATED GARAGE</h1>
      <SavedCarsList initialData={savedCarsResult} />
    </div>
  );
};

export default SavedCars;
