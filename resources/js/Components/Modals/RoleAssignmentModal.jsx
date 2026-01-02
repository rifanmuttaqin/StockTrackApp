import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '../Modal';
import Alert from '../Alert';
import LoadingSpinner from '../LoadingSpinner';
import { usePermission } from '../../Hooks/usePermission';

const RoleAssignmentModal = ({
  isOpen,
  onClose,
  user = null,
  roles = [],
  userRoles = [],
  onAssignRole,
  onRemoveRole
}) => {
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState('assign');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const { post, delete: destroy, processing, errors } = useForm();

  useEffect(() => {
    if (isOpen) {
      setSelectedRole('');
      setActiveTab('assign');
    }
  }, [isOpen]);

  const handleAssignRole = (e) => {
    e.preventDefault();

    if (!user || !selectedRole) return;

    setLoading(true);
    post(route('users.roles.assign', user.id), {
      role_id: selectedRole,
      onSuccess: () => {
        setLoading(false);
        setSelectedRole('');
        if (onAssignRole) onAssignRole();
      },
      onError: () => {
        setLoading(false);
      },
    });
  };

  const handleRemoveRole = (roleId) => {
    if (!user) return;

    if (confirm('Apakah Anda yakin ingin menghapus role ini dari user?')) {
      setLoading(true);
      destroy(route('users.roles.remove', [user.id, roleId]), {
        onSuccess: () => {
          setLoading(false);
          if (onRemoveRole) onRemoveRole();
        },
        onError: () => {
          setLoading(false);
        },
      });
    }
  };

  const getAvailableRoles = () => {
    if (!userRoles) return roles;

    const userRoleIds = userRoles.map(role => role.id);
    return roles.filter(role => !userRoleIds.includes(role.id));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Role Assignment"
      size="lg"
    >
      <div className="mt-2">
        {user && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-900">User: {user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('assign')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assign'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assign Role
            </button>
            <button
              onClick={() => setActiveTab('remove')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'remove'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Current Roles ({userRoles?.length || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'assign' && (
            <form onSubmit={handleAssignRole}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Pilih Role
                  </label>
                  <div className="mt-1">
                    <select
                      id="role"
                      name="role"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    >
                      <option value="">-- Pilih Role --</option>
                      {getAvailableRoles().map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {errors.role_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.role_id}</p>
                    )}
                  </div>
                </div>

                {selectedRole && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      {roles.find(r => r.id === parseInt(selectedRole))?.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={onClose}
                  disabled={processing || loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={!selectedRole || processing || loading}
                >
                  {processing || loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Memproses...</span>
                    </>
                  ) : (
                    'Assign Role'
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'remove' && (
            <div>
              {userRoles && userRoles.length > 0 ? (
                <div className="space-y-3">
                  {userRoles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{role.name}</p>
                        <p className="text-sm text-gray-500">{role.description}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveRole(role.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                        disabled={processing || loading}
                      >
                        {processing || loading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          'Hapus'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">User belum memiliki role</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={onClose}
                  disabled={processing || loading}
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RoleAssignmentModal;
