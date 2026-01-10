import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import MobileButton from '../UI/MobileButton';
import MobileCard from '../UI/MobileCard';
import { usePermission } from '../../Hooks/usePermission';

// Helper function for routing
const getRoute = (name, params = {}) => {
  return window.route ? window.route(name, params) : `/${name}`;
};

// Helper function to format date
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

const MobileUserActions = ({ user, onToggleStatus, onDelete, onAssignRole }) => {
  const { can } = usePermission();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const handleDelete = () => {
    setShowActionSheet(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (user) {
      onDelete(user);
      setShowDeleteModal(false);
    }
  };

  const handleToggleStatus = () => {
    setShowActionSheet(false);
    // Jika user suspended, tidak bisa toggle status biasa
    if (user.status === 'suspended') {
      alert('Pengguna yang ditangguhkan harus diaktifkan kembali terlebih dahulu melalui tombol Unsuspend.');
      return;
    }
    // Toggle antara active dan inactive
    setNewStatus(user.status === 'active' ? 'inactive' : 'active');
    setShowStatusModal(true);
  };

  const confirmStatusToggle = () => {
    if (user) {
      onToggleStatus(user.id, newStatus);
      setShowStatusModal(false);
    }
  };

  const handleAssignRole = () => {
    setShowActionSheet(false);
    setShowRoleModal(true);
  };

  const confirmRoleAssignment = () => {
    if (user) {
      onAssignRole(user.id);
      setShowRoleModal(false);
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

  return (
    <MobileCard className="mb-4">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900 truncate">{user.name}</h3>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
        </div>
        <div className="ml-2 flex-shrink-0">
          {getStatusBadge(user.status)}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {user.roles?.map((role) => (
            <span
              key={role.id}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {role.name}
            </span>
          ))}
          {(!user.roles || user.roles.length === 0) && (
            <span className="text-sm text-gray-500">No roles assigned</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm text-gray-500 mb-4">
        <div className="flex justify-between">
          <span>Last Login:</span>
          <span className="font-medium text-gray-900">{formatDate(user.last_login_at)}</span>
        </div>
        <div className="flex justify-between">
          <span>Created:</span>
          <span className="font-medium text-gray-900">{formatDate(user.created_at)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {can('users.show') && (
          <MobileButton
            variant="outline"
            size="sm"
            onClick={() => window.location.href = getRoute('users.show', user.id)}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-1.274 4.057-5.064 7z" />
            </svg>
            View
          </MobileButton>
        )}

        {can('users.edit') && (
          <MobileButton
            variant="outline"
            size="sm"
            onClick={() => window.location.href = getRoute('users.edit', user.id)}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002 2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </MobileButton>
        )}

        {can('users.assign-role') && (
          <MobileButton
            variant="outline"
            size="sm"
            onClick={handleAssignRole}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Role
          </MobileButton>
        )}

        {can('users.edit') && (
          <MobileButton
            variant={user.status === 'active' ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleToggleStatus}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31-.826 2.37-2.37a1.724 1.724 0 00-1.066 2.573c-1.756-.426-1.756-2.924 1.756-3.35 0a1.724 1.724 0 001.066-2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 1.756-3.35 0a1.724 1.724 0 001.066-2.573z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {user.status === 'active' ? 'Deactivate' : 'Activate'}
          </MobileButton>
        )}

        {can('users.delete') && (
          <MobileButton
            variant="danger"
            size="sm"
            onClick={handleDelete}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </MobileButton>
        )}
      </div>
    </MobileCard>
  );
};

export default MobileUserActions;
