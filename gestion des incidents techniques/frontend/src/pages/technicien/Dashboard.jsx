import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { demandeService } from '../../services';
import { StatCard } from '../../components/charts';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge, UrgenceBadge } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { formatDateTime } from '../../utils/formatters';
import { getPriorityColor } from '../../utils/helpers';

/**
 * Dashboard Technicien - Vue d'ensemble des interventions
 */
const TechnicienDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignees: 0,
    en_cours: 0,
    terminees: 0,
    taux_resolution: 0
  });
  const [demandesAssignees, setDemandesAssignees] = useState([]);
  const [demandesPrioritaires, setDemandesPrioritaires] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger toutes les demandes assignées au technicien
      const response = await demandeService.getAllDemandes({ 
        technicien_id: user.id 
      });
      
      if (response.success) {
        const demandes = response.data || [];
        
        // Calculer les statistiques
        const assignees = demandes.filter(d => 
          d.statut === 'ASSIGNEE'
        ).length;
        
        const enCours = demandes.filter(d => 
          ['ACCEPTEE', 'EN_COURS'].includes(d.statut)
        ).length;
        
        const terminees = demandes.filter(d => 
          ['RESOLUE', 'FERMEE'].includes(d.statut)
        ).length;
        
        const total = demandes.length;
        const tauxResolution = total > 0 ? Math.round((terminees / total) * 100) : 0;
        
        setStats({
          assignees,
          en_cours: enCours,
          terminees,
          taux_resolution: tauxResolution
        });
        
        // Demandes en attente d'action (assignées mais pas encore acceptées)
        const enAttente = demandes
          .filter(d => d.statut === 'ASSIGNEE')
          .slice(0, 5);
        setDemandesAssignees(enAttente);
        
        // Demandes prioritaires (haute urgence ou en retard)
        const prioritaires = demandes
          .filter(d => 
            !['RESOLUE', 'FERMEE', 'REFUSEE'].includes(d.statut) &&
            (d.urgence === 'CRITIQUE' || d.urgence === 'HAUTE' || d.en_retard)
          )
          .slice(0, 5);
        setDemandesPrioritaires(prioritaires);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.prenom} !
        </h1>
        <p className="text-gray-600 mt-1">
          Voici un aperçu de vos interventions en cours
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Assignées"
          value={stats.assignees}
          icon={Wrench}
          color="primary"
          description="En attente d'acceptation"
        />
        
        <StatCard
          title="En cours"
          value={stats.en_cours}
          icon={Clock}
          color="warning"
          description="Interventions actives"
        />
        
        <StatCard
          title="Terminées"
          value={stats.terminees}
          icon={CheckCircle}
          color="success"
          description="Interventions résolues"
        />
        
        <StatCard
          title="Taux de résolution"
          value={`${stats.taux_resolution}%`}
          icon={Award}
          color="info"
          description="Performance globale"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demandes assignées (en attente d'action) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Nouvelles assignations</CardTitle>
              <Link to="/interventions">
                <Button variant="ghost" size="sm">
                  Voir tout
                </Button>
              </Link>
            </div>
          </CardHeader>
          
          <CardContent>
            {demandesAssignees.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Aucune nouvelle demande assignée
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {demandesAssignees.map((demande) => (
                  <Link
                    key={demande.id}
                    to={`/interventions/${demande.id}`}
                    className="block p-4 rounded-lg border hover:shadow-md transition-shadow bg-blue-50 border-blue-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={demande.statut} size="sm" />
                        <UrgenceBadge urgence={demande.urgence} size="sm" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {demande.titre}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {demande.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Assignée le {formatDateTime(demande.date_assignation)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demandes prioritaires */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Demandes prioritaires</CardTitle>
              <AlertTriangle className="w-5 h-5 text-warning-600" />
            </div>
          </CardHeader>
          
          <CardContent>
            {demandesPrioritaires.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-success-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Aucune demande prioritaire pour le moment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {demandesPrioritaires.map((demande) => (
                  <Link
                    key={demande.id}
                    to={`/interventions/${demande.id}`}
                    className={`block p-4 rounded-lg border hover:shadow-md transition-shadow ${
                      getPriorityColor(demande.urgence, demande.date_creation, demande.statut)
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={demande.statut} size="sm" />
                        <UrgenceBadge urgence={demande.urgence} size="sm" />
                      </div>
                      {demande.en_retard && (
                        <span className="text-xs font-medium text-danger-600">
                          En retard
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {demande.titre}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {demande.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        {demande.utilisateur_prenom} {demande.utilisateur_nom}
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(demande.date_creation)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conseils pour les techniciens */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">
                Bonnes pratiques
              </h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Acceptez ou refusez rapidement les nouvelles assignations</li>
                <li>• Priorisez les demandes critiques et en retard</li>
                <li>• Documentez précisément vos interventions</li>
                <li>• Mettez à jour le statut régulièrement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicienDashboard;