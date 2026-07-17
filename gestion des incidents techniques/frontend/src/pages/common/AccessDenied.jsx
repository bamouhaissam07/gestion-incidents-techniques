import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

/**
 * Page Accès refusé
 */
const AccessDenied = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-danger-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-danger-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Accès refusé
          </h1>
          
          <p className="text-gray-600 mb-2">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          
          {user && (
            <p className="text-sm text-gray-500">
              Connecté en tant que <span className="font-medium">{user.type_personne}</span>
            </p>
          )}
        </div>

        <Link to="/dashboard">
          <Button>
            <Home className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied;