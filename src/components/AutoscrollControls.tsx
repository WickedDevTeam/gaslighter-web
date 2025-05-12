
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Volume1, Volume2, VolumeX } from 'lucide-react';

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

  return <div className="fixed bottom-4 right-4 z-50">
      {isEnabled && isPaused && <div className="fixed bottom-16 right-4 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full animate-fade-in">
          Autoscroll paused (manual scroll)
        </div>}
      
      <div className="bg-[#1A1F2C] border border-[#333333] rounded-lg shadow-lg overflow-hidden backdrop-blur-sm transition-all duration-300">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Switch checked={isEnabled} onCheckedChange={onToggle} id="autoscroll-toggle" className="data-[state=checked]:bg-green-500" />
              <label htmlFor="autoscroll-toggle" className="text-sm font-medium cursor-pointer text-white">
                Autoscroll
              </label>
            </div>
          </div>
          
          {isEnabled && (
            <div className="flex flex-col space-y-2 animate-fade-in">
              <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                <span>Speed</span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant={speed === SPEED_PRESETS.SLOW ? "default" : "outline"}
                  onClick={() => onSpeedChange(SPEED_PRESETS.SLOW)}
                  className={`flex-1 ${speed === SPEED_PRESETS.SLOW ? 'bg-green-500 hover:bg-green-600' : ''}`}
                >
                  <Volume1 size={16} className="mr-1" />
                  Slow
                </Button>
                <Button 
                  size="sm" 
                  variant={speed === SPEED_PRESETS.MEDIUM ? "default" : "outline"}
                  onClick={() => onSpeedChange(SPEED_PRESETS.MEDIUM)}
                  className={`flex-1 ${speed === SPEED_PRESETS.MEDIUM ? 'bg-green-500 hover:bg-green-600' : ''}`}
                >
                  <Volume2 size={16} className="mr-1" />
                  Medium
                </Button>
                <Button 
                  size="sm" 
                  variant={speed === SPEED_PRESETS.FAST ? "default" : "outline"}
                  onClick={() => onSpeedChange(SPEED_PRESETS.FAST)}
                  className={`flex-1 ${speed === SPEED_PRESETS.FAST ? 'bg-green-500 hover:bg-green-600' : ''}`}
                >
                  <VolumeX size={16} className="mr-1" />
                  Fast
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>;
};

export default AutoscrollControls;
