import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  copyable?: boolean;
  truncate?: boolean;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  copyable = true,
  truncate = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // fallback if clipboard API is restricted
    }
  };

  return (
    <div className={`ui-code-block ${truncate ? 'is-truncated' : ''} ${className}`}>
      <code className="ui-code-text" title={children}>
        {children}
      </code>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className={`ui-code-copy ${copied ? 'is-copied' : ''}`}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <Check size={13} className="text-safe" /> : <Copy size={13} />}
        </button>
      )}
    </div>
  );
};

