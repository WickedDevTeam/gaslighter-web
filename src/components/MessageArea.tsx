
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

interface MessageAreaProps {
  message: string;
  type: 'error' | 'info';
}

const MessageArea: React.FC<MessageAreaProps> = ({
  message,
  type
}) => {
  if (!message) return null;
  
  return (
    <div className="mb-2 mt-1">
      <Alert 
        variant={type === 'error' ? "destructive" : "default"} 
        className={`text-sm shadow-sm ${type === 'error' ? 'border-red-500' : ''}`}
      >
        {type === 'error' ? 
          <AlertCircle className="h-4 w-4 mr-2" /> : 
          <Info className="h-4 w-4 mr-2" />
        }
        <AlertTitle className="font-medium">
          {type === 'error' ? 'Error' : 'Information'}
        </AlertTitle>
        <AlertDescription className="text-sm">
          {message}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default MessageArea;
