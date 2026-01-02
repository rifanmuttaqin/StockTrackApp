import React from 'react';
import { MobileCard, MobileCardHeader, MobileCardTitle, MobileCardContent } from '@/Components/UI/MobileCard';
import { cn } from '@/lib/utils';

const StatCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  trend = 'up',
  className,
  ...props
}) => {
  const changeColorClasses = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  const iconBgClasses = {
    positive: 'bg-green-100 text-green-600',
    negative: 'bg-red-100 text-red-600',
    neutral: 'bg-blue-100 text-blue-600',
  };

  return (
    <MobileCard
      className={cn('h-full min-h-[120px] active:scale-[0.98] transition-transform', className)}
      {...props}
    >
      <MobileCardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                iconBgClasses[changeType]
              )}>
                {icon}
              </div>
            )}
            <div>
              <p className="text-sm font-poppins text-gray-600">{title}</p>
              <p className="text-2xl font-poppins font-semibold text-gray-900 mt-1">
                {value}
              </p>
            </div>
          </div>
        </div>
      </MobileCardHeader>

      {change && (
        <MobileCardContent className="pt-0">
          <div className={cn(
            'inline-flex items-center rounded-lg px-2 py-1 text-xs font-poppins font-medium',
            changeColorClasses[changeType]
          )}>
            {trend === 'up' && (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {change}
          </div>
        </MobileCardContent>
      )}
    </MobileCard>
  );
};

export default StatCard;
