import { LoginPage } from "@/components/admin-app";

export default function Page() {
  return <LoginPage showDemoCredentials={process.env.APP_MODE === "demo"} />;
}
