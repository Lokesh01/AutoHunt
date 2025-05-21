import React from 'react'

const Mainlayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <div className="container mx-auto my-20">{children}</div>;
};

export default Mainlayout;