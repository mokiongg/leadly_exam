export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface Reservation {
  id: string;
  item_id: string;
  customer_id: string;
  quantity: number;
  status: ReservationStatus;
  created_at: string;
  expires_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
}

export interface ReservationResponse {
  id: string;
  item_id: string;
  customer_id: string;
  quantity: number;
  status: ReservationStatus;
  created_at: string;
  expires_at: string;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
}
