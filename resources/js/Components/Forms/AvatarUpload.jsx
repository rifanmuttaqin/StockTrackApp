import React, { useState, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import Swal from 'sweetalert2';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const ACCEPTED_LABEL = 'PNG, JPG, WEBP hingga 2MB';

function resolveInitialPreview(user) {
    if (user?.avatar_url) return user.avatar_url;
    if (user?.avatar) return `/storage/${user.avatar}`;
    return null;
}

export default function AvatarUpload({ user, onSuccess }) {
    const [preview, setPreview] = useState(() => resolveInitialPreview(user));
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors, progress } = useForm({
        avatar: null,
    });

    const processFile = (file) => {
        if (!file.type.startsWith('image/') || !ACCEPTED_MIME_TYPES.includes(file.type)) {
            Swal.fire('Gagal', 'Pilih file gambar (JPG, PNG, WEBP).', 'error');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            Swal.fire('Gagal', 'Ukuran file maksimal 2MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        setData('avatar', file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (!data.avatar) return;

        post(route('profile.avatar.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData('avatar', null);
                if (onSuccess) onSuccess();
            },
        });
    };

    const handleRemoveAvatar = async () => {
        const hasSavedAvatar = Boolean(user?.avatar || user?.avatar_url);

        if (hasSavedAvatar) {
            const result = await Swal.fire({
                title: 'Hapus avatar?',
                text: 'Foto profile akan dihapus permanen.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, hapus',
                cancelButtonText: 'Batal',
            });

            if (!result.isConfirmed) return;

            router.delete(route('profile.avatar.destroy'), {
                preserveScroll: true,
                onSuccess: () => {
                    setPreview(null);
                    setData('avatar', null);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                    if (onSuccess) onSuccess();
                },
            });
            return;
        }

        setPreview(null);
        setData('avatar', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const uploadPercent = progress?.percentage ?? 0;
    const isUploading = processing;

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700">
                    Avatar
                </label>
                <div className="mt-1 flex items-center space-x-6">
                    <div className="shrink-0">
                        {preview ? (
                            <img
                                className="h-24 w-24 object-cover rounded-full"
                                src={preview}
                                alt="Pratinjau avatar"
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-slate-300 flex items-center justify-center">
                                <svg
                                    className="h-12 w-12 text-slate-400"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={openFileDialog}
                            className="bg-white py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm leading-4 font-medium text-slate-700 hover:bg-appbg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
                        >
                            Pilih Avatar
                        </button>
                        {preview && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                className="ml-3 bg-white py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm leading-4 font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Hapus
                            </button>
                        )}
                        <p className="mt-2 text-sm text-slate-500">
                            {ACCEPTED_LABEL}
                        </p>
                    </div>
                </div>
                {errors.avatar && (
                    <p className="mt-2 text-sm text-red-600">{errors.avatar}</p>
                )}
            </div>

            {/* Drag and Drop Area */}
            <div
                className={`mt-2 flex justify-center rounded-lg border-2 border-dashed px-6 pt-5 pb-6 cursor-pointer ${
                    isDragging
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <div className="space-y-1 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-slate-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                    >
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <div className="flex justify-center text-sm text-slate-500">
                        <span className="relative rounded-md bg-white font-medium text-brand-700 hover:text-brand-600">
                            Upload file
                        </span>
                        <p className="pl-1">atau drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">{ACCEPTED_LABEL}</p>
                </div>
            </div>

            {/* Upload Progress */}
            {isUploading && uploadPercent > 0 && (
                <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700">Mengupload...</span>
                        <span className="text-sm text-slate-700">{uploadPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                            className="bg-brand h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadPercent}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            {data.avatar && (
                <div className="flex justify-end">
                    <button
                        onClick={submit}
                        disabled={processing}
                        className="inline-flex justify-center rounded-md border border-transparent bg-brand py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
                    >
                        {processing ? 'Memproses...' : 'Simpan Avatar'}
                    </button>
                </div>
            )}
        </div>
    );
}
