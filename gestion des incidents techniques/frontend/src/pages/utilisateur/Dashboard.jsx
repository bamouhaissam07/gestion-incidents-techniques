import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  PlusCircle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { demandeService } from '../../services';
import { StatCard } from '../../components/charts';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge, UrgenceBadge } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { formatDateTime } from '../../utils/formatters';

/**
 * Dashboard Utilisateur - Vue d'ensemble des demandes
 */
const UtilisateurDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    en_cours: 0,
    resolues: 0,
    en_retard: 0
  });
  const [recentDemandes, setRecentDemandes] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger les demandes de l'utilisateur
      const response = await demandeService.getDemandesByUser(user.id);
      
      if (response.success) {
        const demandes = response.data || [];
        
        // Calculer les statistiques
        const statsData = {
          total: demandes.length,
          en_cours: demandes.filter(d => 
            ['CREEE', 'ASSIGNEE', 'ACCEPTEE', 'EN_COURS'].includes(d.statut)
          ).length,
          resolues: demandes.filter(d => 
            ['RESOLUE', 'FERMEE'].includes(d.statut)
          ).length,
          en_retard: demandes.filter(d => 
            d.statut !== 'RESOLUE' && d.statut !== 'FERMEE' && d.en_retard
          ).length
        };
        
        setStats(statsData);
        
        // Prendre les 5 dernières demandes
        setRecentDemandes(demandes.slice(0, 5));
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.prenom} !
          </h1>
          <p className="text-gray-600 mt-1">
            Voici un aperçu de vos demandes d'intervention
          </p>
        </div>
        <Link to="/demandes/create">
          <Button>
            <PlusCircle className="w-5 h-5 mr-2" />
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total des demandes"
          value={stats.total}
          icon={FileText}
          color="primary"
        />
        
        <StatCard
          title="En cours"
          value={stats.en_cours}
          icon={Clock}
          color="warning"
          description="Demandes actives"
        />
        
        <StatCard
          title="Résolues"
          value={stats.resolues}
          icon={CheckCircle}
          color="success"
          description="Demandes terminées"
        />
        
        <StatCard
          title="En retard"
          value={stats.en_retard}
          icon={AlertCircle}
          color="danger"
          description="Nécessitent attention"
        />
      </div>

      {/* Demandes récentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demandes récentes</CardTitle>
            <Link to="/demandes">
              <Button variant="ghost" size="sm">
                Voir tout
              </Button>
            </Link>
          </div>
        </CardHeader>
        
        <CardContent>
          {recentDemandes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Vous n'avez pas encore de demande d'intervention
              </p>
              <Link to="/demandes/create">
                <Button>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Créer ma première demande
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDemandes.map((demande) => (
                <Link
                  key={demande.id_demande ?? demande.id}
                  to={`/demandes/${demande.id_demande ?? demande.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={demande.statut} />
                        <UrgenceBadge urgence={demande.urgence} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {demande.titre}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {demande.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Créée le {formatDateTime(demande.date_creation)}
                        </span>
                        {demande.technicien_nom && (
                          <span>
                            Assignée à {demande.technicien_prenom} {demande.technicien_nom}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conseils rapides */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Conseils pour une intervention rapide
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Décrivez précisément le problème rencontré</li>
                <li>• Indiquez le matériel concerné et sa localisation</li>
                <li>• Évaluez correctement le niveau d'urgence</li>
                <li>• Ajoutez des captures d'écran si pertinent</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UtilisateurDashboard;