
import { useState, useEffect, useCallback, useRef } from 'react';
import { throttle } from '@/utils/debounce';

interface AutoscrollOptions {
  isEnabled: boolean;
  speed: number;
  scrollContainer?: HTMLElement | null;
}

const SPEED_FACTOR = 0.5; // Base speed multiplier

export function useAutoscroll({ isEnabled, speed, scrollContainer }: AutoscrollOptions) {
  const [isPaused, setIsPaused] = useState(false);
  const lastUserScrollTime = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  
  // Convert speed (1-10) to actual pixel scroll amount
  const pixelsPerInterval = speed * SPEED_FACTOR;
  
  // Throttled scroll function for smooth scrolling
  const scrollPage = useCallback(
    throttle(() => {
      // Only autoscroll if enabled, not paused, and we have a container
      if (isEnabled && !isPaused && scrollContainer) {
        window.scrollBy({ top: pixelsPerInterval, behavior: 'auto' });
      }
    }, 16), // ~60fps
    [isEnabled, isPaused, scrollContainer, pixelsPerInterval]
  );
  
  // Handle user scroll events to pause autoscrolling
  const handleUserScroll = useCallback(() => {
    if (!isEnabled) return;
    
    lastUserScrollTime.current = Date.now();
    setIsPaused(true);
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    // Resume autoscrolling after 2 seconds of inactivity
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false);
      scrollTimeoutRef.current = null;
    }, 2000);
  }, [isEnabled]);
  
  // Set up scroll interval when enabled
  useEffect(() => {
    if (!isEnabled || !scrollContainer) return;
    
    const intervalId = setInterval(scrollPage, 16); // ~60fps
    
    // Add scroll event listener to detect manual scrolling
    window.addEventListener('wheel', handleUserScroll, { passive: true });
    window.addEventListener('touchmove', handleUserScroll, { passive: true });
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('wheel', handleUserScroll);
      window.removeEventListener('touchmove', handleUserScroll);
      
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isEnabled, scrollPage, handleUserScroll, scrollContainer]);
  
  return {
    isPaused,
    resumeScroll: () => setIsPaused(false),
    pauseScroll: () => setIsPaused(true),
  };
}
