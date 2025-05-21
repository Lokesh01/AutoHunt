import { getAdmin } from "@/actions/admin";
import HeaderWrapper from "@/components/headerWrapper";
import { notFound } from "next/navigation";
import React from "react";
import Sidebar from "./admin/_components/sidebar";

const AdminLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const admin = await getAdmin();

  if (!admin.authorized) {
    return notFound();
  }
  return (
    <div className="h-full">
      <HeaderWrapper isAdminPage={true} />
      <div
        className="flex h-full w-56 flex-col top-20 fixed inset-y-0 z5-
      "
      >
        <Sidebar />
      </div>
      <main className="md:pl-56 pt-[80px] h-full">{children}</main>
    </div>
  );
};

export default AdminLayout;
