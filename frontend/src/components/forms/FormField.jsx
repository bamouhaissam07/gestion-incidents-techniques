import React from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

/**
 * Composant FormField qui choisit automatiquement le bon type de champ
 */
const FormField = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = '',
  options = [],
  rows = 4,
  maxLength,
  icon,
  ...props
}) => {
  // Gérer le changement de valeur
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  // Gérer le blur
  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  // Sélectionner le bon composant selon le type
  switch (type) {
    case 'select':
      return (
        <Select
          name={name}
          label={label}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          options={options}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          disabled={disabled}
          {...props}
        />
      );

    case 'textarea':
      return (
        <Textarea
          name={name}
          label={label}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          {...props}
        />
      );

    default:
      return (
        <Input
          type={type}
          name={name}
          label={label}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          disabled={disabled}
          icon={icon}
          {...props}
        />
      );
  }
};

export default FormField;