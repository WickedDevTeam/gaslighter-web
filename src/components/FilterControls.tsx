
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
    <div className="p-4 rounded-lg">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left column - Inputs */}
        <div className="flex-grow space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SubredditInput 
              id="targetSubreddit" 
              label="Target Subreddit" 
              value={targetSubreddit} 
              onChange={onTargetChange} 
              placeholder="e.g., news"
            />
            
            <SubredditInput 
              id="sourceSubreddits" 
              label="Source Subreddits (comma-separated)" 
              value={sourceSubreddits} 
              onChange={onSourceChange} 
              placeholder="e.g., cats, dogpictures" 
              isSourceField 
            />
          </div>
        </div>
        
        {/* Right column - Controls and Button */}
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          {/* Sort Controls */}
          <div className="flex-grow">
            <div className="flex gap-2 items-end">
              <div className="flex-grow">
                <label htmlFor="sortModeSelect" className="form-label text-xs">Sort By:</label>
                <select 
                  id="sortModeSelect" 
                  className="form-input select-filter-arrow h-9 text-sm" 
                  value={sortMode} 
                  onChange={e => onSortModeChange(e.target.value as SortMode)}
                >
                  <option value="hot">Hot</option>
                  <option value="new">New</option>
                  <option value="top">Top</option>
                </select>
              </div>
              
              {sortMode === 'top' && (
                <div className="flex-grow">
                  <label htmlFor="topTimeFilterSelect" className="form-label text-xs">Top From:</label>
                  <select 
                    id="topTimeFilterSelect" 
                    className="form-input select-filter-arrow h-9 text-sm" 
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
          </div>
          
          {/* View Controls */}
          <div>
            <label className="form-label text-xs block mb-1">View As:</label>
            <ToggleGroup 
              type="single" 
              value={viewMode}
              onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
              className="flex gap-1"
            >
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
          
          {/* Gaslight Button */}
          <Button 
            className="h-9 bg-purple-500 hover:bg-purple-600 text-white" 
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
