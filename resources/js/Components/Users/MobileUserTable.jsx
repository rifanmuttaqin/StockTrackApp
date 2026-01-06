import React, { useState, memo, useCallback, useMemo } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import MobileCard from '../UI/MobileCard';
import MobileButton from '../UI/MobileButton';
import MobileAlert from '../UI/MobileAlert';
import { Modal, LoadingSpinner } from '../UI';
import MobileUserCard from './MobileUserCard';
import { usePermission } from '../../Hooks/usePermission';
import { useDebouncedCallback, useStableCallback } from '../../utils/performance';

const MobileUserTable = ({
  users,
  roles,
  filters = {},
  meta,
  onFilterChange,
  onSortChange,
  onDelete,
  onToggleStatus,
  onAssignRole
}) => {
  // Helper function to get users array from either direct array or pagination object
  const getUsersArray = () => {
    if (Array.isArray(users)) {
      return users;
    }
    if (users && users.data && Array.isArray(users.data)) {
      return users.data;
    }
    return [];
  };

  const usersArray = getUsersArray();
  const { can } = usePermission();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { delete: destroy, processing } = useForm();

  const handleDelete = useCallback((user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedUser) {
      destroy(route('users.destroy', selectedUser.id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        },
      });
    }
  }, [selectedUser, destroy]);

  const handleToggleStatus = useCallback((user) => {
    setSelectedUser(user);
    // Jika user suspended, tidak bisa toggle status biasa
    if (user.status === 'suspended') {
      alert('Pengguna yang ditangguhkan harus diaktifkan kembali terlebih dahulu melalui tombol Unsuspend.');
      return;
    }
    // Toggle antara active dan inactive
    setNewStatus(user.status === 'active' ? 'inactive' : 'active');
    setShowStatusModal(true);
  }, []);

  const confirmStatusToggle = useCallback(() => {
    if (selectedUser) {
      router.patch(route('users.toggle-status', selectedUser.id), { status: newStatus });
      setShowStatusModal(false);
      setSelectedUser(null);
    }
  }, [selectedUser, newStatus]);

  const handleAssignRole = useCallback((user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  }, []);

  const confirmRoleAssignment = useCallback(() => {
    if (selectedUser && selectedRole) {
      onAssignRole(selectedUser.id, selectedRole);
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole(null);
    }
  }, [selectedUser, selectedRole, onAssignRole]);

  const handleView = useCallback((user) => {
    window.location.href = route('users.show', user.id);
  }, []);

  const handleEdit = useCallback((user) => {
    window.location.href = route('users.edit', user.id);
  }, []);

  const handleSortToggle = useCallback((field) => {
    const currentOrder = filters.order === 'asc' ? 'desc' : 'asc';
    onSortChange(field, currentOrder);
  }, [filters.order, onSortChange]);

  const getSortIcon = useCallback((field) => {
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
  }, [filters.sort, filters.order]);

  // Memoize user count text
  const userCountText = useMemo(() => {
    return `${usersArray.length} user${usersArray.length !== 1 ? 's' : ''}`;
  }, [usersArray.length]);

  // Memoize filter options
  const roleOptions = useMemo(() => {
    return roles.map((role) => (
      <option key={role.id} value={role.id}>
        {role.name}
      </option>
    ));
  }, [roles]);

  return (
    <>
      <div className="space-y-4">
        {/* Search and Filters */}
        <MobileCard>
          <div className="p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={filters.search || ''}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 pr-10 border"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

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
                Filter & Sort
              </MobileButton>

              <span className="text-sm text-gray-500">
                {userCountText}
              </span>
            </div>
          </div>
        </MobileCard>

        {/* Expanded Filters */}
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
                  {roleOptions}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
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
            </div>
          </MobileCard>
        )}

        {/* User Cards */}
        {usersArray.length === 0 ? (
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
            </div>
          </MobileCard>
        ) : (
          <div>
            {usersArray.map((user, userIndex) => (
              <MobileUserCard
                key={`mobile-user-${user.id || userIndex}-${userIndex}`}
                user={user}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onAssignRole={handleAssignRole}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Apakah Anda yakin ingin menghapus user "{selectedUser?.name}"? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <MobileButton
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            disabled={processing}
          >
            Batal
          </MobileButton>
          <MobileButton
            variant="danger"
            onClick={confirmDelete}
            disabled={processing}
          >
            {processing ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Menghapus...</span>
              </>
            ) : (
              'Hapus'
            )}
          </MobileButton>
        </div>
      </Modal>

      {/* Status Toggle Confirmation Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Konfirmasi Ubah Status"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Apakah Anda yakin ingin mengubah status user "{selectedUser?.name}" menjadi "{newStatus === 'active' ? 'Aktif' : 'Tidak Aktif'}"?
          </p>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <MobileButton
            variant="outline"
            onClick={() => setShowStatusModal(false)}
          >
            Batal
          </MobileButton>
          <MobileButton
            variant="primary"
            onClick={confirmStatusToggle}
          >
            Ubah Status
          </MobileButton>
        </div>
      </Modal>

      {/* Role Assignment Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Assign Role"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-4">
            Pilih role untuk user "{selectedUser?.name}":
          </p>
          <div className="space-y-2">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center">
                <input
                  type="radio"
                  id={`role-modal-${role.id}`}
                  name="role"
                  value={role.id}
                  checked={selectedRole === role.id}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={`role-modal-${role.id}`} className="ml-2 block text-sm text-gray-900">
                  {role.name}
                  <span className="ml-2 text-xs text-gray-500">({role.description})</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <MobileButton
            variant="outline"
            onClick={() => setShowRoleModal(false)}
          >
            Batal
          </MobileButton>
          <MobileButton
            variant="primary"
            onClick={confirmRoleAssignment}
            disabled={!selectedRole}
          >
            Assign Role
          </MobileButton>
        </div>
      </Modal>
    </>
  );
};

export default MobileUserTable;
