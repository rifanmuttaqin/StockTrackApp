import { useState, useCallback } from 'react';
import { useForm as useInertiaForm } from '@inertiajs/react';

// Custom hook for enhanced form handling
export const useForm = (initialValues, validationRules = {}) => {
    const inertiaForm = useInertiaForm(initialValues);
    const [errors, setErrors] = useState({});

    const validate = useCallback((data) => {
        const newErrors = {};

        Object.keys(validationRules).forEach(field => {
            const rules = validationRules[field];
            const value = data[field];

            if (rules.required && (value === undefined || value === null || value === '')) {
                newErrors[field] = `${field} is required`;
                return;
            }

            if (rules.minLength && value && value.length < rules.minLength) {
                newErrors[field] = `${field} must be at least ${rules.minLength} characters`;
            }

            if (rules.maxLength && value && value.length > rules.maxLength) {
                newErrors[field] = `${field} must not exceed ${rules.maxLength} characters`;
            }

            if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                newErrors[field] = `${field} must be a valid email address`;
            }

            if (rules.pattern && value && !rules.pattern.test(value)) {
                newErrors[field] = rules.message || `${field} is invalid`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [validationRules]);

    const handleSubmit = useCallback((onSubmit) => {
        return (e) => {
            e.preventDefault();

            if (validate(inertiaForm.data)) {
                onSubmit(inertiaForm.data, inertiaForm);
            }
        };
    }, [validate, inertiaForm]);

    const setFieldValue = useCallback((field, value) => {
        inertiaForm.setData(field, value);

        // Clear error for this field when value changes
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [inertiaForm, errors]);

    const resetForm = useCallback((newValues = initialValues) => {
        inertiaForm.reset(...Object.keys(newValues));
        setErrors({});
    }, [inertiaForm, initialValues]);

    return {
        ...inertiaForm,
        errors,
        validate,
        handleSubmit,
        setFieldValue,
        resetForm,
        hasErrors: Object.keys(errors).length > 0,
    };
};
