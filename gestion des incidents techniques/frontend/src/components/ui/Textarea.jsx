import React, { forwardRef } from 'react';
import { classNames } from '../../utils/helpers';

/**
 * Composant Textarea réutilisable
 */
const Textarea = forwardRef(({
  label,
  name,
  placeholder = '',
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  className = '',
  ...props
}, ref) => {
  const textareaClasses = classNames(
    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors resize-y',
    error 
      ? 'border-danger-300 focus:border-danger-500' 
      : 'border-gray-300 focus:border-primary-500',
    disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
    className
  );

  const currentLength = value ? value.length : 0;
  const showCounter = maxLength && maxLength > 0;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
        {...props}
      />

      <div className="flex justify-between items-start mt-1">
        <div className="flex-1">
          {error && (
            <p className="text-sm text-danger-600">{error}</p>
          )}
          
          {!error && helperText && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>

        {showCounter && (
          <p className={classNames(
            'text-xs ml-2',
            currentLength > maxLength ? 'text-danger-600' : 'text-gray-500'
          )}>
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;