import React, { useState } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import Alert from '../Alert';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';
import { usePermission } from '../../Hooks/usePermission';

const UserTable = ({
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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const { delete: destroy, processing } = useForm();

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      destroy(route('users.destroy', selectedUser.id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        },
      });
    }
  };

  const handleToggleStatus = (user) => {
    setSelectedUser(user);
    setNewStatus(user.status === 'active' ? 'inactive' : 'active');
    setShowStatusModal(true);
  };

  const confirmStatusToggle = () => {
    if (selectedUser) {
      router.patch(route('users.toggle-status', selectedUser.id), { status: newStatus });
      setShowStatusModal(false);
      setSelectedUser(null);
    }
  };

  const handleAssignRole = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const confirmRoleAssignment = () => {
    if (selectedUser && selectedRole) {
      onAssignRole(selectedUser.id, selectedRole);
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole(null);
    }
  };

  const handleSuspendUser = (user) => {
    setSelectedUser(user);
    // Show a prompt for suspension reason
    const reason = prompt('Alasan penangguhan (opsional):');
    if (reason !== null) {
      router.post(route('users.suspend', user.id), { reason });
    }
  };

  const handleUnsuspendUser = (user) => {
    if (confirm(`Apakah Anda yakin ingin mengaktifkan kembali pengguna "${user.name}"?`)) {
      router.post(route('users.unsuspend', user.id));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Tidak Aktif' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditangguhkan' },
    };

    const config = statusConfig[status] || statusConfig.inactive;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  {can('users.edit') && (
                    <button
                      onClick={() => {
                        setBulkAction('activate');
                        setShowBulkModal(true);
                      }}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Activate
                    </button>
                  )}
                  {can('users.edit') && (
                    <button
                      onClick={() => {
                        setBulkAction('deactivate');
                        setShowBulkModal(true);
                      }}
                      className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Deactivate
                    </button>
                  )}
                  {can('users.suspend') && (
                    <button
                      onClick={() => {
                        setBulkAction('suspend');
                        setShowBulkModal(true);
                      }}
                      className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Suspend
                    </button>
                  )}
                  {can('users.unsuspend') && (
                    <button
                      onClick={() => {
                        setBulkAction('unsuspend');
                        setShowBulkModal(true);
                      }}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Unsuspend
                    </button>
                  )}
                  {can('users.delete') && (
                    <button
                      onClick={() => {
                        setBulkAction('delete');
                        setShowBulkModal(true);
                      }}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={filters.search || ''}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <select
                value={filters.role || ''}
                onChange={(e) => onFilterChange('role', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
              <select
                value={filters.status || ''}
                onChange={(e) => onFilterChange('status', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300" role="table" aria-label="Daftar pengguna">
              <thead className="bg-gray-50">
                <tr role="row">
                  {can('users.edit') || can('users.delete') ? (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === usersArray.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(usersArray.map(user => user.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </th>
                  ) : null}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => onSortChange('name')}
                    aria-label="Sort by name"
                  >
                    <div className="flex items-center">
                      Nama
                      {filters.sort === 'name' && (
                        <span className="ml-1">
                          {filters.order === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => onSortChange('email')}
                    aria-label="Sort by email"
                  >
                    <div className="flex items-center">
                      Email
                      {filters.sort === 'email' && (
                        <span className="ml-1">
                          {filters.order === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" aria-label="Role">
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => onSortChange('status')}
                    aria-label="Sort by status"
                  >
                    <div className="flex items-center">
                      Status
                      {filters.sort === 'status' && (
                        <span className="ml-1">
                          {filters.order === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => onSortChange('last_login_at')}
                    aria-label="Sort by last login"
                  >
                    <div className="flex items-center">
                      Last Login
                      {filters.sort === 'last_login_at' && (
                        <span className="ml-1">
                          {filters.order === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
                {usersArray.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      Tidak ada data user
                    </td>
                  </tr>
                ) : (
                  usersArray.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50" role="row">
                      {can('users.edit') || can('users.delete') ? (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </td>
                      ) : null}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.last_login_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2" role="group" aria-label={`Aksi untuk pengguna ${user.name}`}>
                          {can('users.view') && (
                            <Link
                              href={route('users.show', user.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Lihat detail pengguna"
                              aria-label={`Lihat detail ${user.name}`}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          )}
                          {can('users.edit') && (
                            <Link
                              href={route('users.edit', user.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit pengguna"
                              aria-label={`Edit ${user.name}`}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                          )}
                          {can('users.assign-role') && (
                            <button
                              onClick={() => handleAssignRole(user)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Assign role"
                              aria-label={`Assign role untuk ${user.name}`}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </button>
                          )}
                          {can('users.edit') && (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Toggle status pengguna"
                              aria-label={`Toggle status ${user.name}`}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          )}
                          {can('users.suspend') && user.status !== 'suspended' && (
                            <button
                              onClick={() => handleSuspendUser(user)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Suspend pengguna"
                              aria-label={`Suspend ${user.name}`}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728a9 9 0 01-12.728-12.728M12 9v2m0 4v2" />
                              </svg>
                            </button>
                          )}
                          {can('users.unsuspend') && user.status === 'suspended' && (
                            <button
                              onClick={() => handleUnsuspendUser(user)}
                              className="text-green-600 hover:text-green-900"
                              title="Unsuspend pengguna"
                              aria-label={`Unsuspend ${user.name}`}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2l-4-4m6 4l-4-4m2 4v-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6m2-4v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                              </svg>
                            </button>
                          )}
                          {can('users.delete') && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="text-red-600 hover:text-red-900"
                              title="Hapus pengguna"
                              aria-label={`Hapus ${user.name}`}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowDeleteModal(false)}
            disabled={processing}
          >
            Batal
          </button>
          <button
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
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
          </button>
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
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowStatusModal(false)}
          >
            Batal
          </button>
          <button
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={confirmStatusToggle}
          >
            Ubah Status
          </button>
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
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
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowRoleModal(false)}
          >
            Batal
          </button>
          <button
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={confirmRoleAssignment}
            disabled={!selectedRole}
          >
            Assign Role
          </button>
        </div>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={`Confirm ${bulkAction} ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`}
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Are you sure you want to {bulkAction} {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}? This action cannot be undone.
          </p>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowBulkModal(false)}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              bulkAction === 'delete'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : bulkAction === 'activate'
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : bulkAction === 'deactivate'
                ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                : bulkAction === 'suspend'
                ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                : bulkAction === 'unsuspend'
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
            onClick={() => {
              const executeBulkAction = async () => {
                try {
                  if (bulkAction === 'delete') {
                    for (const userId of selectedUsers) {
                      await router.delete(route('users.destroy', userId));
                    }
                  } else if (bulkAction === 'activate') {
                    for (const userId of selectedUsers) {
                      await router.patch(route('users.toggle-status', userId), { status: 'active' });
                    }
                  } else if (bulkAction === 'deactivate') {
                    for (const userId of selectedUsers) {
                      await router.patch(route('users.toggle-status', userId), { status: 'inactive' });
                    }
                  } else if (bulkAction === 'suspend') {
                    const reason = prompt('Alasan penangguhan untuk pengguna yang dipilih:');
                    if (reason !== null) {
                      for (const userId of selectedUsers) {
                        await router.post(route('users.suspend', userId), { reason });
                      }
                    }
                  } else if (bulkAction === 'unsuspend') {
                    if (confirm('Apakah Anda yakin ingin mengaktifkan kembali pengguna yang dipilih?')) {
                      for (const userId of selectedUsers) {
                        await router.post(route('users.unsuspend', userId));
                      }
                    }
                  }
                  setSelectedUsers([]);
                  setShowBulkModal(false);
                } catch (error) {
                  console.error('Bulk action failed:', error);
                  alert('Terjadi kesalahan saat melakukan bulk action. Silakan coba lagi.');
                }
              };

              executeBulkAction();
            }}
            disabled={processing}
          >
            {processing ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Processing...</span>
              </>
            ) : (
              bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)
            )}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default UserTable;
