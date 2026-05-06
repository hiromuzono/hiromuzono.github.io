export type RequestStatus = "pending" | "approved" | "declined" | "negotiating" | "withdrawn";
export interface TicketRequest {
  id: string; title: string; tickets_requested: number; tickets_negotiated: number | null;
  preferred_datetime: string | null; parent_comment: string | null; child_comment: string | null;
  parent_name: string | null;
  status: RequestStatus; created_at: string; updated_at: string;
}
export interface TicketSettings { id: number; total_limit: number; }
export interface TicketStats { total_limit: number; used: number; pending: number; remaining: number; }
