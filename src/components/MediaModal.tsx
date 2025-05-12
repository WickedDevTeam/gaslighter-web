import React, { useState, useEffect, useCallback } from 'react';
import { PostData } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { X, ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: PostData[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  onClose,
  posts,
  currentIndex,
  onNavigate
}) => {
  const [touchStartY, setTouchStartY] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const isMobile = useIsMobile();
  
  // Set up the carousel API
  useEffect(() => {
    if (!carouselApi) return;
    
    // When the carousel initializes, set it to the current slide
    carouselApi.scrollTo(currentIndex);
    
    // Add carousel change event handler
    const onChange = () => {
      const currentSlide = carouselApi.selectedScrollSnap();
      setActiveIndex(currentSlide);
      onNavigate(currentSlide);
      setShowControls(true);
    };
    
    carouselApi.on("select", onChange);
    return () => {
      carouselApi.off("select", onChange);
    };
  }, [carouselApi, currentIndex, onNavigate]);
  
  // Show controls when the current index changes
  useEffect(() => {
    if (isOpen) {
      setShowControls(true);
      
      // If carousel is initialized, scroll to the current index
      if (carouselApi) {
        carouselApi.scrollTo(currentIndex);
      }
    }
  }, [isOpen, currentIndex, carouselApi]);
  
  // Auto-hide controls on mobile after a few seconds
  useEffect(() => {
    if (isMobile && isOpen) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMobile, currentIndex, activeIndex]);
  
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      setShowControls(true);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < posts.length - 1) {
      onNavigate(currentIndex + 1);
      setShowControls(true);
    }
  }, [currentIndex, posts.length, onNavigate]);

  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setShowControls(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY;
    const swipeThreshold = 50;

    if (Math.abs(deltaY) > swipeThreshold) {
      if (deltaY < 0 && currentIndex < posts.length - 1) { // Swipe Up - Next
        onNavigate(currentIndex + 1);
      } else if (deltaY > 0 && currentIndex > 0) { // Swipe Down - Previous
        onNavigate(currentIndex - 1);
      }
    }
  }, [touchStartY, currentIndex, posts.length, onNavigate]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || currentIndex < 0 || currentIndex >= posts.length) {
    return null;
  }

  // Mobile-optimized view
  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 bg-black/95 z-[1000] flex flex-col"
        style={{ display: isOpen ? 'flex' : 'none' }}
        onClick={toggleControls}
      >
        {/* Mobile header controls */}
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-[1001] transition-opacity duration-300 bg-gradient-to-b from-black/80 to-transparent",
            showControls ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="text-white font-semibold truncate max-w-[80%]">
            {posts[activeIndex]?.targetPostData?.subreddit && (
              <span className="text-purple-400">r/{posts[activeIndex].targetPostData.subreddit}</span>
            )}
          </div>
          
          <button 
            className="media-modal-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Main carousel */}
        <Carousel 
          className="w-full h-full mobile-media-carousel" 
          setApi={setCarouselApi}
          opts={{ 
            axis: 'y',
            loop: false, 
            skipSnaps: false,
            startIndex: currentIndex
          }}
          orientation="vertical"
        >
          <CarouselContent className="h-full -mt-0 flex-col">
            {posts.map((post, index) => (
              <CarouselItem key={index} className="h-full pt-0 pb-0">
                <div 
                  className="flex flex-col justify-center items-center h-full w-full"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="relative flex flex-col justify-center items-center h-full w-full">
                    {post.replacementMedia?.type === 'image' && (
                      <img 
                        src={post.replacementMedia.url} 
                        alt={post.targetPostData.title || "Media content"} 
                        className="max-w-full max-h-full object-contain block"
                      />
                    )}
                    
                    {post.replacementMedia?.type === 'video' && (
                      <video 
                        src={post.replacementMedia.url} 
                        controls 
                        muted 
                        loop 
                        autoPlay
                        playsInline
                        className="max-w-full max-h-full object-contain block"
                      />
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Custom navigation indicators */}
          <div 
            className={cn(
              "absolute left-4 right-4 top-1/2 transform -translate-y-1/2 flex items-center justify-between pointer-events-none transition-opacity duration-300",
              showControls ? "opacity-80" : "opacity-0"
            )}
          >
            {activeIndex > 0 && (
              <div className="media-modal-swipe-indicator left-4">
                <ArrowUp className="text-white" size={24} />
              </div>
            )}
            {activeIndex < posts.length - 1 && (
              <div className="media-modal-swipe-indicator right-4">
                <ArrowDown className="text-white" size={24} />
              </div>
            )}
          </div>
        </Carousel>
        
        {/* Bottom title card */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="text-white text-lg font-bold p-2 leading-tight">
            {posts[activeIndex]?.targetPostData?.title || "Untitled"}
          </div>
          <div className="flex justify-between items-center px-2">
            <div className="text-gray-300 text-xs">
              {activeIndex + 1} of {posts.length}
            </div>
            {posts[activeIndex]?.targetPostData?.author && (
              <div className="text-gray-300 text-xs">
                Posted by u/{posts[activeIndex].targetPostData.author}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop view (existing layout with enhanced styling)
  const { targetPostData, replacementMedia } = posts[currentIndex];
  const title = targetPostData?.title || "Untitled";

  return (
    <div 
      className="modal-overlay fixed inset-0 bg-black/90 flex justify-center items-center z-[1000] p-4"
      style={{ display: isOpen ? 'flex' : 'none' }}
      onClick={handleOverlayClick}
    >
      <div className="modal-content bg-[#0A0A0A] rounded-xl border border-[#333333] w-full h-full overflow-hidden relative flex flex-col items-center justify-center">
        <button 
          className="modal-close absolute top-4 right-4 text-white cursor-pointer z-[1001]"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        
        <button 
          className="modal-nav-arrow prev absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white cursor-pointer z-10 rounded-full p-2"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="modal-media-wrapper w-full h-full flex relative justify-center items-center overflow-hidden bg-black">
          {replacementMedia?.type === 'image' && (
            <img 
              src={replacementMedia.url} 
              alt="Gaslit Media" 
              className="max-w-full max-h-full object-contain block"
            />
          )}
          
          {replacementMedia?.type === 'video' && (
            <video 
              src={replacementMedia.url} 
              controls 
              muted 
              loop 
              playsInline
              className="max-w-full max-h-full object-contain block"
            />
          )}
          
          <h3 className="modal-title absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-sm text-white text-2xl font-bold p-4 text-center leading-snug max-h-32 overflow-y-auto z-5 box-border rounded-lg">
            {title}
          </h3>
        </div>
        
        <button 
          className="modal-nav-arrow next absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white cursor-pointer z-10 rounded-full p-2"
          onClick={handleNext}
          disabled={currentIndex === posts.length - 1}
          aria-label="Next"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default MediaModal;
