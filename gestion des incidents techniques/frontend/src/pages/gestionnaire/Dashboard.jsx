import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Users, Wrench, AlertTriangle,
  Clock, CheckCircle, TrendingUp
} from 'lucide-react';
import { reportService, demandeService } from '../../services';
import { StatCard, BarChart } from '../../components/charts';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { StatusBadge, UrgenceBadge } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/formatters';

/**
 * Dashboard Gestionnaire — vue d'ensemble du système
 */
const GestionnaireDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_demandes: 0,
    total_utilisateurs: 0,
    total_techniciens: 0,
    demandes_retard: 0,
    demandes_en_cours: 0,
    demandes_resolues: 0
  });
  const [demandesRecentes, setDemandesRecentes] = useState([]);
  const [demandesParStatut, setDemandesParStatut] = useState([]);
  const [demandesEnRetard, setDemandesEnRetard] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Essayer d'abord le endpoint system-overview
      const [overviewRes, demandesRes, retardRes] = await Promise.allSettled([
        reportService.getSystemOverview(),
        demandeService.getAllDemandes(),
        demandeService.getDemandesEnRetard()
      ]);

      // Traiter les demandes
      if (demandesRes.status === 'fulfilled' && demandesRes.value.success) {
        const demandes = demandesRes.value.data || [];

        const statsCalc = {
          total_demandes:    demandes.length,
          demandes_en_cours: demandes.filter(d =>
            ['CREEE', 'ASSIGNEE', 'ACCEPTEE', 'EN_COURS'].includes(d.statut)
          ).length,
          demandes_resolues: demandes.filter(d =>
            ['RESOLUE', 'FERMEE'].includes(d.statut)
          ).length,
          demandes_retard: demandes.filter(d => d.en_retard).length
        };

        // Construire les stats par statut pour le graphique
        const parStatut = [
          { statut: 'Créée',    count: demandes.filter(d => d.statut === 'CREEE').length },
          { statut: 'Assignée', count: demandes.filter(d => d.statut === 'ASSIGNEE').length },
          { statut: 'En cours', count: demandes.filter(d => d.statut === 'EN_COURS').length },
          { statut: 'Résolue',  count: demandes.filter(d => d.statut === 'RESOLUE').length },
          { statut: 'Fermée',   count: demandes.filter(d => d.statut === 'FERMEE').length }
        ];

        setDemandesParStatut(parStatut);
        setDemandesRecentes(demandes.slice(0, 5));

        // Enrichir avec les données system-overview si disponibles
        if (overviewRes.status === 'fulfilled' && overviewRes.value.success) {
          const ov = overviewRes.value.data;

          // La vraie structure retournée par /reports/system-overview :
          // ov.demandes.total_demandes, ov.users (tableau), ov.materiel (tableau), ov.demandesEnRetard
          const totalUsers        = ov.users?.reduce((acc, u) => acc + (u.count || 0), 0) || 0;
          const totalTechniciens  = ov.users?.find(u => u.type_personne === 'TECHNICIEN')?.count || 0;
          const totalDemandes     = ov.demandes?.total_demandes || statsCalc.total_demandes;
          const demandesEnRetard  = ov.demandesEnRetard || statsCalc.demandes_retard;

          // Graphique depuis les vraies données système
          const parStatutOv = [
            { statut: 'Créée',    count: ov.demandes?.demandes_creees     || 0 },
            { statut: 'Assignée', count: ov.demandes?.demandes_assignees  || 0 },
            { statut: 'En cours', count: ov.demandes?.demandes_en_cours   || 0 },
            { statut: 'Résolue',  count: ov.demandes?.demandes_resolues   || 0 },
            { statut: 'Fermée',   count: ov.demandes?.demandes_fermees    || 0 }
          ];
          setDemandesParStatut(parStatutOv);

          setStats({
            total_demandes:    totalDemandes,
            demandes_en_cours: ov.demandes?.demandes_creees + ov.demandes?.demandes_assignees + ov.demandes?.demandes_en_cours || statsCalc.demandes_en_cours,
            demandes_resolues: ov.demandes?.demandes_resolues || statsCalc.demandes_resolues,
            demandes_retard:   demandesEnRetard,
            total_utilisateurs: totalUsers,
            total_techniciens:  totalTechniciens
          });
        } else {
          setStats(prev => ({ ...prev, ...statsCalc }));
        }
      }

      // Demandes en retard
      if (retardRes.status === 'fulfilled' && retardRes.value.success) {
        setDemandesEnRetard(retardRes.value.data?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble du système de gestion des incidents</p>
        </div>
        <Link to="/gestionnaire/demandes">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Gérer les demandes
          </Button>
        </Link>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total demandes"
          value={stats.total_demandes}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="En cours"
          value={stats.demandes_en_cours}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Résolues"
          value={stats.demandes_resolues}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="En retard"
          value={stats.demandes_retard}
          icon={AlertTriangle}
          color="danger"
          description="Hors SLA"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Utilisateurs actifs"
          value={stats.total_utilisateurs}
          icon={Users}
          color="info"
        />
        <StatCard
          title="Techniciens"
          value={stats.total_techniciens}
          icon={Wrench}
          color="primary"
        />
        <StatCard
          title="Taux de résolution"
          value={stats.total_demandes > 0
            ? `${Math.round((stats.demandes_resolues / stats.total_demandes) * 100)}%`
            : '—'}
          icon={TrendingUp}
          color="success"
        />
      </div>

      {/* Graphique + Demandes en retard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Répartition par statut"
          data={demandesParStatut}
          dataKey="count"
          xAxisKey="statut"
          height={280}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-danger-600" />
                Demandes en retard
              </CardTitle>
              <Link to="/gestionnaire/demandes">
                <Button variant="ghost" size="sm">Voir tout</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {demandesEnRetard.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <CheckCircle className="w-10 h-10 mb-2 text-success-400" />
                <p className="text-sm">Aucun retard — excellent !</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {demandesEnRetard.map(d => (
                  <li key={d.id} className="py-3">
                    <Link
                      to={`/gestionnaire/demandes`}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600">
                          {d.titre}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {d.utilisateur_prenom} {d.utilisateur_nom} • {formatDateTime(d.date_creation)}
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <UrgenceBadge urgence={d.urgence} size="xs" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Demandes récentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demandes récentes</CardTitle>
            <Link to="/gestionnaire/demandes">
              <Button variant="ghost" size="sm">Toutes les demandes</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {demandesRecentes.length === 0 ? (
            <div className="py-10 text-center text-gray-400">Aucune demande</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {demandesRecentes.map(d => (
                <li key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{d.titre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {d.utilisateur_prenom} {d.utilisateur_nom} •{' '}
                      {formatDateTime(d.date_creation)}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                    <UrgenceBadge urgence={d.urgence} size="xs" />
                    <StatusBadge status={d.statut} size="xs" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GestionnaireDashboard;