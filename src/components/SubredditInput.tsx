
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
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      let term = query;
      if (isSourceField) {
        term = query.split(',').pop()?.trim() || '';
      }
      
      if (term.length >= 2) {
        const results = await fetchSubredditSuggestions(term);
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
  const debouncedFetch = debounce(fetchSuggestions, 350);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSearchTerm(newValue);
    
    if (newValue && newValue.length >= 2) {
      debouncedFetch(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isSourceField) {
      const parts = value.split(',');
      parts[parts.length - 1] = suggestion;
      const newValue = parts.join(',') + ', ';
      onChange(newValue);
      setSearchTerm(newValue);
    } else {
      onChange(suggestion);
      setSearchTerm(suggestion);
    }
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
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

  return (
    <div className={cn("flex flex-col space-y-1.5 w-full", className)}>
      <label htmlFor={id} className="text-xs font-medium text-gray-400">
        {label}
      </label>
      <div className="relative w-full">
        <Input
          type="text"
          id={id}
          ref={inputRef}
          className={cn(
            "w-full bg-[#2A2A2E] border-[#444] text-white placeholder:text-gray-500",
            "transition-all duration-200 focus:ring-1 focus:ring-purple/50 focus:border-purple",
            "hover:border-[#555]",
            showSuggestions && "rounded-b-none border-b-0"
          )}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchTerm && searchTerm.length >= 2) {
              debouncedFetch(searchTerm);
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
            className="absolute z-50 w-full bg-[#2A2A2E] border border-[#444] border-t-0 rounded-b-md shadow-lg max-h-[200px] overflow-y-auto"
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
