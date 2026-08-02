export const ORDER_REFERENCE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_CONSECUTIVE_NOT_FOUND = 3;
export const TRACKING_COOLDOWN_SECONDS = 30;

export interface TrackingFailureState {
  notFoundCount: number;
  cooldownSeconds: number;
}

export const isValidOrderReference = (value: string): boolean =>
  ORDER_REFERENCE_PATTERN.test(value.trim());

export const isValidTrackingEmail = (value: string): boolean =>
  EMAIL_PATTERN.test(value.trim());

export const nextTrackingFailureState = (
  currentNotFoundCount: number,
): TrackingFailureState => {
  const nextCount = currentNotFoundCount + 1;
  return nextCount >= MAX_CONSECUTIVE_NOT_FOUND
    ? { notFoundCount: 0, cooldownSeconds: TRACKING_COOLDOWN_SECONDS }
    : { notFoundCount: nextCount, cooldownSeconds: 0 };
};
