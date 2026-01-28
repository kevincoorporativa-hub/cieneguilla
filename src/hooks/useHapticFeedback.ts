import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHapticFeedback() {
  const vibrate = useCallback((type: HapticType = 'light') => {
    // Check if vibration API is available
    if (!navigator.vibrate) return;

    // Different vibration patterns for different feedback types
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 25,
      heavy: 50,
      success: [10, 50, 30], // Short-pause-longer
      warning: [30, 30, 30], // Three equal pulses
      error: [50, 30, 50, 30, 50], // Three heavy pulses
    };

    try {
      navigator.vibrate(patterns[type]);
    } catch (error) {
      // Silently fail if vibration not supported
      console.debug('Haptic feedback not available');
    }
  }, []);

  const lightTap = useCallback(() => vibrate('light'), [vibrate]);
  const mediumTap = useCallback(() => vibrate('medium'), [vibrate]);
  const heavyTap = useCallback(() => vibrate('heavy'), [vibrate]);
  const successFeedback = useCallback(() => vibrate('success'), [vibrate]);
  const warningFeedback = useCallback(() => vibrate('warning'), [vibrate]);
  const errorFeedback = useCallback(() => vibrate('error'), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    successFeedback,
    warningFeedback,
    errorFeedback,
  };
}
