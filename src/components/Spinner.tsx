
import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'normal';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'normal' }) => {
  const spinnerClasses = size === 'small' 
    ? 'mini-spinner h-4 w-4 border-2'
    : 'loading-spinner h-5 w-5 border-2';
  
  return (
    <div className={`${spinnerClasses} animate-spin rounded-full border-[#555555] border-b-transparent`} />
  );
};

export default Spinner;
