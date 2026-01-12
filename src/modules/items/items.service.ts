import { getSupabaseClient } from '../../db/client';
import { AppError, ErrorCode } from '../../types';
import { Item, ItemStatus } from './types';
import { CreateItemInput } from './items.schema';
import { ReservationStatus } from '../reservations/types';

/**
 * Gets all items
 */
export const getAllItems = async (): Promise<Item[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching items:', error);
    throw new AppError(500, 'Failed to fetch items', ErrorCode.DATABASE_ERROR);
  }

  return data as Item[];
};

/**
 * Creates a new item with initial quantity
 */
export const createItem = async (input: CreateItemInput): Promise<Item> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('items')
    .insert({
      name: input.name,
      total_quantity: input.initial_quantity,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating item:', error);
    throw new AppError(500, 'Failed to create item', ErrorCode.DATABASE_ERROR);
  }

  return data as Item;
};

/**
 * Gets item by ID
 * Calculates available, reserved, and confirmed quantities
 */
export const getItemStatus = async (itemId: string): Promise<ItemStatus> => {
  const supabase = getSupabaseClient();

  // Get the item
  const { data: item, error: itemError } = await supabase.from('items').select('*').eq('id', itemId).single();

  if (itemError) {
    if (itemError.code === 'PGRST116') {
      throw new AppError(404, 'Item not found', ErrorCode.ITEM_NOT_FOUND);
    }
    console.error('Error fetching item:', itemError);
    throw new AppError(500, 'Failed to fetch item', ErrorCode.DATABASE_ERROR);
  }

  // Get pending reservations sum
  const { data: pendingReservations, error: pendingError } = await supabase
    .from('reservations')
    .select('quantity')
    .eq('item_id', itemId)
    .eq('status', ReservationStatus.PENDING);

  if (pendingError) {
    console.error('Error fetching pending reservations:', pendingError);
    throw new AppError(500, 'Failed to fetch reservations', ErrorCode.DATABASE_ERROR);
  }

  // Get confirmed reservations sum
  const { data: confirmedReservations, error: confirmedError } = await supabase
    .from('reservations')
    .select('quantity')
    .eq('item_id', itemId)
    .eq('status', ReservationStatus.CONFIRMED);

  if (confirmedError) {
    console.error('Error fetching confirmed reservations:', confirmedError);
    throw new AppError(500, 'Failed to fetch reservations', ErrorCode.DATABASE_ERROR);
  }

  const reservedQuantity = pendingReservations.reduce((sum, r) => sum + r.quantity, 0);
  const confirmedQuantity = confirmedReservations.reduce((sum, r) => sum + r.quantity, 0);

  // Available = Total - Reserved - Confirmed
  const availableQuantity = item.total_quantity - reservedQuantity - confirmedQuantity;

  return {
    id: item.id,
    name: item.name,
    total_quantity: item.total_quantity,
    available_quantity: availableQuantity,
    reserved_quantity: reservedQuantity,
    confirmed_quantity: confirmedQuantity,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};

/**
 * Checks if an item exists in the database.
 *
 * @param itemId - The UUID of the item to check
 * @returns True if the item exists, false otherwise
 * @throws {AppError} If the database query fails (excluding not found)
 */
export const itemExists = async (itemId: string): Promise<boolean> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from('items').select('id').eq('id', itemId).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return false;
    }
    throw new AppError(500, 'Failed to check item existence', ErrorCode.DATABASE_ERROR);
  }

  return !!data;
};
