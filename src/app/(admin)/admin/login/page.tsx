import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";
import { admin } from "@/content/admin";

export const metadata: Metadata = { title: admin.login.title };

export default function LoginPage() {
  return <LoginForm />;
}
