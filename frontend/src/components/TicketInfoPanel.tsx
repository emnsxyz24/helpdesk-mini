import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/ui";
import type { Me, Status, Ticket, User } from "@/lib/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface TicketInfoPanelProps {
  ticket: Ticket;
  currentUser: Me;
  onUpdate: (data: {
    status?: Status;
    assigned_agent_id?: number | null;
  }) => void;
  isUpdating: boolean;
}

export default function TicketInfoPanel({
  ticket,
  currentUser,
  onUpdate,
  isUpdating,
}: TicketInfoPanelProps) {
  const isCustomer = currentUser.role === "customer";
  const isAgent = currentUser.role === "agent";
  const isAdmin = currentUser.role === "admin";
  const isStaff = isAgent || isAdmin;
  const isClosed = ticket.status === "closed";

  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<User | null>(null);

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<User[]>("/users"),
    enabled: isAdmin,
  });

  const canManageTicketStatus =
    isStaff &&
    (isAdmin || (isAgent && ticket.assigned_agent?.id === currentUser.id));

  const agents =
    users?.filter(
      (u) =>
        u.role === "agent" &&
        u.name.toLowerCase().includes(search.trim().toLowerCase()),
    ) ?? [];
  return (
    <aside className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-xs">
      <h2 className="text-base font-semibold text-gray-900 border-b pb-2">
        Ticket Details
      </h2>

      <div className="flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Status</span>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Priority</span>
          <PriorityBadge priority={ticket.priority} />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Category</span>
          <span className="capitalize font-medium text-gray-800">
            {ticket.category}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Customer</span>
          <span className="capitalize font-medium text-gray-800">
            {ticket.customer.name}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Assignee</span>
          <span className="capitalize font-medium text-gray-800">
            {ticket.assigned_agent?.name ?? (
              <span className="text-gray-400 italic">Unassigned</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t pt-3">
        {isClosed ? (
          <p className="rounded bg-gray-100 p-2 text-center text-xs text-gray-600 font-medium">
            This ticket is closed
          </p>
        ) : (
          <>
            {isAgent && !ticket.assigned_agent && (
              <Button
                variant="outline"
                disabled={isUpdating}
                onClick={() => onUpdate({ assigned_agent_id: currentUser.id })}
              >
                Take ticket
              </Button>
            )}

            {isAdmin && !ticket.assigned_agent && (
              <Dialog
                open={openDialog}
                onOpenChange={(open) => {
                  setOpenDialog(open);
                  if (!open) {
                    setSelectedAgent(null);
                    setSearch("");
                  }
                }}
              >
                <DialogTrigger
                  render={<Button variant="outline">Assign an agent</Button>}
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign an agent</DialogTitle>
                  </DialogHeader>
                  <Field>
                    <Input
                      id="input-field-agent-search"
                      type="text"
                      placeholder="Budi"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </Field>
                  <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto py-2">
                    {loadingUsers && (
                      <p className="text-xs text-gray-500">Loading agents...</p>
                    )}

                    {!loadingUsers && agents.length === 0 && (
                      <p className="text-xs text-gray-500">No agents found.</p>
                    )}

                    {agents.map((agent) => {
                      const isCurrentAssignee =
                        ticket.assigned_agent?.id === agent.id;
                      return (
                        <button
                          key={agent.id}
                          type="button"
                          disabled={isUpdating || isCurrentAssignee}
                          onClick={() => {
                            setSelectedAgent(agent);
                          }}
                          className={`flex items-center justify-between rounded border p-2 text-left text-sm hover:bg-gray-50 ${selectedAgent?.id === agent.id ? "bg-primary/5" : ""} disabled:opacity-50`}
                        >
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-xs text-gray-500">
                              {agent.email}
                            </p>
                          </div>
                          {isCurrentAssignee && (
                            <span className="text-xs text-blue-600">
                              Assigned
                            </span>
                          )}
                          {selectedAgent?.id === agent.id &&
                            !isCurrentAssignee && (
                              <span className="text-xs text-green-600">
                                Selected
                              </span>
                            )}
                        </button>
                      );
                    })}
                  </div>
                  <DialogFooter>
                    <DialogClose
                      onClick={() => setSelectedAgent(null)}
                      render={<Button variant="outline">Cancel</Button>}
                    />
                    <Button
                      type="button"
                      disabled={isUpdating || !selectedAgent}
                      onClick={() => {
                        if (!selectedAgent) return;

                        onUpdate({ assigned_agent_id: selectedAgent.id });
                        setOpenDialog(false);
                        setSelectedAgent(null);
                        setSearch("");
                      }}
                    >
                      Save changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {isStaff && ticket.status === "open" && (
              <Button
                variant="outline"
                disabled={isUpdating}
                onClick={() => onUpdate({ status: "in_progress" })}
              >
                Mark In Progress
              </Button>
            )}
            {canManageTicketStatus && (
              <>
                {ticket.status === "in_progress" && (
                  <Button
                    variant="default"
                    disabled={isUpdating}
                    onClick={() => onUpdate({ status: "resolved" })}
                  >
                    Resolve ticket
                  </Button>
                )}

                {isStaff && ticket.status === "resolved" && (
                  <Dialog>
                    <DialogTrigger
                      render={
                        <Button variant="destructive" disabled={isUpdating}>
                          Close ticket
                        </Button>
                      }
                    />
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Are you sure want to close the ticket?
                        </DialogTitle>

                        <DialogDescription>
                          This will close the ticket permanently. This action
                          cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose
                          render={<Button variant="outline">Cancel</Button>}
                        />
                        <Button
                          variant="destructive"
                          disabled={isUpdating}
                          onClick={() => onUpdate({ status: "closed" })}
                        >
                          Close ticket
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}

            {isCustomer && ticket.status === "resolved" && (
              <Button
                variant="default"
                disabled={isUpdating}
                onClick={() => onUpdate({ status: "open" })}
              >
                Reopen ticket
              </Button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
