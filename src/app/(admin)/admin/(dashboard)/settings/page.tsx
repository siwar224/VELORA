import type { Metadata } from "next";
import SettingsForm from "@/components/admin/SettingsForm";
import { admin } from "@/content/admin";

export const metadata: Metadata = { title: admin.settings.title };

export default function SettingsPage() {
  return <SettingsForm />;
}
