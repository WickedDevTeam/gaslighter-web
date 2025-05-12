import React, { useEffect } from 'react';
import SubredditInput from '@/components/SubredditInput';
import { Button } from '@/components/ui/button';
import { SortMode, TopTimeFilter, ViewMode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, Columns3, LayoutList } from 'lucide-react';
import Spinner from '@/components/Spinner';
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
  const {
    toast
  } = useToast();
  const {
    updateSettings
  } = useSettings();

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
  return <div className="p-4 rounded-lg">
      {/* First row - inputs and sort controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-3">
        {/* Left column - Inputs */}
        <div className="flex-grow space-y-3 md:space-y-0 md:flex md:gap-3">
          <SubredditInput id="targetSubreddit" label="Target Subreddit" value={targetSubreddit} onChange={onTargetChange} placeholder="e.g., news" className="md:w-1/2" />
          
          <SubredditInput id="sourceSubreddits" label="Source Subreddits (comma-separated)" value={sourceSubreddits} onChange={onSourceChange} placeholder="e.g., cats, dogpictures" isSourceField className="md:w-1/2" />
        </div>
        
        {/* Sort Controls */}
        <div className="flex gap-2 items-end">
          <div>
            <label htmlFor="sortModeSelect" className="form-label text-xs">Sort By:</label>
            <select id="sortModeSelect" className="form-input select-filter-arrow h-9 text-sm" value={sortMode} onChange={e => onSortModeChange(e.target.value as SortMode)}>
              <option value="hot">Hot</option>
              <option value="new">New</option>
              <option value="top">Top</option>
            </select>
          </div>
          
          {sortMode === 'top' && <div>
              <label htmlFor="topTimeFilterSelect" className="form-label text-xs">Top From:</label>
              <select id="topTimeFilterSelect" className="form-input select-filter-arrow h-9 text-sm" value={topTimeFilter} onChange={e => onTopTimeFilterChange(e.target.value as TopTimeFilter)}>
                <option value="day">Today</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="all">All Time</option>
              </select>
            </div>}
        </div>
      </div>
      
      {/* Second row - View controls and Gaslight button */}
      <div className="flex justify-between items-center">
        {/* View As controls */}
        <div>
          <label className="form-label text-xs block mb-1">View As:</label>
          <div className="flex justify-start">
            <ToggleGroup type="single" value={viewMode} onValueChange={value => value && onViewModeChange(value as ViewMode)} className="flex gap-1">
              <ToggleGroupItem value="compact" aria-label="Compact View" className="h-9 px-2 text-xs">
                <LayoutGrid className="h-3 w-3 mr-1" />
                <span>Compact</span>
              </ToggleGroupItem>

              <ToggleGroupItem value="large" aria-label="Large View" className="h-9 px-2 text-xs">
                <Columns3 className="h-3 w-3 mr-1" />
                <span>Large</span>
              </ToggleGroupItem>

              <ToggleGroupItem value="extra-large" aria-label="Extra Large View" className="h-9 px-2 text-xs">
                <LayoutList className="h-3 w-3 mr-1" />
                <span>XL</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        
        {/* Updated Gaslight button with improved styling */}
        <div>
          <Button onClick={handleSubmit} disabled={isLoadingPosts} className="h-11 px-8 bg-[#533ed1] hover:bg-[#604ae5] shadow-md transition-all \\n            font-medium text-base rounded-md border border-[#7E69AB]">
            {isLoadingPosts ? <>
                <Spinner size="small" />
                <span className="ml-2">Loading...</span>
              </> : 'Gaslight!'}
          </Button>
        </div>
      </div>
    </div>;
};
export default FilterControls;