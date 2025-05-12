import React from 'react';
interface MessageAreaProps {
  message: string;
  type: 'error' | 'info';
}
const MessageArea: React.FC<MessageAreaProps> = ({
  message,
  type
}) => {
  if (!message) return;
  return <div className={`mt-2.5 min-h-[1.25em] text-xs text-center ${type === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
      {message}
    </div>;
};
export default MessageArea;