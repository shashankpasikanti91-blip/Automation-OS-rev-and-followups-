'use client';

import { Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: any[];
  loading?: boolean;
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Activity Stream</h3>
          <p className="text-xs text-muted-foreground">Recent actions</p>
        </div>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton-pulse h-7 w-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="skeleton-pulse h-3 w-full" />
                <div className="skeleton-pulse h-2.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {activities.map((act) => (
            <div key={act.id} className="flex gap-3 group">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary text-xs font-bold">
                  {(act.user?.name ?? 'S').charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-snug line-clamp-2">{act.description}</p>
                {act.organization && (
                  <p className="text-2xs text-muted-foreground mt-0.5">{act.organization.name}</p>
                )}
                <p className="text-2xs text-muted-foreground/60 mt-0.5">
                  {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
