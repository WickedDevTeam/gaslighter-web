
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface MessageAreaProps {
  message: string;
  type: 'error' | 'info';
}

const MessageArea: React.FC<MessageAreaProps> = ({
  message,
  type
}) => {
  // Only render error messages, not info messages
  if (!message || type === 'info') return null;
  
  return (
    <div className="mb-2 mt-1">
      <Alert variant="destructive" className="text-sm shadow-sm border-red-500">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle className="font-medium">
          Error
        </AlertTitle>
        <AlertDescription className="text-sm">
          {message}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default MessageArea;
