import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Wrench, 
  Users, 
  Package, 
  BarChart3,
  PlusCircle,
  ClipboardList,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { classNames } from '../../utils/helpers';

/**
 * Composant Sidebar avec navigation adaptée au rôle
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();

  // Configuration des menus par rôle
  const menuItems = {
    [ROLES.UTILISATEUR]: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
      { path: '/demandes/create', icon: PlusCircle, label: 'Nouvelle demande' },
      { path: '/demandes', icon: FileText, label: 'Mes demandes' }
    ],
    [ROLES.TECHNICIEN]: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
      { path: '/interventions', icon: Wrench, label: 'Mes interventions' },
      { path: '/interventions/history', icon: ClipboardList, label: 'Historique' },
      { path: '/materiel', icon: Package, label: 'Matériel' }
    ],
    [ROLES.GESTIONNAIRE]: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
      { path: '/gestionnaire/demandes', icon: FileText, label: 'Gestion demandes' },
      { path: '/users', icon: Users, label: 'Utilisateurs' },
      { path: '/materiel', icon: Package, label: 'Matériel' },
      { path: '/reports', icon: BarChart3, label: 'Rapports' },
      { path: '/settings', icon: Settings, label: 'Paramètres' }
    ]
  };

  // Récupérer les items de menu pour le rôle actuel
  const currentMenuItems = menuItems[user?.type_personne] || [];

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={classNames(
          'fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-20',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <nav className="h-full overflow-y-auto py-6 px-3">
          <div className="space-y-1">
            {currentMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    // Fermer le menu mobile après navigation
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={classNames(
                          'w-5 h-5 mr-3',
                          isActive ? 'text-primary-600' : 'text-gray-500'
                        )}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Section info utilisateur en bas */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 text-sm font-medium">
                  {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;