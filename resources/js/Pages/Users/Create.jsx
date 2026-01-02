import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import UserForm from '../../Components/Forms/UserForm';
import { MobileUserForm } from '../../Components/Users';
import Alert from '../../Components/Alert';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';

const Create = ({ roles, errors }) => {
  const { can, hasRole } = usePermission();
  const { isMobile } = useMobileDetection();
  const { props } = usePage();

  // Permission check - only admin or users with users.create permission can access
  if (!hasRole('admin') && !can('users.create')) {
    return (
      <AppLayout title="Access Denied">
        <Head title="Access Denied" />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Access Denied
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  You don't have permission to create users. Please contact your administrator.
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Create User">
      <Head title="Create User" />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href={route('dashboard')} className="text-gray-700 hover:text-gray-900 inline-flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Dashboard
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <a href={route('users.index')} className="ml-1 text-gray-700 hover:text-gray-900 md:ml-2">
                  Users
                </a>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-gray-500 md:ml-2">Create User</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Create New User
            </h2>
          </div>
        </div>

        {/* Flash Messages */}
        {props.flash?.success && (
          <Alert type="success" message={props.flash.success} className="mb-4" />
        )}
        {props.flash?.error && (
          <Alert type="error" message={props.flash.error} className="mb-4" />
        )}

        {isMobile ? (
          <MobileUserForm
            roles={roles}
            userRoles={[]}
            isEditing={false}
            errors={errors}
          />
        ) : (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  User Information
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fill in the user information below. All fields marked with * are required.
                </p>
              </div>

              <UserForm
                roles={roles}
                userRoles={[]}
                isEditing={false}
                errors={errors}
              />
            </div>
          </div>
        )}

        {/* Help Section - Responsive */}
        <div className={`mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 ${isMobile ? 'rounded-lg' : ''}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                User Creation Tips
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Password must be at least 8 characters long</li>
                  <li>Email address must be unique and valid</li>
                  <li>Assign at least one role for proper access control</li>
                  <li>New users will be created with "active" status by default</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Create;
