import type { Metadata } from "next";
import Overview from "@/components/admin/Overview";
import { admin } from "@/content/admin";

export const metadata: Metadata = { title: admin.overview.title };

export default function OverviewPage() {
  return <Overview />;
}
