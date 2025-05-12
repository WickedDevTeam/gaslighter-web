import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';
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
  const [isOpen, setIsOpen] = React.useState(true);
  return <div className="fixed bottom-4 right-4 z-50">
      {isEnabled && isPaused && <div className="fixed bottom-16 right-4 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full animate-fade-in">
          Autoscroll paused (manual scroll)
        </div>}
      
      <div className="bg-[#1A1F2C] border border-[#333333] rounded-lg shadow-lg overflow-hidden backdrop-blur-sm transition-all duration-300">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Switch checked={isEnabled} onCheckedChange={onToggle} id="autoscroll-toggle" className="data-[state=checked]:bg-green" />
              <label htmlFor="autoscroll-toggle" className="text-sm font-medium cursor-pointer text-white">
                Autoscroll
              </label>
            </div>
          </div>
          
          {isEnabled && <div className="flex items-center space-x-3 animate-fade-in">
              <span className="text-xs text-gray-300">Slow</span>
              <Slider value={[speed]} min={1} max={10} step={1} onValueChange={value => onSpeedChange(value[0])} className="w-40" />
              <span className="text-xs text-gray-300">Fast</span>
            </div>}
        </div>
      </div>
    </div>;
};
export default AutoscrollControls;