import { admin } from "@/content/admin";

/** Placeholder loading states (replaced by layout-matched skeletons in block 4). */
const Loading = () => (
  <p role="status" className="py-16 text-center text-muted-foreground">
    {admin.common.loading}
  </p>
);

export const OverviewSkeleton = Loading;
export const BoardSkeleton = Loading;
export const MenuTableSkeleton = Loading;
export const SettingsSkeleton = Loading;
