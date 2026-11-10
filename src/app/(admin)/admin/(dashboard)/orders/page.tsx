import type { Metadata } from "next";
import OrdersBoard from "@/components/admin/OrdersBoard";
import { admin } from "@/content/admin";

export const metadata: Metadata = { title: admin.orders.title };

export default function OrdersPage() {
  return <OrdersBoard />;
}
