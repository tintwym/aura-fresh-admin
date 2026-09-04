import Link from "next/link";
import { AdminStatusView } from "@/components/AdminStatusView";

export default function NotFound() {
  return <AdminStatusView kind="404" />;
}
