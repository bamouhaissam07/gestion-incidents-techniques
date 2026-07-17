import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { classNames } from '../../utils/helpers';

/**
 * Composant Alert pour afficher des messages informatifs
 */
const Alert = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = ''
}) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      text: 'text-blue-700',
      IconComponent: Info
    },
    success: {
      container: 'bg-success-50 border-success-200',
      icon: 'text-success-600',
      title: 'text-success-800',
      text: 'text-success-700',
      IconComponent: CheckCircle
    },
    warning: {
      container: 'bg-warning-50 border-warning-200',
      icon: 'text-warning-600',
      title: 'text-warning-800',
      text: 'text-warning-700',
      IconComponent: AlertTriangle
    },
    danger: {
      container: 'bg-danger-50 border-danger-200',
      icon: 'text-danger-600',
      title: 'text-danger-800',
      text: 'text-danger-700',
      IconComponent: AlertCircle
    }
  };

  const style = variants[variant];
  const IconComponent = style.IconComponent;

  return (
    <div 
      className={classNames(
        'border rounded-lg p-4',
        style.container,
        className
      )}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={classNames('w-5 h-5', style.icon)} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={classNames('text-sm font-medium', style.title)}>
              {title}
            </h3>
          )}
          {children && (
            <div className={classNames('text-sm', style.text, title && 'mt-2')}>
              {children}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={classNames(
                'inline-flex rounded-md p-1.5 hover:bg-opacity-20 focus:outline-none',
                style.icon
              )}
            >
              <span className="sr-only">Fermer</span>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;