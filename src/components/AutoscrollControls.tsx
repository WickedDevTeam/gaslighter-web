
import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ArrowDown, ArrowRight, FastForward } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AutoscrollControlsProps {
  isEnabled: boolean;
  speed: number;
  isPaused?: boolean;
  onToggle: (enabled: boolean) => void;
  onSpeedChange: (speed: number) => void;
}

const AutoscrollControls: React.FC<AutoscrollControlsProps> = ({
  isEnabled,
  speed,
  isPaused,
  onToggle,
  onSpeedChange
}) => {
  // Define speed presets
  const SPEED_PRESETS = {
    SLOW: 8,
    MEDIUM: 5,
    FAST: 2
  };
  
  // Track open state and update when isEnabled changes
  const [isOpen, setIsOpen] = useState(true);
  
  // Auto-expand when autoscroll is enabled
  useEffect(() => {
    if (isEnabled) {
      setIsOpen(true);
    }
  }, [isEnabled]);
  
  return <div className="fixed bottom-4 right-4 z-50">
      {isEnabled && isPaused && <div className="fixed bottom-16 right-4 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full animate-fade-in">
          Autoscroll paused (manual scroll)
        </div>}
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[180px]">
        <div className="bg-[#1A1F2C] border border-[#333333] rounded-lg shadow-lg overflow-hidden backdrop-blur-sm transition-all duration-300">
          <div className="p-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Switch checked={isEnabled} onCheckedChange={onToggle} id="autoscroll-toggle" className="data-[state=checked]:bg-green-500" />
                <label htmlFor="autoscroll-toggle" className="text-sm font-medium cursor-pointer text-white">
                  Autoscroll
                </label>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-white">
                  {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent>
              {isEnabled && <div className="flex flex-col space-y-2 animate-fade-in">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                    <span>Speed</span>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button size="sm" variant={speed === SPEED_PRESETS.SLOW ? "default" : "outline"} onClick={() => onSpeedChange(SPEED_PRESETS.SLOW)} className={`justify-start ${speed === SPEED_PRESETS.SLOW ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'text-gray-800 bg-gray-200 hover:bg-gray-300'}`}>
                      <ArrowDown size={16} className="mr-2" />
                      Slow
                    </Button>
                    <Button size="sm" variant={speed === SPEED_PRESETS.MEDIUM ? "default" : "outline"} onClick={() => onSpeedChange(SPEED_PRESETS.MEDIUM)} className={`justify-start ${speed === SPEED_PRESETS.MEDIUM ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'text-gray-800 bg-gray-200 hover:bg-gray-300'}`}>
                      <ArrowRight size={16} className="mr-2" />
                      Medium
                    </Button>
                    <Button size="sm" variant={speed === SPEED_PRESETS.FAST ? "default" : "outline"} onClick={() => onSpeedChange(SPEED_PRESETS.FAST)} className={`justify-start ${speed === SPEED_PRESETS.FAST ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'text-gray-800 bg-gray-200 hover:bg-gray-300'}`}>
                      <FastForward size={16} className="mr-2" />
                      Fast
                    </Button>
                  </div>
                </div>}
            </CollapsibleContent>
          </div>
        </div>
      </Collapsible>
    </div>;
};

export default AutoscrollControls;
