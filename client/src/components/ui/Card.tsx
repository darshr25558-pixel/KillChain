import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface CardProps {
  step?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  accent?: 'none' | 'indigo' | 'crit' | 'warn' | 'safe' | 'accent';
}

export const Card: React.FC<CardProps> = ({
  step,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
  className = '',
  accent = 'none',
}) => {
  return (
    <section className={`ui-card ui-card-accent-${accent} ${className}`}>
      <div className="ui-card-header">
        <div className="ui-card-header-left">
          {step && <span className="ui-card-step">{step}</span>}
          {Icon && (
            <div className="ui-card-header-icon">
              <Icon size={16} />
            </div>
          )}
          <div className="ui-card-title-group">
            <h3 className="ui-card-title">{title}</h3>
            {subtitle && <p className="ui-card-subtitle">{subtitle}</p>}
          </div>
        </div>
        {badge && <div className="ui-card-header-right">{badge}</div>}
      </div>
      <div className="ui-card-body">{children}</div>
    </section>
  );
};
