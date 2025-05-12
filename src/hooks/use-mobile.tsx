
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Create a debounced version of the handler to avoid excessive updates
    let timeoutId: number | null = null;
    
    const handleResize = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      
      timeoutId = window.setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }, 100);
    };

    // Use matchMedia and resize for better coverage
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener("change", (e) => setIsMobile(e.matches))
    } 
    // Older browsers
    else if (mql.addListener) {
      mql.addListener((e) => setIsMobile(e.matches))
    }
    
    // Also listen to resize for extra safety
    window.addEventListener("resize", handleResize)
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      
      if (mql.removeEventListener) {
        mql.removeEventListener("change", (e) => setIsMobile(e.matches))
      } else if (mql.removeListener) {
        mql.removeListener((e) => setIsMobile(e.matches))
      }
      
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return isMobile
}
