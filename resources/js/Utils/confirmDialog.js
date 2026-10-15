import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Button colors following the existing convention (see Pages/Units/Index.jsx)
export const SWAL_COLORS = {
    danger: '#EF4444',
    success: '#84CC16',
    cancel: '#64748B',
};

// Base confirmation dialog. Returns the Swal.fire promise
// so callers can check `result.isConfirmed`.
export const confirmDialog = ({
    title,
    html,
    text,
    icon = 'question',
    confirmText = 'Ya',
    cancelText = 'Batal',
    confirmColor = SWAL_COLORS.success,
    cancelColor = SWAL_COLORS.cancel,
} = {}) => {
    return Swal.fire({
        title,
        html,
        text,
        icon,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: confirmColor,
        cancelButtonColor: cancelColor,
        reverseButtons: true,
        focusCancel: true,
    });
};

// Destructive confirmation (delete, force delete, ...).
export const confirmDelete = ({
    title = 'Hapus Data?',
    html,
    text,
    confirmText = 'Ya, Hapus',
} = {}) => {
    return confirmDialog({
        title,
        html,
        text,
        icon: 'warning',
        confirmText,
        confirmColor: SWAL_COLORS.danger,
    });
};

// Positive/caution confirmation (activate, restore, submit, ...).
export const confirmActivate = ({
    title = 'Konfirmasi?',
    html,
    text,
    confirmText = 'Ya, Lanjutkan',
} = {}) => {
    return confirmDialog({
        title,
        html,
        text,
        icon: 'question',
        confirmText,
        confirmColor: SWAL_COLORS.success,
    });
};

export const showSuccessToast = (title) => {
    return Swal.fire({
        position: 'top-end',
        icon: 'success',
        title,
        showConfirmButton: false,
        timer: 3000,
        toast: true,
    });
};

export const showErrorToast = (title) => {
    return Swal.fire({
        position: 'top-end',
        icon: 'error',
        title,
        showConfirmButton: false,
        timer: 3000,
        toast: true,
    });
};
