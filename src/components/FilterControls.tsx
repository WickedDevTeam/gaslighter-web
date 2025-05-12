
import React, { useEffect } from 'react';
import SubredditInput from '@/components/SubredditInput';
import { Button } from '@/components/ui/button';
import { SortMode, TopTimeFilter, ViewMode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, Columns3, LayoutList } from 'lucide-react';

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
    <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#333333] shadow-lg">
      <div className="flex flex-col md:flex-row gap-3 items-end">
        {/* Input Fields */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3">
          <SubredditInput 
            id="targetSubreddit" 
            label="Target Subreddit" 
            value={targetSubreddit} 
            onChange={onTargetChange} 
            placeholder="e.g., news"
            className="input-animation"
          />
          
          <SubredditInput 
            id="sourceSubreddits" 
            label="Source Subreddits (comma-separated)" 
            value={sourceSubreddits} 
            onChange={onSourceChange} 
            placeholder="e.g., cats, dogpictures" 
            isSourceField 
            className="input-animation"
          />
        </div>
        
        {/* Sort and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 md:self-end">
          {/* Sort Controls */}
          <div className="flex gap-2 items-end">
            <div className="w-24">
              <label htmlFor="sortModeSelect" className="form-label text-xs">Sort By</label>
              <select 
                id="sortModeSelect" 
                className="form-input select-filter-arrow h-9 text-sm rounded-md bg-[#2A2A2E] border-[#444] text-white w-full transition-all hover:border-[#555]" 
                value={sortMode} 
                onChange={e => onSortModeChange(e.target.value as SortMode)}
              >
                <option value="hot">Hot</option>
                <option value="new">New</option>
                <option value="top">Top</option>
              </select>
            </div>
            
            {sortMode === 'top' && (
              <div className="w-24">
                <label htmlFor="topTimeFilterSelect" className="form-label text-xs">From</label>
                <select 
                  id="topTimeFilterSelect" 
                  className="form-input select-filter-arrow h-9 text-sm rounded-md bg-[#2A2A2E] border-[#444] text-white w-full transition-all hover:border-[#555]" 
                  value={topTimeFilter} 
                  onChange={e => onTopTimeFilterChange(e.target.value as TopTimeFilter)}
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
          
          {/* View Controls */}
          <div>
            <label className="form-label text-xs block mb-1">View</label>
            <ToggleGroup 
              type="single" 
              value={viewMode}
              onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
              className="flex bg-[#222] rounded-md p-1 border border-[#333]"
            >
              <ToggleGroupItem value="compact" aria-label="Compact View" className="h-7 w-9 flex justify-center items-center rounded-sm data-[state=on]:bg-[#333] data-[state=on]:text-white transition-colors">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>

              <ToggleGroupItem value="large" aria-label="Large View" className="h-7 w-9 flex justify-center items-center rounded-sm data-[state=on]:bg-[#333] data-[state=on]:text-white transition-colors">
                <Columns3 className="h-4 w-4" />
              </ToggleGroupItem>

              <ToggleGroupItem value="extra-large" aria-label="Extra Large View" className="h-7 w-9 flex justify-center items-center rounded-sm data-[state=on]:bg-[#333] data-[state=on]:text-white transition-colors">
                <LayoutList className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* Gaslight Button */}
          <Button 
            className="h-9 bg-gradient-to-r from-purple to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium px-4 rounded-md shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow min-w-[100px]" 
            onClick={handleSubmit} 
            disabled={isLoadingPosts}
          >
            {isLoadingPosts ? 'Loading...' : 'Gaslight!'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
