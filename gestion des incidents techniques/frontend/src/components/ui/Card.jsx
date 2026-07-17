import React from 'react';
import { classNames } from '../../utils/helpers';

/**
 * Composant Card de base
 */
const Card = ({ 
  children, 
  className = '',
  padding = true,
  shadow = true,
  hover = false 
}) => {
  const baseClasses = 'bg-white rounded-lg border border-gray-200';
  const paddingClasses = padding ? 'p-6' : '';
  const shadowClasses = shadow ? 'shadow-sm' : '';
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow duration-200' : '';

  return (
    <div className={classNames(
      baseClasses,
      paddingClasses,
      shadowClasses,
      hoverClasses,
      className
    )}>
      {children}
    </div>
  );
};

/**
 * Header de carte
 */
export const CardHeader = ({ 
  children, 
  className = '',
  divider = true 
}) => {
  const dividerClasses = divider ? 'border-b border-gray-200 pb-4 mb-4' : '';
  
  return (
    <div className={classNames(dividerClasses, className)}>
      {children}
    </div>
  );
};

/**
 * Titre de carte
 */
export const CardTitle = ({ 
  children, 
  className = '',
  as: Component = 'h3' 
}) => {
  return (
    <Component className={classNames(
      'text-lg font-semibold text-gray-900',
      className
    )}>
      {children}
    </Component>
  );
};

/**
 * Description de carte
 */
export const CardDescription = ({ 
  children, 
  className = '' 
}) => {
  return (
    <p className={classNames(
      'text-sm text-gray-600 mt-1',
      className
    )}>
      {children}
    </p>
  );
};

/**
 * Contenu de carte
 */
export const CardContent = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Footer de carte
 */
export const CardFooter = ({ 
  children, 
  className = '',
  divider = true 
}) => {
  const dividerClasses = divider ? 'border-t border-gray-200 pt-4 mt-4' : '';
  
  return (
    <div className={classNames(dividerClasses, className)}>
      {children}
    </div>
  );
};

/**
 * Carte de statistiques
 */
export const StatCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend = null,
  className = '' 
}) => {
  return (
    <Card className={className} hover>
      <div className="flex items-center">
        {icon && (
          <div className="flex-shrink-0">
            <div className="p-3 bg-primary-100 rounded-lg">
              {icon}
            </div>
          </div>
        )}
        <div className={classNames('flex-1', icon ? 'ml-4' : '')}>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <p className={classNames(
                'ml-2 text-sm font-medium',
                trend.type === 'increase' ? 'text-success-600' : 'text-danger-600'
              )}>
                {trend.type === 'increase' ? '+' : ''}{trend.value}%
              </p>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Card;