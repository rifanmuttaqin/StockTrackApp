import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full';

  const variants = {
    default: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 min-w-[1.25rem] h-5',
    md: 'text-sm px-2.5 py-0.5 min-w-[1.5rem] h-6',
    lg: 'text-base px-3 py-1 min-w-[1.75rem] h-7',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

export default Badge;
