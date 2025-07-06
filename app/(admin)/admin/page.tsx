import { getDashboardData } from "@/actions/admin";
import Dashboard from "./_components/dashboard";

export const metadata = {
  title: "Dashboard | AutoHunt Admin",
  description: "Admin dashboard for AutoHunt car marketplace",
};

export default async function AdminDashboardPage() {
  // Fetch dashboard data
  const dashboardData = await getDashboardData();


  if (!dashboardData.success) {
    // Handle error case
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="text-red-500">{dashboardData.error}</div>
      </div>
    );
  }


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Dashboard initialData={dashboardData} />
    </div>
  );
}
