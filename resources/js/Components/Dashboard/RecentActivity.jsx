import React from 'react';
import { MobileCard, MobileCardHeader, MobileCardTitle, MobileCardContent } from '@/Components/UI/MobileCard';
import { MobileButton } from '@/Components/UI/MobileButton';
import { cn } from '@/lib/utils';

const RecentActivity = ({
  activities = [],
  title = "Aktivitas Terakhir",
  showViewAll = true,
  onViewAllClick,
  className,
  ...props
}) => {
  const getActivityIcon = (type) => {
    const iconClasses = "h-5 w-5";

    switch (type) {
      case 'user':
        return (
          <svg className={cn(iconClasses, "text-blue-600")} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
      case 'inventory':
        return (
          <svg className={cn(iconClasses, "text-green-600")} fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'report':
        return (
          <svg className={cn(iconClasses, "text-purple-600")} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
          </svg>
        );
      case 'settings':
        return (
          <svg className={cn(iconClasses, "text-gray-600")} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className={cn(iconClasses, "text-gray-600")} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  };

  return (
    <MobileCard
      className={cn('h-full min-h-[280px]', className)}
      {...props}
    >
      <MobileCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <MobileCardTitle className="text-lg">{title}</MobileCardTitle>
          {showViewAll && (
            <MobileButton
              variant="ghost"
              size="sm"
              onClick={onViewAllClick}
              className="text-blue-600"
            >
              Lihat Semua
            </MobileButton>
          )}
        </div>
      </MobileCardHeader>

      <MobileCardContent className="pt-0">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-poppins">Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity, index) => (
              <div
                key={`activity-${activity.type}-${activity.title}-${index}`}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer min-h-[60px]"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-poppins font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs font-poppins text-gray-600 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  <p className="text-xs font-poppins text-gray-500 mt-2">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </MobileCardContent>
    </MobileCard>
  );
};

export default RecentActivity;
