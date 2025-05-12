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
  return;
};
export default MessageArea;