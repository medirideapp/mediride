import { RideStatus } from '@prisma/client';

/** Allowed transitions for the NEMT ride state machine */
const TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  REQUESTED: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
  ACCEPTED: [RideStatus.ARRIVING, RideStatus.CANCELLED],
  ARRIVING: [RideStatus.IN_PROGRESS, RideStatus.CANCELLED],
  IN_PROGRESS: [RideStatus.COMPLETED, RideStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const ACTIVE_STATUSES: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.ACCEPTED,
  RideStatus.ARRIVING,
  RideStatus.IN_PROGRESS,
];
