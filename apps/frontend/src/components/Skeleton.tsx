import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem' 
}) => {
  return (
    <div 
      className={`bg-zinc-800 animate-pulse rounded-2xl ${className}`}
      style={{ width, height }}
    />
  );
};

export default Skeleton;
