import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Pagination, Modal } from '../UI';

export default function SessionsTable({ sessions, onSessionRevoked }) {
    const { flash } = usePage().props;
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isRevoking, setIsRevoking] = useState(false);

    const handleRevokeSession = (sessionId) => {
        setSelectedSession(sessionId);
        setShowConfirmModal(true);
    };

    const confirmRevokeSession = () => {
        if (!selectedSession) return;

        setIsRevoking(true);
        router.delete(
            `/profile/sessions/${selectedSession}`,
            {
                onSuccess: () => {
                    setIsRevoking(false);
                    setShowConfirmModal(false);
                    if (onSessionRevoked) onSessionRevoked();
                },
                onError: () => {
                    setIsRevoking(false);
                    setShowConfirmModal(false);
                },
            }
        );
    };

    const handleRevokeAllSessions = () => {
        setSelectedSession('all');
        setShowConfirmModal(true);
    };

    const confirmRevokeAllSessions = () => {
        setIsRevoking(true);
        router.delete(
            '/profile/sessions/revoke-all',
            {
                onSuccess: () => {
                    setIsRevoking(false);
                    setShowConfirmModal(false);
                    if (onSessionRevoked) onSessionRevoked();
                },
                onError: () => {
                    setIsRevoking(false);
                    setShowConfirmModal(false);
                },
            }
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDeviceIcon = (userAgent) => {
        if (userAgent.includes('Mobile')) {
            return (
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
            );
        }
        return (
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
            </svg>
        );
    };

    const getDeviceName = (userAgent) => {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Browser';
    };

    const getOSName = (userAgent) => {
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS')) return 'iOS';
        return 'Unknown OS';
    };

    const isCurrentSession = (sessionId) => {
        // In a real implementation, you would compare with the current session ID
        // For now, we'll just mark the first session as current
        return sessions.data.length > 0 && sessionId === sessions.data[0].id;
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Sesi Aktif
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Kelola sesi login Anda di berbagai perangkat.
                    </p>
                </div>
                {sessions.data.length > 1 && (
                    <button
                        onClick={handleRevokeAllSessions}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Cabut Semua Sesi
                    </button>
                )}
            </div>

            {sessions.data.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada sesi aktif</h3>
                    <p className="mt-1 text-sm text-gray-500">Anda tidak memiliki sesi aktif saat ini.</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {sessions.data.map((session) => (
                        <li key={session.id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            {getDeviceIcon(session.user_agent)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {getDeviceName(session.user_agent)} di {getOSName(session.user_agent)}
                                                </p>
                                                {isCurrentSession(session.id) && (
                                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Sesi Saat Ini
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center text-sm text-gray-500">
                                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                                {session.ip_address}
                                            </div>
                                            <div className="mt-1 flex items-center text-sm text-gray-500">
                                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                Terakhir aktif: {formatDate(session.last_activity)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {!isCurrentSession(session.id) && (
                                            <button
                                                onClick={() => handleRevokeSession(session.id)}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Cabut
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {sessions.links && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <Pagination links={sessions.links} />
                </div>
            )}

            {/* Confirmation Modal */}
            <Modal
                show={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
            >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {selectedSession === 'all' ? 'Cabut Semua Sesi?' : 'Cabut Sesi?'}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    {selectedSession === 'all'
                                        ? 'Apakah Anda yakin ingin mencabut semua sesi kecuali sesi saat ini? Anda akan diminta untuk login kembali di perangkat lain.'
                                        : 'Apakah Anda yakin ingin mencabut sesi ini? Anda akan diminta untuk login kembali di perangkat ini.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        onClick={selectedSession === 'all' ? confirmRevokeAllSessions : confirmRevokeSession}
                        disabled={isRevoking}
                    >
                        {isRevoking ? 'Mencabut...' : 'Ya, Cabut'}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={() => setShowConfirmModal(false)}
                    >
                        Batal
                    </button>
                </div>
            </Modal>
        </div>
    );
}
