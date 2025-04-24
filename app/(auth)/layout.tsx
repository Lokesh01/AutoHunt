import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: LayoutProps) => {
  return <div className="flex justify-center pt-40">{children}</div>;
};

export default AuthLayout;
