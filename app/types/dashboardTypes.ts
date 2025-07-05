// types/dashboard.ts
export type DashboardData = {
  cars: {
    total: number;
    available: number;
    sold: number;
    unavailable: number;
    featured: number;
  };
  testDrives: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    conversionRate: number;
  };
};

export type GetDashboardDataResult =
  | { success: true; data: DashboardData }
  | { success: false; error: string };
