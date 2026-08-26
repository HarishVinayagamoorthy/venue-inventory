import { Session, InvStatus } from 'shared-types';

export class AvailabilityService {
  /**
   * Returns the sessions that conflict with the requested session.
   * Based on the strict requirement:
   * Morning + Evening can coexist.
   * Full Day conflicts with Morning and Evening.
   */
  getConflictingSessions(requestedSession: Session): Session[] {
    switch (requestedSession) {
      case Session.MORNING:
        return [Session.FULL_DAY];
      case Session.EVENING:
        return [Session.FULL_DAY];
      case Session.FULL_DAY:
        return [Session.MORNING, Session.EVENING];
      default:
        return [];
    }
  }

  /**
   * Determines effective availability given the requested session and the stored statuses of all sessions for that day.
   * A session is effectively unavailable if it itself is booked/held/blocked,
   * OR if any of its conflicting sessions are booked/held/blocked.
   */
  getEffectiveAvailability(
    requestedSession: Session,
    inventoryStates: Record<Session, InvStatus | undefined>
  ): InvStatus {
    // 1. Check the requested session's own status first
    const ownStatus = inventoryStates[requestedSession] ?? InvStatus.AVAILABLE;
    if (ownStatus !== InvStatus.AVAILABLE) {
      return ownStatus;
    }

    // 2. Check conflicting sessions
    const conflictingSessions = this.getConflictingSessions(requestedSession);
    for (const conflict of conflictingSessions) {
      const conflictStatus = inventoryStates[conflict] ?? InvStatus.AVAILABLE;
      if (conflictStatus !== InvStatus.AVAILABLE) {
        // If a conflicting session is BOOKED/HOLD/BLOCKED, then this session is effectively UNAVAILABLE.
        // We'll return the conflicting status to indicate why, or map it to a generic UNAVAILABLE state.
        // The business rule implies returning the conflict reason or just preventing it.
        // Returning the conflicting status makes sense (e.g., if Morning is BOOKED, Full Day effective availability is BOOKED).
        return conflictStatus; 
      }
    }

    return InvStatus.AVAILABLE;
  }

  /**
   * Calculates the availability of all sessions for a specific date and venue space,
   * based on the raw inventory rows from the database.
   */
  getAvailableSessions(inventoryRows: { session: Session; status: InvStatus }[]) {
    // Map existing rows
    const states: Record<Session, InvStatus | undefined> = {
      [Session.MORNING]: undefined,
      [Session.EVENING]: undefined,
      [Session.FULL_DAY]: undefined,
    };

    for (const row of inventoryRows) {
      states[row.session] = row.status;
    }

    return {
      [Session.MORNING]: this.getEffectiveAvailability(Session.MORNING, states),
      [Session.EVENING]: this.getEffectiveAvailability(Session.EVENING, states),
      [Session.FULL_DAY]: this.getEffectiveAvailability(Session.FULL_DAY, states),
    };
  }

  /**
   * Assert if a session is currently available.
   * (Helper for transaction checks in Phase 3)
   */
  isInventoryAvailable(
    requestedSession: Session,
    inventoryStates: Record<Session, InvStatus | undefined>
  ): boolean {
    return this.getEffectiveAvailability(requestedSession, inventoryStates) === InvStatus.AVAILABLE;
  }
}

export const availabilityService = new AvailabilityService();
