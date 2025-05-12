
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, WifiOff, ShieldAlert } from "lucide-react";

interface MessageAreaProps {
  message: string;
  type: 'error' | 'info';
}

const MessageArea: React.FC<MessageAreaProps> = ({
  message,
  type
}) => {
  if (!message) return null;
  
  // Check if it's a network-related error
  const isNetworkError = message.includes('Failed to fetch') || 
                         message.includes('Network error') || 
                         message.includes('Too many requests');
  
  // Check if it might be a content restriction issue
  const isContentRestrictionError = message.includes('403') || 
                                   message.includes('private') || 
                                   message.includes('quarantined') ||
                                   message.includes('NSFW');
  
  return (
    <div className="mb-4 mt-2">
      <Alert 
        variant={type === 'error' ? "destructive" : "default"} 
        className={`text-sm shadow-md ${type === 'error' ? 'border-red-500' : ''}`}
      >
        {type === 'error' ? (
          isContentRestrictionError ? (
            <ShieldAlert className="h-4 w-4 mr-2" />
          ) : isNetworkError ? (
            <WifiOff className="h-4 w-4 mr-2" />
          ) : (
            <AlertCircle className="h-4 w-4 mr-2" />
          )
        ) : (
          <Info className="h-4 w-4 mr-2" />
        )}
        
        <AlertTitle className="font-medium">
          {isContentRestrictionError ? 'Content Restriction' : 
           isNetworkError ? 'Network Error' : 
           (type === 'error' ? 'Error' : 'Information')}
        </AlertTitle>
        
        <AlertDescription className="text-sm">
          {message}
          {isNetworkError && (
            <div className="mt-2 text-xs">
              Try again or check that Reddit is accessible from your current network.
            </div>
          )}
          {isContentRestrictionError && (
            <div className="mt-2 text-xs">
              This may be an age-restricted, private, or quarantined subreddit. 
              Try a different subreddit or ensure you're logged in to Reddit in another tab.
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default MessageArea;
