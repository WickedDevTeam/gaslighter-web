
import React, { useEffect } from 'react';
import SubredditInput from '@/components/SubredditInput';
import { Button } from '@/components/ui/button';
import { SortMode, TopTimeFilter, ViewMode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-4">
          <SubredditInput 
            id="targetSubreddit" 
            label="Target Subreddit" 
            value={targetSubreddit} 
            onChange={onTargetChange} 
            placeholder="e.g., news"
          />
          <div>
            <label className="form-label">View As:</label>
            <div className="flex space-x-2 mt-1">
              <button 
                className={`secondary-button flex-1 ${viewMode === 'list' ? 'active' : ''}`} 
                onClick={() => onViewModeChange('list')}
              >
                List
              </button>
              <button 
                className={`secondary-button flex-1 ${viewMode === 'gallery' ? 'active' : ''}`} 
                onClick={() => onViewModeChange('gallery')}
              >
                Gallery
              </button>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <SubredditInput 
            id="sourceSubreddits" 
            label="Source Subreddits (comma-separated)" 
            value={sourceSubreddits} 
            onChange={onSourceChange} 
            placeholder="e.g., cats, dogpictures" 
            isSourceField 
          />
          <div>
            <label htmlFor="sortModeSelect" className="form-label">Sort By:</label>
            <select 
              id="sortModeSelect" 
              className="form-input select-filter-arrow w-full" 
              value={sortMode} 
              onChange={e => onSortModeChange(e.target.value as SortMode)}
            >
              <option value="hot">Hot</option>
              <option value="new">New</option>
              <option value="top">Top</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4 flex flex-col">
          <div className="flex-grow">
            {sortMode === 'top' && (
              <div className="mb-4">
                <label htmlFor="topTimeFilterSelect" className="form-label">Top From:</label>
                <select 
                  id="topTimeFilterSelect" 
                  className="form-input select-filter-arrow w-full" 
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
          </div>
          
          <Button 
            className="w-full h-10" 
            variant="default"
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
