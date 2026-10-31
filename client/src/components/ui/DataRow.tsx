import React from 'react';

interface DataRowProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}

export const DataRow: React.FC<DataRowProps> = ({ label, children, hint, className = '' }) => {
  return (
    <div className={`ui-data-row ${className}`}>
      <div className="ui-data-label-col">
        <span className="ui-data-label">{label}</span>
        {hint && <span className="ui-data-hint">{hint}</span>}
      </div>
      <div className="ui-data-value-col">{children}</div>
    </div>
  );
};

