
import React, { useEffect, useState, useRef } from 'react';
import { fetchSubredditSuggestions } from '@/utils/redditApi';
import { debounce } from '@/utils/debounce';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SubredditInputProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  isSourceField?: boolean;
  className?: string;
}

const SubredditInput: React.FC<SubredditInputProps> = ({
  id,
  label,
  value,
  placeholder,
  onChange,
  isSourceField = false,
  className,
}) => {
  const [suggestions, setSuggestions] = useState<Array<{ name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = async (query: string, position: number) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Extract the current subreddit being typed
      const allSubs = query.split(',');
      let currentSubIndex = 0;
      let currentPosition = 0;
      
      // Find which subreddit is being edited based on cursor position
      for (let i = 0; i < allSubs.length; i++) {
        currentPosition += allSubs[i].length + (i > 0 ? 1 : 0); // +1 for the comma
        if (position <= currentPosition) {
          currentSubIndex = i;
          break;
        }
      }
      
      const currentSub = allSubs[currentSubIndex].trim();
      
      if (currentSub.length >= 2) {
        const results = await fetchSubredditSuggestions(currentSub);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the fetch function
  const debouncedFetch = debounce((query: string, position: number) => fetchSuggestions(query, position), 350);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setSearchTerm(newValue);
    setCursorPosition(cursorPos);
    
    if (newValue && newValue.length >= 2) {
      debouncedFetch(newValue, cursorPos);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Split the input value by commas
    const parts = value.split(',');
    let charCount = 0;
    let targetIndex = 0;
    
    // Find which part the cursor is in
    for (let i = 0; i < parts.length; i++) {
      charCount += parts[i].length + (i > 0 ? 1 : 0); // +1 for comma
      if (cursorPosition <= charCount) {
        targetIndex = i;
        break;
      }
    }
    
    // Replace that part with the suggestion
    parts[targetIndex] = suggestion;
    
    // Join back with commas and add a trailing comma+space if not at the end
    let newValue = parts.join(',');
    if (targetIndex === parts.length - 1) {
      newValue += ', ';
    }
    
    onChange(newValue);
    setSearchTerm(newValue);
    
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Focus the input and place cursor after the inserted suggestion
    inputRef.current?.focus();
    
    // Calculate new cursor position
    let newPosition = 0;
    for (let i = 0; i <= targetIndex; i++) {
      newPosition += parts[i].length;
      if (i < targetIndex) newPosition += 1; // Add 1 for each comma before our target
    }
    
    if (targetIndex === parts.length - 1) newPosition += 2; // Add 2 for the trailing comma and space
    
    // Set cursor position after a short delay to ensure input has updated
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = newPosition;
        inputRef.current.selectionEnd = newPosition;
      }
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Update the searchTerm when value changes from outside
    if (value !== searchTerm) {
      setSearchTerm(value);
    }
  }, [value, searchTerm]);
  
  // Handle cursor movement
  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const cursorPos = e.currentTarget.selectionStart || 0;
    setCursorPosition(cursorPos);
    
    // Re-fetch suggestions based on the new cursor position
    if (searchTerm && searchTerm.length >= 2) {
      debouncedFetch(searchTerm, cursorPos);
    }
  };

  return (
    <div className={cn("flex flex-col space-y-1.5 w-full", className)}>
      <label htmlFor={id} className="text-sm font-medium text-white/80">
        {label}
      </label>
      <div className="relative w-full">
        <Input
          type="text"
          id={id}
          ref={inputRef}
          className={cn(
            "w-full bg-[#2A2A2E] border-[#444] text-white placeholder:text-gray-500",
            showSuggestions && "rounded-b-none border-b-0"
          )}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onSelect={handleSelect}
          onFocus={() => {
            if (searchTerm && searchTerm.length >= 2) {
              debouncedFetch(searchTerm, inputRef.current?.selectionStart || 0);
            }
          }}
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          </div>
        )}
        
        {showSuggestions && (
          <div 
            ref={suggestionsRef}
            className="absolute z-50 w-full bg-[#2A2A2E] border border-[#444] rounded-b-md shadow-lg max-h-[200px] overflow-y-auto"
          >
            {suggestions.length > 0 ? (
              suggestions.map((sub, index) => (
                <div
                  key={`${sub.name}-${index}`}
                  className="px-3 py-2 cursor-pointer hover:bg-[#3A3A3E] text-white transition-colors"
                  onClick={() => handleSuggestionClick(sub.name)}
                >
                  r/{sub.name}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-400 italic">No matches found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubredditInput;
