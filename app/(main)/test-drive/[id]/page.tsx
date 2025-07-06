import { getCarById } from "@/actions/car-listing";
import { notFound } from "next/navigation";
import TestDriveForm from "./_components/test-drive-form";

type ParamsType = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata() {
  return {
    title: `Book Test Drive | AutoHunt`,
    description: `Schedule a test drive in few seconds`,
  };
}

const page = async ({ params }: ParamsType) => {
  const { id } = await params;
  const result = await getCarById(id);

  //if car not found, show 404
  if (!result.success || !result.data) {
    notFound();
  }

  const carData = result.data!;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-6xl mb-6 gradient-title">Book a Test Drive</h1>
      <TestDriveForm car={carData} testDriveInfo={carData.testDriveInfo} />
    </div>
  );
};

export default page;
