"use client";

import Head from "next/head";
import { FC } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const NotFound: FC = () => {
  const [mounted, setMounted] = useState(false);

  // Wait for component to mount to access theme (avoids hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>Page Not Found | 404</title>
        <meta
          name="description"
          content="The page you are looking for does not exist"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-red-950 flex flex-col items-center justify-center px-4 text-center transition-colors duration-300">
        <div className="max-w-md mx-auto">
          {/* 404 Graphic */}
          <div className="relative mb-8">
            <div className="text-9xl font-extrabold text-red-600 dark:text-red-500 opacity-20">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-5xl font-bold text-red-700 dark:text-red-400">
                Oops!
              </div>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Back to Home Button */}
          <Link href="/" passHref>
            <Button
              variant="destructive"
              size="lg"
              className="px-6 py-6 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-medium shadow-md focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105"
            >
              Back to Homepage
            </Button>
          </Link>

          {/* Decorative Elements */}
          <div className="mt-12 flex justify-center space-x-4">
            <div className="w-3 h-3 bg-red-300 dark:bg-red-800 rounded-full"></div>
            <div className="w-3 h-3 bg-red-500 dark:bg-red-600 rounded-full"></div>
            <div className="w-3 h-3 bg-red-700 dark:bg-red-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
