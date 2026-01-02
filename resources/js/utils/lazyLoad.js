import { lazy } from 'react';

// Lazy load mobile components for better performance
export const LazyMobileDashboard = lazy(() => import('@/Components/Dashboard/MobileDashboard'));
export const LazyMobileUserTable = lazy(() => import('@/Components/Users/MobileUserTable'));
export const LazyMobileUserForm = lazy(() => import('@/Components/Users/MobileUserForm'));
export const LazyMobileUserCard = lazy(() => import('@/Components/Users/MobileUserCard'));
export const LazyMobileUserActions = lazy(() => import('@/Components/Users/MobileUserActions'));
export const LazyMobileLayout = lazy(() => import('@/Components/Layouts/MobileLayout'));
export const LazyMobileMenu = lazy(() => import('@/Components/Navigation/MobileMenu'));
export const LazyMobileLogin = lazy(() => import('@/Components/Auth/MobileLogin'));

// Lazy load heavy UI components
export const LazyModal = lazy(() => import('@/Components/Modal'));
export const LazyLoadingSpinner = lazy(() => import('@/Components/LoadingSpinner'));

// Preload critical components
export const preloadCriticalComponents = () => {
  import('@/Components/Dashboard/MobileDashboard');
  import('@/Components/Users/MobileUserTable');
};

// Dynamic import helper for code splitting
export const dynamicImport = (importFunction) => {
  return lazy(importFunction);
};
