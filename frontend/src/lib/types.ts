export type Role = "admin" | "agent" | "customer";
export type Status = "open" | "in_progress" | "resolved" | "closed";
export type Priority = "low" | "medium" | "high";

export interface UserBrief {
  id: number;
  name: string;
  role: Role;
}

export interface User extends UserBrief {
  email: string;
  business_id: number;
  created_at: string;
}

export interface Me extends User {
  business: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface Ticket {
  id: number;
  subject: string;
  category: string;
  priority: Priority;
  status: Status;
  customer: UserBrief;
  assigned_agent?: UserBrief | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  ticket_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: Role;
  body: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token?: string | null;
}

export type SocketEvent =
  | { type: "message"; data: Message }
  | { type: "ticket_updated"; data: Ticket }
  | { type: "error"; message: string };
