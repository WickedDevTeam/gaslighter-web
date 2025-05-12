
import React, { useEffect } from 'react';
import SubredditInput from '@/components/SubredditInput';
import { Button } from '@/components/ui/button';
import { SortMode, TopTimeFilter, ViewMode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useIsMobile } from '@/hooks/use-mobile';
import { Layout, LayoutGrid, Sliders } from 'lucide-react';

interface FilterControlsProps {
  targetSubreddit: string;
  sourceSubreddits: string;
  viewMode: ViewMode;
  sortMode: SortMode;
  topTimeFilter: TopTimeFilter;
  isLoadingPosts: boolean;
  onTargetChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSortModeChange: (mode: SortMode) => void;
  onTopTimeFilterChange: (filter: TopTimeFilter) => void;
  onSubmit: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  targetSubreddit,
  sourceSubreddits,
  viewMode,
  sortMode,
  topTimeFilter,
  isLoadingPosts,
  onTargetChange,
  onSourceChange,
  onViewModeChange,
  onSortModeChange,
  onTopTimeFilterChange,
  onSubmit,
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
      topTimeFilter
    });
  }, [targetSubreddit, sourceSubreddits, viewMode, sortMode, topTimeFilter, updateSettings]);

  const handleSubmit = () => {
    // Validate fields
    if (!targetSubreddit.trim()) {
      toast({
        title: "Target subreddit required",
        description: "Please enter a target subreddit",
        variant: "destructive",
      });
      return;
    }
    
    if (!sourceSubreddits.trim()) {
      toast({
        title: "Source subreddits required",
        description: "Please enter at least one source subreddit",
        variant: "destructive",
      });
      return;
    }
    
    onSubmit();
  };

  return (
    <div className="p-3">
      <div className="flex flex-col space-y-3">
        {/* Main inputs row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-2/5">
            <SubredditInput 
              id="targetSubreddit" 
              label="Target Subreddit" 
              value={targetSubreddit} 
              onChange={onTargetChange} 
              placeholder="e.g., news"
            />
          </div>
          <div className="w-full sm:w-3/5">
            <SubredditInput 
              id="sourceSubreddits" 
              label="Source Subreddits" 
              value={sourceSubreddits} 
              onChange={onSourceChange} 
              placeholder="e.g., cats, dogpictures" 
              isSourceField 
            />
          </div>
        </div>
        
        {/* Controls row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          {/* View mode toggle */}
          <div className="w-full sm:w-auto">
            <label className="form-label mb-1 block">View Mode</label>
            <ToggleGroup type="single" value={viewMode} onValueChange={(val) => val && onViewModeChange(val as ViewMode)} className="border rounded-md">
              <ToggleGroupItem value="list" aria-label="List view">
                <Layout className="h-4 w-4 mr-1" /> List
              </ToggleGroupItem>
              <ToggleGroupItem value="gallery" aria-label="Gallery view">
                <LayoutGrid className="h-4 w-4 mr-1" /> Gallery
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* Sort mode */}
          <div className="w-full sm:w-auto">
            <label htmlFor="sortModeSelect" className="form-label mb-1 block">Sort By</label>
            <Tabs value={sortMode} onValueChange={(val) => onSortModeChange(val as SortMode)} className="w-full">
              <TabsList className="w-full bg-[#1A1A1A] border border-[#333333]">
                <TabsTrigger value="hot" className="flex-1">Hot</TabsTrigger>
                <TabsTrigger value="new" className="flex-1">New</TabsTrigger>
                <TabsTrigger value="top" className="flex-1">Top</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Time filter */}
          {sortMode === 'top' && (
            <div className="w-full sm:w-auto">
              <label htmlFor="topTimeFilterSelect" className="form-label mb-1 block">Time Period</label>
              <select 
                id="topTimeFilterSelect" 
                className="form-input select-filter-arrow w-full h-10 rounded-md" 
                value={topTimeFilter} 
                onChange={e => onTopTimeFilterChange(e.target.value as TopTimeFilter)}
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          )}
          
          {/* Submit button */}
          <div className={`w-full ${isMobile ? 'mt-2' : 'sm:w-auto sm:ml-auto'}`}>
            <Button 
              className="w-full h-10 flex items-center gap-2"
              onClick={handleSubmit} 
              disabled={isLoadingPosts}
            >
              <Sliders className="h-4 w-4" />
              {isLoadingPosts ? 'Loading...' : 'Gaslight!'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
