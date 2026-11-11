import type { Metadata } from "next";
import NetworkSimulator from "@/components/admin/NetworkSimulator";
import SettingsForm from "@/components/admin/SettingsForm";
import { admin } from "@/content/admin";

export const metadata: Metadata = { title: admin.settings.title };

export default function SettingsPage() {
  return (
    <>
      <SettingsForm />
      {/* Independent of the form's data: usable even when every request fails. */}
      <NetworkSimulator />
    </>
  );
}
