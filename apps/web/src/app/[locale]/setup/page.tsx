import { redirect } from "next/navigation";

/**
 * Setup page stub - space setup is not required with CF Access.
 * CF Access users are automatically provisioned when they first authenticate.
 */
export default async function SetupPage() {
  redirect("/");
}
