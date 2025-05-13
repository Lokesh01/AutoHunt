// components/HeaderWrapper.tsx (Server Component)
import { checkUser } from "@/lib/checkUser";
import Header from "./header";

export default async function HeaderWrapper({
  isAdminPage = false,
}: {
  isAdminPage?: boolean;
}) {
  const user = await checkUser();

  return <Header isAdminPage={isAdminPage} user={user} />;
}
