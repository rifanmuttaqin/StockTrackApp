import React from 'react';
import { MobileCard, MobileCardHeader, MobileCardTitle, MobileCardContent } from '@/Components/UI/MobileCard';
import { MobileButton } from '@/Components/UI/MobileButton';
import { cn } from '@/lib/utils';

const QuickActions = ({
  actions = [],
  title = "Aksi Cepat",
  columns = 2,
  className,
  ...props
}) => {
  const getActionIcon = (iconName) => {
    const iconClasses = "h-6 w-6";

    switch (iconName) {
      case 'add':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'users':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'inventory':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'report':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m0 0V8a2 2 0 012-2h8a2 2 0 012 2v6m0 0v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case 'settings':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'chart':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'export':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'import':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      default:
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <MobileCard
      className={cn('h-full min-h-[200px]', className)}
      {...props}
    >
      <MobileCardHeader className="pb-3">
        <MobileCardTitle className="text-lg">{title}</MobileCardTitle>
      </MobileCardHeader>

      <MobileCardContent className="pt-0">
        {actions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-poppins">Tidak ada aksi tersedia</p>
          </div>
        ) : (
          <div className={cn(
            'grid gap-3',
            gridColsClass[columns] || 'grid-cols-2'
          )}>
            {actions.map((action, index) => (
              <MobileButton
                key={`action-${action.label}-${index}`}
                variant="outline"
                size="lg"
                onClick={action.onClick}
                className={cn(
                  'flex flex-col items-center justify-center h-20 p-3 space-y-2 active:scale-95 transition-transform',
                  action.variant === 'primary' && 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
                  action.variant === 'success' && 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
                  action.variant === 'warning' && 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
                  action.variant === 'danger' && 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                )}
              >
                <div className="flex-shrink-0">
                  {getActionIcon(action.icon)}
                </div>
                <span className="text-xs font-poppins font-medium text-center leading-tight">
                  {action.label}
                </span>
              </MobileButton>
            ))}
          </div>
        )}
      </MobileCardContent>
    </MobileCard>
  );
};

export default QuickActions;
