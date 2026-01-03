import React, { useState } from 'react';
import MobileCard from '../UI/MobileCard';
import MobileButton from '../UI/MobileButton';
import MobileInput from '../UI/MobileInput';
import MobileUserCard from './MobileUserCard';
import { usePermission } from '../../Hooks/usePermission';

const MobileUserList = ({
  users,
  roles,
  filters = {},
  onFilterChange,
  onSortChange,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onAssignRole
}) => {
  const { can } = usePermission();
  const [showFilters, setShowFilters] = useState(false);

  const handleSortToggle = (field) => {
    const currentOrder = filters.order === 'asc' ? 'desc' : 'asc';
    onSortChange(field, currentOrder);
  };

  const getSortIcon = (field) => {
    if (filters.sort !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return filters.order === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <MobileCard>
        <div className="p-4">
          <MobileInput
            type="text"
            placeholder="Cari nama atau email..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full"
          />

          <div className="flex justify-between items-center mt-3">
            <MobileButton
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </MobileButton>

            <span className="text-sm text-gray-500">
              {users.length} user{users.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </MobileCard>

      {/* Filters */}
      {showFilters && (
        <MobileCard>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={filters.role || ''}
                onChange={(e) => onFilterChange('role', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                <option value="">Semua Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => onFilterChange('status', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MobileButton
                variant="outline"
                size="sm"
                onClick={() => handleSortToggle('name')}
                className="flex items-center justify-center"
              >
                <span className="mr-1">Nama</span>
                {getSortIcon('name')}
              </MobileButton>

              <MobileButton
                variant="outline"
                size="sm"
                onClick={() => handleSortToggle('email')}
                className="flex items-center justify-center"
              >
                <span className="mr-1">Email</span>
                {getSortIcon('email')}
              </MobileButton>

              <MobileButton
                variant="outline"
                size="sm"
                onClick={() => handleSortToggle('status')}
                className="flex items-center justify-center"
              >
                <span className="mr-1">Status</span>
                {getSortIcon('status')}
              </MobileButton>

              <MobileButton
                variant="outline"
                size="sm"
                onClick={() => handleSortToggle('last_login_at')}
                className="flex items-center justify-center"
              >
                <span className="mr-1">Login</span>
                {getSortIcon('last_login_at')}
              </MobileButton>
            </div>
          </div>
        </MobileCard>
      )}

      {/* User Cards */}
      {users.length === 0 ? (
        <MobileCard>
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.role || filters.status
                ? 'Try adjusting your search or filters'
                : 'Get started by creating a new user'}
            </p>
            {can('users.create') && !filters.search && !filters.role && !filters.status && (
              <div className="mt-6">
                <MobileButton
                  variant="primary"
                  onClick={() => window.location.href = route('users.create')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add User
                </MobileButton>
              </div>
            )}
          </div>
        </MobileCard>
      ) : (
        <div>
          {users.map((user) => (
            <MobileUserCard
              key={`mobile-list-user-${user.id || index}-${index}`}
              user={user}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              onAssignRole={onAssignRole}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileUserList;
