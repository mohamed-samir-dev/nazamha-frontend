"use client";
import React, { InputHTMLAttributes, useId } from 'react';

// Replaces raw <input className="form-input"> across all pages
// Example: app/dashboard/settings/page.tsx (Grade names, prefix inputs)

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  style,
  ...props
}: InputProps) {
  const uniqueId = useId();
  const generatedId = id || uniqueId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
      {label && <label htmlFor={generatedId} className="form-label" style={{ marginBottom: 0 }}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none', zIndex: 1 }}>
            {leftIcon}
          </span>
        )}
        <input
          id={generatedId}
          aria-invalid={!!error}
          aria-describedby={error ? `${generatedId}-error` : undefined}
          className={`form-input ${className}`}
          style={{ width: '100%', paddingRight: leftIcon ? '2.25rem' : undefined, paddingLeft: rightIcon ? '2.25rem' : undefined, ...style }}
          {...props}
        />
        {rightIcon && (
          <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', zIndex: 1 }}>
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span id={`${generatedId}-error`} role="alert" style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</span>}
    </div>
  );
}
