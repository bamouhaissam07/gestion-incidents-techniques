import React from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle, Wrench } from 'lucide-react';
import { classNames } from '../../utils/helpers';
import { getTimeAgo } from '../../utils/helpers';
import { NOTIFICATION_TYPES } from '../../utils/constants';

/**
 * Composant NotificationItem - Item de notification individuel
 */
const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}) => {
  const { id_notification, type, message, lue, date_envoi, demande_titre } = notification;

  // Icônes et couleurs selon le type
  const typeConfig = {
    [NOTIFICATION_TYPES.ASSIGNATION]: {
      icon: Info,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    [NOTIFICATION_TYPES.REFUS]: {
      icon: XCircle,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    [NOTIFICATION_TYPES.RESOLUTION]: {
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    [NOTIFICATION_TYPES.CLOTURE]: {
      icon: CheckCircle,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-600'
    },
    [NOTIFICATION_TYPES.NOUVELLE_DEMANDE]: {
      icon: Info,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    [NOTIFICATION_TYPES.INTERVENTION]: {
      icon: Wrench,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    [NOTIFICATION_TYPES.ACCEPTATION]: {
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    [NOTIFICATION_TYPES.AUTRE]: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    }
  };

  const config = typeConfig[type] || typeConfig[NOTIFICATION_TYPES.AUTRE];
  const IconComponent = config.icon;

  const handleClick = () => {
    if (!lue) {
      onMarkAsRead(id_notification);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(id_notification);
  };

  return (
    <div
      onClick={handleClick}
      className={classNames(
        'px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors relative group',
        !lue && 'bg-blue-50'
      )}
    >
      <div className="flex items-start">
        {/* Icône */}
        <div className={classNames(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          config.bgColor
        )}>
          <IconComponent className={classNames('w-5 h-5', config.iconColor)} />
        </div>

        {/* Contenu */}
        <div className="ml-3 flex-1 min-w-0">
          <p className={classNames(
            'text-sm',
            lue ? 'text-gray-700' : 'text-gray-900 font-medium'
          )}>
            {message}
          </p>
          {demande_titre && (
            <p className="text-xs text-gray-500 mt-1">
              Concernant: {demande_titre}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {getTimeAgo(date_envoi)}
          </p>
        </div>

        {/* Bouton supprimer (visible au hover) */}
        <button
          onClick={handleDelete}
          className="ml-2 p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Supprimer"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Indicateur non lu */}
        {!lue && (
          <div className="ml-2 mt-2">
            <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
