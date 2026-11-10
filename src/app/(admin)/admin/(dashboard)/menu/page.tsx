import type { Metadata } from "next";
import { Suspense } from "react";
import MenuTable from "@/components/admin/MenuTable";
import { admin } from "@/content/admin";

export const metadata: Metadata = { title: admin.menu.title };

export default function MenuPage() {
  // MenuTable reads ?edit=<id>; useSearchParams needs a Suspense boundary.
  return (
    <Suspense>
      <MenuTable />
    </Suspense>
  );
}
