import React from 'react';

interface EnterpriseSkeletonTableProps {
  rows?: number;
  columns?: number;
  colWidths?: string[];
  className?: string;
}

/**
 * EnterpriseSkeletonTable
 * Renders high-fidelity animated shimmer rows inside table bodies to eliminate jarring spinners
 * and deliver zero-perceived-latency UI transitions.
 *
 * MOTION UNITY (DEBT PAID): bars run the canonical `animate-shimmer`
 * (single shimmer vocabulary with the Design System `Skeleton`). The old
 * row-level `animate-pulse` plus a static gradient (whose `animationDelay`
 * never animated anything) is gone.
 */
export const EnterpriseSkeletonTable: React.FC<EnterpriseSkeletonTableProps> = ({
  rows = 5,
  columns = 6,
  colWidths = ['w-24', 'w-48', 'w-32', 'w-28', 'w-20', 'w-16'],
  className = ''
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr
          key={`skel-row-${rIdx}`}
          className={`border-b border-slate-100 dark:border-zinc-800/80 ${className}`}
        >
          {Array.from({ length: columns }).map((_, cIdx) => {
            const widthClass = colWidths[cIdx % colWidths.length] || 'w-28';
            return (
              <td key={`skel-cell-${rIdx}-${cIdx}`} className="p-3.5">
                <div className="flex items-center gap-2">
                  {cIdx === 0 && (
                    <div className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-zinc-800 shrink-0 animate-shimmer" />
                  )}
                  <div
                    className={`h-4 animate-shimmer rounded-lg ${widthClass}`}
                    style={{
                      animationDelay: `${(rIdx * 100) + (cIdx * 40)}ms`
                    }}
                  />
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
};

export default EnterpriseSkeletonTable;
