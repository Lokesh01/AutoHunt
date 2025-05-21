"use client";

import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/nextjs";
import {
  Calendar,
  Car,
  Cog,
  LayoutDashboard,
  LogOut,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type RoutesType = {
  label: string;
  icon: LucideIcon;
  href: string;
};

const routes: RoutesType[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Cars",
    icon: Car,
    href: "/admin/cars",
  },
  {
    label: "Test Drives",
    icon: Calendar,
    href: "/admin/test-drives",
  },
  {
    label: "Settings",
    icon: Cog,
    href: "/admin/settings",
  },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <>
      <div className="hidden md:flex flex-col h-full overflow-y-auto bg-white dark:bg-gray-900 shadow-sm border-r">
        {/* Logo/Title Section */}
        <div className="p-6 border-b">
          <Link href="/admin">
            <h1 className="text-xl font-bold text-red-600 dark:text-red-400">
              AutoHunt Admin
            </h1>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col w-full">
          {routes.map((route) => (
            <Link
              href={route.href}
              key={route.href}
              className={cn(
                // Base styles
                "flex items-center gap-x-2 text-sm font-medium pl-6 py-3 transition-all",
                "hover:bg-red-50 dark:hover:bg-red-900/30", // hover states

                // Active link styles
                pathname === route.href
                  ? "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-r-4 border-red-500"
                  : "text-gray-600 dark:text-gray-400",

                "dark:transition-colors dark:duration-200"
              )}
            >
              <route.icon className="h-5 w-5" />
              {route.label}
            </Link>
          ))}
        </div>

        <div className="mt-auto p-6">
          <SignOutButton>
            <button className="flex items-center gap-x-2 text-slate-500 text-sm font-medium transition-all hover:text-slate-600">
              <LogOut className="h-5 w-5" />
              Log out
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* Mobile Bottom Tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t flex justify-around items-center h-16">
        {routes.map((route) => (
          <Link
            href={route.href}
            key={route.href}
            className={cn(
              // Base styles
              "flex max-sm:flex-col items-center gap-x-2 text-sm font-medium transition-all",
              "hover:bg-red-50 dark:hover:bg-red-700/30 p-2", // hover states

              // Active link styles
              pathname === route.href
                ? "text-red-600 dark:text-red-400"
                : "text-gray-600 dark:text-gray-400",

              "dark:transition-colors dark:duration-200"
            )}
          >
            <route.icon
              className={cn(
                "h-6 w-6 mb-1",
                pathname === route.href
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
              )}
            />
            {route.label}
          </Link>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
