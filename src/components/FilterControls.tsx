
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
        description: "Please enter at least one target subreddit",
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
      {/* First row - inputs */}
      <div className="flex flex-col gap-4 mb-4">
        {/* Inputs */}
        <div className="flex flex-col md:flex-row gap-3">
          <SubredditInput 
            id="targetSubreddit" 
            label="Target Subreddits (comma-separated)" 
            value={targetSubreddit} 
            onChange={onTargetChange} 
            placeholder="e.g., news, politics, worldnews" 
            className="md:w-1/2" 
          />
          
          <SubredditInput 
            id="sourceSubreddits" 
            label="Source Subreddits (comma-separated)" 
            value={sourceSubreddits} 
            onChange={onSourceChange} 
            placeholder="e.g., cats, dogpictures" 
            isSourceField 
            className="md:w-1/2" 
          />
        </div>
        
        {/* Sort Controls - Better mobile layout */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label htmlFor="sortModeSelect" className="form-label text-xs">Sort By:</label>
              <select id="sortModeSelect" 
                className="form-input select-filter-arrow h-9 text-sm" 
                value={sortMode} 
                onChange={e => onSortModeChange(e.target.value as SortMode)}
                style={{ 
                  backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-chevron-down\"%3E%3Cpolyline points=\"6 9 12 15 18 9\"%3E%3C/polyline%3E%3C/svg%3E')",
                  backgroundSize: "14px"
                }}
              >
                <option value="hot">Hot</option>
                <option value="new">New</option>
                <option value="top">Top</option>
              </select>
            </div>
            
            {sortMode === 'top' && <div>
                <label htmlFor="topTimeFilterSelect" className="form-label text-xs">Top From:</label>
                <select id="topTimeFilterSelect" 
                  className="form-input select-filter-arrow h-9 text-sm" 
                  value={topTimeFilter} 
                  onChange={e => onTopTimeFilterChange(e.target.value as TopTimeFilter)}
                  style={{ 
                    backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-chevron-down\"%3E%3Cpolyline points=\"6 9 12 15 18 9\"%3E%3C/polyline%3E%3C/svg%3E')",
                    backgroundSize: "14px"
                  }}
                >
                  <option value="day">Today</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>}
          </div>

          {/* View As controls */}
          <div className="w-full sm:w-auto">
            <label className="form-label text-xs block mb-1">View As:</label>
            <ToggleGroup type="single" value={viewMode} onValueChange={value => value && onViewModeChange(value as ViewMode)} className="flex gap-1 justify-start">
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
      </div>
      
      {/* Gaslight button - Full width on mobile */}
      <div className="mt-4">
        <Button 
          onClick={handleSubmit} 
          disabled={isLoadingPosts} 
          className="h-11 px-8 bg-[#533ed1] hover:bg-[#604ae5] shadow-md transition-all
            font-medium text-base rounded-md border border-[#7E69AB] w-full sm:w-auto"
        >
          {isLoadingPosts ? <>
              <Spinner size="small" />
              <span className="ml-2">Loading...</span>
            </> : 'Gaslight!'}
        </Button>
      </div>
    </div>;
};

export default FilterControls;
