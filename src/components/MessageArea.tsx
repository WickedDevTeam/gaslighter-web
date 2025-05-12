
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
  
  const isError = type === 'error';
  
  return (
    <div className="mb-2 mt-1">
      <Alert 
        variant={isError ? "destructive" : "default"} 
        className={`text-sm shadow-sm ${isError ? 'border-red-500' : 'border-blue-500'}`}
      >
        {isError ? (
          <AlertCircle className="h-4 w-4 mr-2" />
        ) : (
          <Info className="h-4 w-4 mr-2" />
        )}
        <AlertTitle className="font-medium">
          {isError ? 'Error' : 'Info'}
        </AlertTitle>
        <AlertDescription className="text-sm">
          {message}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default MessageArea;
