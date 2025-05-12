
import React, { useEffect } from 'react';
import SubredditInput from '@/components/SubredditInput';
import { Button } from '@/components/ui/button';
import { SortMode, TopTimeFilter, ViewMode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, Columns3, LayoutList, Search, Filter } from 'lucide-react';

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
    <div className="filter-controls-container p-6 rounded-xl backdrop-blur-md">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Gaslighter Settings</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Configure your feed</span>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Subreddit Inputs */}
          <div className="subreddit-inputs space-y-4 bg-card/40 p-5 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Select Subreddits</h3>
            
            <div className="space-y-4">
              <SubredditInput 
                id="targetSubreddit" 
                label="Target Subreddit" 
                value={targetSubreddit} 
                onChange={onTargetChange} 
                placeholder="e.g., news"
                className="subreddit-input"
              />
              
              <SubredditInput 
                id="sourceSubreddits" 
                label="Source Subreddits (comma-separated)" 
                value={sourceSubreddits} 
                onChange={onSourceChange} 
                placeholder="e.g., cats, dogpictures" 
                isSourceField
                className="subreddit-input" 
              />
            </div>
          </div>
          
          {/* Right Column - View & Sort Options */}
          <div className="options-container space-y-4">
            {/* Sort Options */}
            <div className="sort-options bg-card/40 p-5 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Sort Options</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="sortModeSelect" className="block text-sm font-medium mb-1.5">
                    Sort Posts By
                  </label>
                  <select 
                    id="sortModeSelect" 
                    className="select-filter w-full rounded-md" 
                    value={sortMode} 
                    onChange={e => onSortModeChange(e.target.value as SortMode)}
                  >
                    <option value="hot">Hot</option>
                    <option value="new">New</option>
                    <option value="top">Top</option>
                  </select>
                </div>
                
                {sortMode === 'top' && (
                  <div className="time-filter-container animate-fade-in">
                    <label htmlFor="topTimeFilterSelect" className="block text-sm font-medium mb-1.5">
                      Time Period
                    </label>
                    <select 
                      id="topTimeFilterSelect" 
                      className="select-filter w-full rounded-md" 
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
            </div>
            
            {/* View Options */}
            <div className="view-options bg-card/40 p-5 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">View Layout</h3>
              
              <ToggleGroup 
                type="single" 
                value={viewMode}
                onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
                className="flex w-full justify-between p-1 bg-background rounded-lg"
              >
                <ToggleGroupItem value="compact" className="flex-1 data-[state=on]:text-primary data-[state=on]:bg-primary/10">
                  <div className="flex flex-col items-center gap-1">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="text-xs">Compact</span>
                  </div>
                </ToggleGroupItem>

                <ToggleGroupItem value="large" className="flex-1 data-[state=on]:text-primary data-[state=on]:bg-primary/10">
                  <div className="flex flex-col items-center gap-1">
                    <Columns3 className="h-4 w-4" />
                    <span className="text-xs">Medium</span>
                  </div>
                </ToggleGroupItem>

                <ToggleGroupItem value="extra-large" className="flex-1 data-[state=on]:text-primary data-[state=on]:bg-primary/10">
                  <div className="flex flex-col items-center gap-1">
                    <LayoutList className="h-4 w-4" />
                    <span className="text-xs">Large</span>
                  </div>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <Button 
          className="w-full py-6 text-base font-bold mt-2 gradient-button"
          variant="default"
          onClick={handleSubmit} 
          disabled={isLoadingPosts}
        >
          {isLoadingPosts ? 'Loading...' : '🔥 Gaslight!'}
        </Button>
      </div>
    </div>
  );
};

export default FilterControls;
