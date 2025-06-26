import { getCarById } from "@/actions/car-listing";
import { notFound } from "next/navigation";
import CarDetails from "./_components/car-details";

type ParamsType = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: ParamsType) {
  const { id } = await params;
  const result = await getCarById(id);

  if (!result.success) {
    return {
      title: "Car Not Found | AutoHunt",
      description: "The requested car could not be found",
    };
  }

  const car = result?.data;

  return {
    title: `${car?.year} ${car?.make} ${car?.model} | AutoHunt`,
    description: car?.description.substring(0, 160),
    openGraph: {
      images: car?.images?.[0] ? [car?.images[0]] : [],
    },
  };
}
const CarDetailsPage = async ({ params }: ParamsType) => {
  const { id } = await params;
  const result = await getCarById(id);

  //if car not found, show 404
  if (!result.success || !result.data) {
    notFound();
  }

  const carData = result.data!;

  return (
    <div className="container mx-auto px-4 py-12">
      <CarDetails car={carData} testDriveInfo={carData.testDriveInfo} />
    </div>
  );
};

export default CarDetailsPage;

