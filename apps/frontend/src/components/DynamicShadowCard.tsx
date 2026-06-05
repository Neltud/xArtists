import React from 'react';

interface DynamicShadowCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'hover' | 'glow' | 'elevated';
  className?: string;
  onClick?: () => void;
}

const shadowVariants = {
  default: 'shadow-card',
  hover: 'shadow-card hover:shadow-card-hover',
  glow: 'shadow-card hover:shadow-glow-violet',
  elevated: 'shadow-elevated',
};

export const DynamicShadowCard: React.FC<DynamicShadowCardProps> = ({
  children,
  variant = 'default',
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-zinc-900 border border-zinc-800 rounded-3xl p-6
        transition-all duration-300
        ${shadowVariants[variant]}
        ${onClick ? 'cursor-pointer active:scale-[0.985]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default DynamicShadowCard;
