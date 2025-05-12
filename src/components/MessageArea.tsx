
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, WifiOff } from "lucide-react";

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
  
  return (
    <div className="mb-4 mt-2">
      <Alert 
        variant={type === 'error' ? "destructive" : "default"} 
        className={`text-sm shadow-md ${type === 'error' ? 'border-red-500' : ''}`}
      >
        {type === 'error' ? 
          (isNetworkError ? <WifiOff className="h-4 w-4 mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />) : 
          <Info className="h-4 w-4 mr-2" />
        }
        <AlertTitle className="font-medium">
          {isNetworkError ? 'Network Error' : (type === 'error' ? 'Error' : 'Information')}
        </AlertTitle>
        <AlertDescription className="text-sm">
          {message}
          {isNetworkError && (
            <div className="mt-2 text-xs">
              Try again or check that Reddit is accessible from your current network.
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default MessageArea;
