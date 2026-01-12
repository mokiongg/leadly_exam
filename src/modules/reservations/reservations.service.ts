import { getSupabaseClient } from '../../db/client';
import { AppError, ErrorCode } from '../../types';
import { itemExists } from '../items';
import { Reservation, ReservationResponse, ReservationStatus } from './types';
import { CreateReservationInput } from './reservations.schema';

// Reservation expiry time in minutes
const RESERVATION_EXPIRY_MINUTES = 1;

/**
 * Gets all reservations
 */
export const getAllReservations = async (): Promise<ReservationResponse[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from('reservations').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reservations:', error);
    throw new AppError(500, 'Failed to fetch reservations', ErrorCode.DATABASE_ERROR);
  }

  return data as ReservationResponse[];
};

/**
 * Calculates available quantity for an item.
 *
 * Available = Total - Pending (not expired) - Confirmed
 *
 * @param itemId - The UUID of the item to check availability for
 * @returns The available quantity that can be reserved
 * @throws {AppError} If database queries fail
 */
const getAvailableQuantity = async (itemId: string): Promise<number> => {
  const supabase = getSupabaseClient();

  // Get item total quantity
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('total_quantity')
    .eq('id', itemId)
    .single();

  if (itemError) {
    throw new AppError(500, 'Failed to fetch item', ErrorCode.DATABASE_ERROR);
  }

  // Get sum of pending reservations (not expired)
  const { data: pendingReservations, error: pendingError } = await supabase
    .from('reservations')
    .select('quantity')
    .eq('item_id', itemId)
    .eq('status', ReservationStatus.PENDING)
    .gt('expires_at', new Date().toISOString());

  if (pendingError) {
    throw new AppError(500, 'Failed to fetch reservations', ErrorCode.DATABASE_ERROR);
  }

  // Get sum of confirmed reservations
  const { data: confirmedReservations, error: confirmedError } = await supabase
    .from('reservations')
    .select('quantity')
    .eq('item_id', itemId)
    .eq('status', ReservationStatus.CONFIRMED);

  if (confirmedError) {
    throw new AppError(500, 'Failed to fetch reservations', ErrorCode.DATABASE_ERROR);
  }

  const pendingQty = pendingReservations.reduce((sum, r) => sum + r.quantity, 0);
  const confirmedQty = confirmedReservations.reduce((sum, r) => sum + r.quantity, 0);

  return item.total_quantity - pendingQty - confirmedQty;
};

/**
 * Creates a new reservation with a temporary hold on quantity
 */
export const createReservation = async (input: CreateReservationInput): Promise<ReservationResponse> => {
  const supabase = getSupabaseClient();

  // Check if item exists
  const exists = await itemExists(input.item_id);
  if (!exists) {
    throw new AppError(404, 'Item not found', ErrorCode.ITEM_NOT_FOUND);
  }

  // Check available quantity
  const availableQty = await getAvailableQuantity(input.item_id);
  if (availableQty < input.quantity) {
    throw new AppError(
      409,
      `Insufficient available quantity. Available: ${availableQty}, Requested: ${input.quantity}`,
      ErrorCode.INSUFFICIENT_QUANTITY
    );
  }

  // Calculate expiry time
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_EXPIRY_MINUTES);

  // Create the reservation
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      item_id: input.item_id,
      customer_id: input.customer_id,
      quantity: input.quantity,
      status: ReservationStatus.PENDING,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating reservation:', error);
    throw new AppError(500, 'Failed to create reservation', ErrorCode.DATABASE_ERROR);
  }

  return data as ReservationResponse;
};

/**
 * Gets a reservation by ID
 */
export const getReservation = async (reservationId: string): Promise<Reservation> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from('reservations').select('*').eq('id', reservationId).single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new AppError(404, 'Reservation not found', ErrorCode.RESERVATION_NOT_FOUND);
    }
    console.error('Error fetching reservation:', error);
    throw new AppError(500, 'Failed to fetch reservation', ErrorCode.DATABASE_ERROR);
  }

  return data as Reservation;
};

/**
 * Confirms a pending reservation
 * - Idempotent: confirming an already confirmed reservation returns success
 * - Cannot confirm expired or cancelled reservations
 */
