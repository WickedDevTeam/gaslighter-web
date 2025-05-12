
import React, { useState, useEffect } from 'react';
import { PostData } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";

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
  const isMobile = useIsMobile();
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < posts.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY;
    const swipeThreshold = 50;

    if (Math.abs(deltaY) > swipeThreshold) {
      if (deltaY < 0) { // Swipe Up
        if (currentIndex < posts.length - 1) {
          onNavigate(currentIndex + 1);
        }
      } else { // Swipe Down
        if (currentIndex > 0) {
          onNavigate(currentIndex - 1);
        }
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
  }, [isOpen, currentIndex, posts.length, onClose]);

  if (!isOpen || currentIndex < 0 || currentIndex >= posts.length) {
    return null;
  }

  // Use different rendering approach based on mobile vs desktop
  if (isMobile) {
    // Set initial slide to current index
    const initialSlide = currentIndex;
    
    return (
      <div 
        className="modal-overlay fixed inset-0 bg-black/95 z-[1000] flex flex-col"
        style={{ display: isOpen ? 'flex' : 'none' }}
      >
        <div className="absolute top-2 right-2 z-[1001]">
          <span 
            className="modal-close text-4xl text-[#A0A0A0] cursor-pointer leading-none p-1 transition-colors hover:text-white"
            onClick={onClose}
          >
            &times;
          </span>
        </div>
        
        <Carousel 
          className="w-full h-full" 
          opts={{ 
            axis: 'y',
            loop: false, 
            skipSnaps: false,
            startIndex: initialSlide
          }}
        >
          <CarouselContent className="h-full">
            {posts.map((post, index) => (
              <CarouselItem key={index} className="h-full">
                <div 
                  className="flex flex-col justify-center items-center h-full w-full"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="relative flex flex-col justify-center items-center h-full w-full">
                    {post.replacementMedia?.type === 'image' && (
                      <img 
                        src={post.replacementMedia.url} 
                        alt="Gaslit Media" 
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
                    
                    <div className="absolute bottom-4 left-4 right-4 bg-black/75 text-white text-2xl font-bold p-3 text-center leading-snug max-h-24 overflow-y-auto z-5 box-border rounded-md">
                      {post.targetPostData.title || "Untitled"}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <div className="flex items-center justify-between px-4">
            <div className="h-12 w-12 rounded-full bg-black/30 flex items-center justify-center">
              <span className="text-white/60 text-xl">↑</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-black/30 flex items-center justify-center">
              <span className="text-white/60 text-xl">↓</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view (existing layout)
  const { targetPostData, replacementMedia } = posts[currentIndex];
  const title = targetPostData.title || "Untitled";

  return (
    <div 
      className="modal-overlay fixed inset-0 bg-black/95 flex justify-center items-center z-[1000] p-1"
      style={{ display: isOpen ? 'flex' : 'none' }}
      onClick={handleOverlayClick}
    >
      <div className="modal-content bg-[#0A0A0A] rounded border border-[#2A2A2E] w-full h-full overflow-hidden relative flex flex-col items-center justify-center">
        <span 
          className="modal-close absolute top-2 right-2 text-4xl text-[#A0A0A0] cursor-pointer leading-none p-1 transition-colors hover:text-white z-[1001]"
          onClick={onClose}
        >
          &times;
        </span>
        
        <button 
          className="modal-nav-arrow prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-3 text-3xl cursor-pointer z-10 rounded transition-colors hover:bg-black/60"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          &lt;
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
          
          <h3 className="modal-title absolute bottom-4 left-4 right-4 bg-black/75 text-white text-2xl font-bold p-3 text-center leading-snug max-h-24 overflow-y-auto z-5 box-border rounded-md">
            {title}
          </h3>
        </div>
        
        <button 
          className="modal-nav-arrow next absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-3 text-3xl cursor-pointer z-10 rounded transition-colors hover:bg-black/60"
          onClick={handleNext}
          disabled={currentIndex === posts.length - 1}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default MediaModal;
