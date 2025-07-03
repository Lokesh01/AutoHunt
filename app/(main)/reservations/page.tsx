import { getUserTestDrives } from "@/actions/test-drive";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ReservationList from "./_components/reservation-list";

export const metadata = {
  title: "My Reservations | Vehiql",
  description: "Manage your test drive reservations",
};
const page = async () => {
  //check authentication on server
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect=/reservations");
  }

  //fetch reservations on the server
  const reservationResult = await getUserTestDrives();

  // Handle error before passing props
  if (!reservationResult.success || !reservationResult.data) {
    // You can show a fallback, empty state, or redirect
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-6xl mb-6 gradient-title">Your Reservations</h1>
        <p className="text-gray-500">
          No reservations found or an error occurred.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-6xl mb-6 gradient-title">Your Reservations</h1>
      <ReservationList initialData={reservationResult} />
    </div>
  );
};

export default page;
