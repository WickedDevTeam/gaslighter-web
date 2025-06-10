
import React, { useEffect } from 'react';
import SubredditInput from '@/components/SubredditInput';
import { Button } from '@/components/ui/button';
import { SortMode, TopTimeFilter, ViewMode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, Columns3, LayoutList } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { useIsMobile } from '@/hooks/use-mobile';

interface FilterControlsProps {
  targetSubreddit: string;
  sourceSubreddits: string;
  viewMode: ViewMode;
  sortMode: SortMode;
  topTimeFilter: TopTimeFilter;
  isLoadingPosts: boolean;
  isAutoscrollEnabled: boolean;
  autoscrollSpeed: number;
  onTargetChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSortModeChange: (mode: SortMode) => void;
  onTopTimeFilterChange: (filter: TopTimeFilter) => void;
  onAutoscrollToggle: (enabled: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onSubmit: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  targetSubreddit,
  sourceSubreddits,
  viewMode,
  sortMode,
  topTimeFilter,
  isLoadingPosts,
  isAutoscrollEnabled,
  autoscrollSpeed,
  onTargetChange,
  onSourceChange,
  onViewModeChange,
  onSortModeChange,
  onTopTimeFilterChange,
  onAutoscrollToggle,
  onSpeedChange,
  onSubmit
}) => {
  const { toast } = useToast();
  const { updateSettings } = useSettings();
  const isMobile = useIsMobile();

  // Update settings when controls change
  useEffect(() => {
    updateSettings({
      targetSubreddit,
      sourceSubreddits,
      viewMode,
      sortMode,
      topTimeFilter,
      isAutoscrollEnabled,
      autoscrollSpeed
    });
  }, [targetSubreddit, sourceSubreddits, viewMode, sortMode, topTimeFilter, isAutoscrollEnabled, autoscrollSpeed, updateSettings]);

  const handleSubmit = () => {
    // Validate fields
    if (!targetSubreddit.trim()) {
      toast({
        title: "Target subreddit required",
        description: "Please enter a target subreddit",
        variant: "destructive"
      });
      return;
    }
    if (!sourceSubreddits.trim()) {
      toast({
        title: "Source subreddits required",
        description: "Please enter at least one source subreddit",
        variant: "destructive"
      });
      return;
    }
    onSubmit();
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      {/* Input fields row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-400 text-sm mb-2">Target Subreddit</label>
          <input
            type="text"
            value={targetSubreddit}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="CelebPegging"
            className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-2">Source Subreddits (comma-separated)</label>
          <input
            type="text"
            value={sourceSubreddits}
            onChange={(e) => onSourceChange(e.target.value)}
            placeholder="dualipa"
            className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none"
          />
          <p className="text-gray-500 text-xs mt-1">Separate multiple subreddits with commas</p>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        {/* Left side - Sort controls */}
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Sort By:</label>
            <select
              value={sortMode}
              onChange={(e) => onSortModeChange(e.target.value as SortMode)}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:border-gray-500 focus:outline-none appearance-none pr-8"
              style={{
                backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"%3E%3Cpolyline points=\"6 9 12 15 18 9\"%3E%3C/polyline%3E%3C/svg%3E')",
                backgroundPosition: "right 8px center",
                backgroundRepeat: "no-repeat"
              }}
            >
              <option value="hot">Hot</option>
              <option value="new">New</option>
              <option value="top">Top</option>
            </select>
          </div>

          {sortMode === 'top' && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">Top From:</label>
              <select
                value={topTimeFilter}
                onChange={(e) => onTopTimeFilterChange(e.target.value as TopTimeFilter)}
                className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:border-gray-500 focus:outline-none appearance-none pr-8"
                style={{
                  backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"%3E%3Cpolyline points=\"6 9 12 15 18 9\"%3E%3C/polyline%3E%3C/svg%3E')",
                  backgroundPosition: "right 8px center",
                  backgroundRepeat: "no-repeat"
                }}
              >
                <option value="day">Today</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          )}
        </div>

        {/* Right side - View mode controls */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">View As:</label>
          <div className="flex gap-1">
            <button
              onClick={() => onViewModeChange('compact')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'compact'
                  ? 'bg-gray-700 text-white border border-gray-600'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              <LayoutGrid size={16} />
              Compact
            </button>
            
            <button
              onClick={() => onViewModeChange('large')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'large'
                  ? 'bg-yellow-600 text-black border border-yellow-500'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              <Columns3 size={16} />
              Large
            </button>
            
            <button
              onClick={() => onViewModeChange('extra-large')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'extra-large'
                  ? 'bg-gray-700 text-white border border-gray-600'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              <LayoutList size={16} />
              XL
            </button>
          </div>
        </div>
      </div>

      {/* Gaslight button */}
      <div className="mt-6">
        <Button
          onClick={handleSubmit}
          disabled={isLoadingPosts}
          className="bg-yellow-600 hover:bg-yellow-500 text-black font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50"
        >
          {isLoadingPosts ? (
            <>
              <Spinner size="small" />
              <span className="ml-2">Loading...</span>
            </>
          ) : (
            'Gaslight!'
          )}
        </Button>
      </div>
    </div>
  );
};

export default FilterControls;
