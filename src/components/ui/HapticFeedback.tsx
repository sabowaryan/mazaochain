'use client';

import { useEffect } from 'react';

interface HapticFeedbackProps {
  trigger: boolean;
  type?: 'light' | 'medium' | 'heavy';
}

export function HapticFeedback({ trigger, type = 'light' }: HapticFeedbackProps) {
  useEffect(() => {
    if (!trigger) return;

    // Check if the device supports haptic feedback
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      
      navigator.vibrate(patterns[type]);
    }
  }, [trigger, type]);

  return null;
}

// Hook for haptic feedback
export function useHapticFeedback() {
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      
      navigator.vibrate(patterns[type]);
    }
  };

  return { triggerHaptic };
}