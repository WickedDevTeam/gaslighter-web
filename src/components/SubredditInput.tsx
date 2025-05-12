
import React, { useEffect, useState, useRef } from 'react';
import { fetchSubredditSuggestions } from '@/utils/redditApi';
import { debounce } from '@/utils/debounce';

interface SubredditInputProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  isSourceField?: boolean;
}

const SubredditInput: React.FC<SubredditInputProps> = ({
  id,
  label,
  value,
  placeholder,
  onChange,
  isSourceField = false,
}) => {
  const [suggestions, setSuggestions] = useState<Array<{ name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = async (query: string) => {
    if (isSourceField) {
      const term = query.split(',').pop()?.trim() || '';
      if (term) {
        const results = await fetchSubredditSuggestions(term);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      if (query) {
        const results = await fetchSubredditSuggestions(query);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  // Debounce the fetch function
  const debouncedFetch = debounce(fetchSuggestions, 350);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    debouncedFetch(newValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isSourceField) {
      const parts = value.split(',');
      parts[parts.length - 1] = suggestion;
      onChange(parts.join(',') + ', ');
    } else {
      onChange(suggestion);
    }
    setShowSuggestions(false);
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
    if (inputRef.current === document.activeElement && value) {
      if (isSourceField) {
        const term = value.split(',').pop()?.trim();
        if (term) debouncedFetch(value);
      } else {
        debouncedFetch(value);
      }
    }
  }, [value, isSourceField]);

  return (
    <div className="input-wrapper relative">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        type="text"
        id={id}
        ref={inputRef}
        className="form-input w-full placeholder-opacity-100"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value) {
            if (isSourceField) {
              const term = value.split(',').pop()?.trim();
              if (term) debouncedFetch(value);
            } else {
              debouncedFetch(value);
            }
          }
        }}
        autoComplete="off"
      />
      
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="suggestions-container absolute bg-[#1A1A1A] border border-[#2A2A2E] border-t-0 rounded-b-md z-60 max-h-40 overflow-y-auto w-full shadow-md"
        >
          {suggestions.slice(0, 7).map((sub) => (
            <div
              key={sub.name}
              className="suggestion-item p-1.5 cursor-pointer text-[#D1D5DB] text-xs hover:bg-[#27272A] hover:text-white"
              onClick={() => handleSuggestionClick(sub.name)}
            >
              {sub.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubredditInput;
