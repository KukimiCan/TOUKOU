// front 担当のファイル。
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton width="max-w-xl" rows={2} />;
}
