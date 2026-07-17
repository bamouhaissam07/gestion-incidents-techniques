import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';
import { classNames } from '../../utils/helpers';
import { formatNumber } from '../../utils/formatters';

/**
 * Composant StatCard pour afficher des statistiques
 */
const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend = null,
  color = 'primary',
  loading = false,
  className = ''
}) => {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
    info: 'bg-blue-100 text-blue-600'
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="animate-pulse">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={classNames('hover:shadow-md transition-shadow', className)}>
      <div className="flex items-center">
        {Icon && (
          <div className="flex-shrink-0">
            <div className={classNames(
              'p-3 rounded-lg',
              colorClasses[color]
            )}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        )}
        
        <div className={classNames('flex-1', Icon && 'ml-4')}>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? formatNumber(value) : value}
            </p>
            
            {trend && (
              <div className={classNames(
                'ml-2 flex items-center text-sm font-medium',
                trend.type === 'increase' 
                  ? 'text-success-600' 
                  : trend.type === 'decrease'
                  ? 'text-danger-600'
                  : 'text-gray-500'
              )}>
                {trend.type === 'increase' && <TrendingUp className="w-4 h-4 mr-1" />}
                {trend.type === 'decrease' && <TrendingDown className="w-4 h-4 mr-1" />}
                <span>
                  {trend.type === 'increase' ? '+' : trend.type === 'decrease' ? '-' : ''}
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;