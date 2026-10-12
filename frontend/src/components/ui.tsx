import type { Priority, Status } from "@/lib/types";
import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

const STATUS_STYLE: Record<Status, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-200 text-gray-700",
};

const PRIORITY_STYLE: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`capitalize rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function AssignedStatusBadge({ assigned }: { assigned: boolean }) {
  if (assigned) return null;
  return (
    <span
      className={`capitalize rounded-full px-2 py-0.5 text-xs font-medium ${!assigned && STATUS_STYLE.closed}`}
    >
      {!assigned && "Unassigned"}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`capitalize rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[priority]}`}
    >
      {priority}
    </span>
  );
}

export function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn(
        "fixed left-1/2 top-1/2 z-50 size-8 -translate-x-1/2 -translate-y-1/2 animate-spin",
        className,
      )}
      {...props}
    />
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      {message}
    </div>
  );
}
