import type { Priority, Status } from "@/lib/types";

export const inputCls =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100";
export const btnCls =
  "inline-block rounded bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50";

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
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {" "}
      {status.replace("_", " ")}{" "}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[priority]}`}
    >
      {priority}
    </span>
  );
}

export function Spinner() {
  return <div className="p-8 text-center text-sm text-gray-500">Loading… </div>;
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      {" "}
      {message}{" "}
    </div>
  );
}
