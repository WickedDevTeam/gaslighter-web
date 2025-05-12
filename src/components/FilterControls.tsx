
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
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
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              
              {sortMode === 'top' && (
                <div className="mt-2">
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
            
            <div>
              <label className="form-label">View As:</label>
              <ToggleGroup 
                type="single" 
                value={viewMode}
                onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
                className="flex flex-col gap-2 mt-1"
              >
                <ToggleGroupItem value="compact" aria-label="Compact View" className="w-full justify-start gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span>Compact (4 cols)</span>
                </ToggleGroupItem>

                <ToggleGroupItem value="large" aria-label="Large View" className="w-full justify-start gap-2">
                  <Columns3 className="h-4 w-4" />
                  <span>Large (2 cols)</span>
                </ToggleGroupItem>

                <ToggleGroupItem value="extra-large" aria-label="Extra Large View" className="w-full justify-start gap-2">
                  <LayoutList className="h-4 w-4" />
                  <span>Extra Large (1 col)</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          
          <Button 
            className="w-full h-10 mt-4" 
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
