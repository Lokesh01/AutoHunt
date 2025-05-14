"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) return null;

  return (
    <footer className="bg-gray-900 text-white py-6 dark:bg-gray-800">
      <div className="w-full px-7 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} AutoHunt. All rights reserved.
        </p>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="/privacy-policy" className="text-sm hover:underline">
            Privacy Policy
          </a>
          <a href="/terms" className="text-sm hover:underline">
            Terms of Service
          </a>
          <a href="/contact" className="text-sm hover:underline">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
