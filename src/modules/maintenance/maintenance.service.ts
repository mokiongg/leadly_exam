import { getSupabaseClient } from '../../db/client';
import { AppError, ErrorCode } from '../../types';
import { ExpireReservationsResult } from './types';

/**
 * Expires all pending reservations that have passed their expiry time
 * - Marks them as EXPIRED status
 * - Releases their quantity back to availability
 */
export const expireReservations = async (): Promise<ExpireReservationsResult> => {
  const supabase = getSupabaseClient();

  const now = new Date().toISOString();

  // Find all pending reservations that have expired
  const { data: expiredReservations, error: fetchError } = await supabase
    .from('reservations')
    .select('id')
    .eq('status', 'PENDING')
    .lt('expires_at', now);

  if (fetchError) {
    console.error('Error fetching expired reservations:', fetchError);
    throw new AppError(500, 'Failed to fetch expired reservations', ErrorCode.DATABASE_ERROR);
  }

  // Return early if no expired reservations
  if (!expiredReservations || expiredReservations.length === 0) {
    return {
      expired_count: 0,
      expired_reservation_ids: [],
    };
  }

  const expiredIds = expiredReservations.map((reservation) => reservation.id);

  // Update all expired reservations to EXPIRED status
  const { error: updateError } = await supabase
    .from('reservations')
    .update({ status: 'EXPIRED' })
    .in('id', expiredIds)
    .eq('status', 'PENDING');

  if (updateError) {
    console.error('Error updating expired reservations:', updateError);
    throw new AppError(500, 'Failed to expire reservations', ErrorCode.DATABASE_ERROR);
  }

  return {
    expired_count: expiredIds.length,
    expired_reservation_ids: expiredIds,
  };
};
