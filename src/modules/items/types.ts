export interface Item {
  id: string;
  name: string;
  total_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ItemStatus {
  id: string;
  name: string;
  total_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  confirmed_quantity: number;
  created_at: string;
  updated_at: string;
}
