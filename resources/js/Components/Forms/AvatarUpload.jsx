import React, { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function AvatarUpload({ user, onSuccess }) {
    const [preview, setPreview] = useState(user?.avatar ? `/storage/${user.avatar}` : null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        avatar: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        // Validate file type
        if (!file.type.match('image.*')) {
            Swal.fire('Error', 'Please select an image file.', 'error');
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            Swal.fire('Error', 'File size must be less than 2MB.', 'error');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Set form data
        setData('avatar', file);
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
        setIsUploading(true);
        setUploadProgress(0);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 200);

        post('/profile/avatar', {
            forceFormData: true,
            onSuccess: () => {
                clearInterval(progressInterval);
                setUploadProgress(100);
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                    if (onSuccess) onSuccess();
                }, 500);
            },
            onError: () => {
                clearInterval(progressInterval);
                setIsUploading(false);
                setUploadProgress(0);
            },
        });
    };

    const handleRemoveAvatar = () => {
        // In a real implementation, this would call an API to delete the avatar
        setPreview(null);
        setData('avatar', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Avatar
                </label>
                <div className="mt-1 flex items-center space-x-6">
                    <div className="shrink-0">
                        {preview ? (
                            <img
                                className="h-24 w-24 object-cover rounded-full"
                                src={preview}
                                alt="Avatar preview"
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg
                                    className="h-12 w-12 text-gray-400"
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
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={openFileDialog}
                            className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Pilih Avatar
                        </button>
                        {preview && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                className="ml-3 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Hapus
                            </button>
                        )}
                        <p className="mt-2 text-sm text-gray-500">
                            PNG, JPG, GIF hingga 2MB
                        </p>
                    </div>
                </div>
                {errors.avatar && (
                    <p className="mt-2 text-sm text-red-600">{errors.avatar}</p>
                )}
            </div>

            {/* Drag and Drop Area */}
            <div
                className={`mt-2 flex justify-center rounded-lg border-2 border-dashed px-6 pt-5 pb-6 ${
                    isDragging
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="space-y-1 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
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
                    <div className="flex text-sm text-gray-600">
                        <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                        >
                            <span>Upload file</span>
                            <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </label>
                        <p className="pl-1">atau drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF hingga 2MB</p>
                </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
                <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">Mengupload...</span>
                        <span className="text-sm text-gray-700">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            {data.avatar && (
                <div className="flex justify-end">
                    <button
                        onClick={submit}
                        disabled={processing || isUploading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {processing || isUploading ? 'Memproses...' : 'Simpan Avatar'}
                    </button>
                </div>
            )}
        </div>
    );
}
