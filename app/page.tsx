import CarCard from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { featuredCars } from "@/lib/data";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col pt-20">
      {/* Hero Section */}
      <section className="relative py-16 md:py-28 dotted-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="glow-effect text-5xl md:text-8xl mb-4 gradient-title">
              Find your dream Ride with AutoHunt
            </h1>
            <p className="text-xl text-black dark:text-white mb-8 max-w-2xl mx-auto">
              Discover & Test Drive Your Perfect Car with AI-Powered Search.{" "}
            </p>
          </div>

          <p>replace with search comp</p>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Featured Cars</h2>
            <Button variant="ghost" className="flex items-center" asChild>
              <Link href="/cars">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