export const confirmReservation = async (reservationId: string): Promise<ReservationResponse> => {
  const supabase = getSupabaseClient();

  // Get current reservation state
  const reservation = await getReservation(reservationId);

  // If already confirmed, return early and just return the reservation data
  if (reservation.status === ReservationStatus.CONFIRMED) {
    return {
      id: reservation.id,
      item_id: reservation.item_id,
      customer_id: reservation.customer_id,
      quantity: reservation.quantity,
      status: reservation.status,
      created_at: reservation.created_at,
      expires_at: reservation.expires_at,
      confirmed_at: reservation.confirmed_at,
    };
  }

  // Cannot confirm cancelled or expired reservations
  switch (reservation.status) {
    case ReservationStatus.CANCELLED:
      throw new AppError(409, 'Cannot confirm a cancelled reservation', ErrorCode.RESERVATION_CANCELLED);
    case ReservationStatus.EXPIRED:
      throw new AppError(409, 'Cannot confirm an expired reservation', ErrorCode.RESERVATION_EXPIRED);
  }

  // Check if reservation has passed expiry time (even if not yet marked expired)
  const now = new Date();
  const expiresAt = new Date(reservation.expires_at);
  if (now > expiresAt) {
    throw new AppError(409, 'Cannot confirm an expired reservation', ErrorCode.RESERVATION_EXPIRED);
  }

  // Update to confirmed - only if status is still PENDING
  const { data, error } = await supabase
    .from('reservations')
    .update({
      status: ReservationStatus.CONFIRMED,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('status', ReservationStatus.PENDING)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      const updated = await getReservation(reservationId);
      if (updated.status === ReservationStatus.CONFIRMED) {
        return updated as ReservationResponse;
      }
      throw new AppError(409, 'Reservation state changed', ErrorCode.RESERVATION_EXPIRED);
    }
    console.error('Error confirming reservation:', error);
    throw new AppError(500, 'Failed to confirm reservation', ErrorCode.DATABASE_ERROR);
  }

  return data as ReservationResponse;
};

/**
 * Cancels a pending reservation
 * - Idempotent: cancelling an already cancelled reservation returns success
 * - Cannot cancel confirmed reservations (confirmed quantity is permanent)
 * - Releases held quantity back to availability
 */
export const cancelReservation = async (reservationId: string): Promise<ReservationResponse> => {
  const supabase = getSupabaseClient();

  // Get current reservation state
  const reservation = await getReservation(reservationId);

  // If already cancelled, return early and just return the reservation data
  if (reservation.status === ReservationStatus.CANCELLED) {
    return {
      id: reservation.id,
      item_id: reservation.item_id,
      customer_id: reservation.customer_id,
      quantity: reservation.quantity,
      status: reservation.status,
      created_at: reservation.created_at,
      expires_at: reservation.expires_at,
      cancelled_at: reservation.cancelled_at,
    };
  }

  // Cannot cancel expired or confirmed reservations
  switch (reservation.status) {
    case ReservationStatus.EXPIRED:
      throw new AppError(409, 'Cannot cancel an expired reservation', ErrorCode.RESERVATION_EXPIRED);
    case ReservationStatus.CONFIRMED:
      throw new AppError(409, 'Cannot cancel a confirmed reservation', ErrorCode.RESERVATION_CONFIRMED);
  }

  // Update to cancelled - only if still PENDING
  const { data, error } = await supabase
    .from('reservations')
    .update({
      status: ReservationStatus.CANCELLED,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('status', ReservationStatus.PENDING) // Only update if still pending
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      const updated = await getReservation(reservationId);
      if (updated.status === ReservationStatus.CANCELLED || updated.status === ReservationStatus.EXPIRED) {
        return updated as ReservationResponse;
      }
      throw new AppError(409, 'Reservation state changed', ErrorCode.RESERVATION_CONFIRMED);
    }
    console.error('Error cancelling reservation:', error);
    throw new AppError(500, 'Failed to cancel reservation', ErrorCode.DATABASE_ERROR);
  }

  return data as ReservationResponse;
};
