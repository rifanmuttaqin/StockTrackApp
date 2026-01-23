import React, { useRef, useEffect } from 'react';

/**
 * AutoSelectInput Component
 * 
 * A reusable input component that automatically selects all text when focused.
 * This is useful for numeric inputs where users want to replace the value
 * rather than append to it.
 * 
 * Features:
 * - Auto-selects all text on focus (click or tab)
 * - Handles null/empty values gracefully
 * - Fully compatible with Inertia's useForm
 * - Supports all standard input props
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (default: 'number')
 * @param {string|number} props.value - Input value
 * @param {Function} props.onChange - onChange handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.name - Input name
 * @param {string} props.id - Input id
 * @param {number} props.min - Minimum value (for number inputs)
 * @param {number} props.max - Maximum value (for number inputs)
 * @param {number} props.step - Step value (for number inputs)
 * @param {Function} props.onFocus - Custom onFocus handler (will be called after auto-select)
 * @param {Function} props.onBlur - Custom onBlur handler
 * @returns {JSX.Element}
 */
const AutoSelectInput = React.forwardRef(({
  type = 'number',
  value = '',
  onChange,
  className = '',
  placeholder = '',
  disabled = false,
  name = '',
  id = '',
  min,
  max,
  step,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const internalRef = useRef(null);

  // Handle refs properly (both forwarded and internal)
  const setRefs = (element) => {
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
    internalRef.current = element;
  };

  /**
   * Handle focus event
   * Auto-selects all text in the input when focused
   */
  const handleFocus = (e) => {
    // Select all text in the input
    const target = e.target;
    if (target && typeof target.select === 'function') {
      target.select();
    }

    // Call custom onFocus handler if provided
    if (onFocus) {
      onFocus(e);
    }
  };

  /**
   * Handle blur event
   * Ensures the value is properly synchronized with the form state
   * Handles empty/invalid values gracefully
   */
  const handleBlur = (e) => {
    const target = e.target;
    let newValue = target.value;

    // Handle empty value
    if (newValue === '' || newValue === null || newValue === undefined) {
      // Set to 0 for number inputs, keep empty for other types
      if (type === 'number') {
        newValue = '0';
      }
    }

    // Call custom onBlur handler if provided
    if (onBlur) {
      onBlur(e);
    }
  };

  /**
   * Handle change event
   * Ensures proper value handling for different input types
   */
  const handleChange = (e) => {
    onChange(e);
  };

  return (
    <input
      ref={setRefs}
      type={type}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      name={name}
      id={id}
      min={min}
      max={max}
      step={step}
      className={className}
      {...props}
    />
  );
});

AutoSelectInput.displayName = 'AutoSelectInput';

export default AutoSelectInput;
