import React from 'react';
import { GraduationCap } from 'lucide-react';

export interface SpinnerProps {
  fullScreen?: boolean;
}

export function Spinner({ fullScreen = true }: SpinnerProps) {
  const icon = (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 ring-1 ring-teal-500/30 shadow-lg shadow-teal-500/10 animate-pulse">
      <GraduationCap className="h-8 w-8 text-teal-400" strokeWidth={1.5} />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080c14]">
        {icon}
      </div>
    );
  }

  return (
    <div className="loading-wrapper">
      {icon}
    </div>
  );
}
