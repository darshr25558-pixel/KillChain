import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, Shield } from 'lucide-react';

export type BadgeVariant = 'safe' | 'warn' | 'crit' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon = true,
  className = '',
  size = 'md',
}) => {
  const getIcon = () => {
    if (!icon) return null;
    const iconSize = size === 'sm' ? 11 : 13;
    switch (variant) {
      case 'safe':
        return <CheckCircle2 size={iconSize} className="badge-icon" />;
      case 'warn':
        return <AlertTriangle size={iconSize} className="badge-icon" />;
      case 'crit':
        return <AlertOctagon size={iconSize} className="badge-icon" />;
      case 'info':
        return <Info size={iconSize} className="badge-icon" />;
      default:
        return <Shield size={iconSize} className="badge-icon" />;
    }
  };

  return (
    <span className={`ui-badge ui-badge-${variant} ui-badge-${size} ${className}`} role="status">
      {getIcon()}
      <span>{children}</span>
    </span>
  );
};

