import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, Clock, Package, User,
  Calendar, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { interventionService } from '../../services';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/charts';
import { UrgenceBadge, StatusBadge } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { formatDateTime } from '../../utils/formatters';

/**
 * Page historique des interventions du technicien connecté
 */
const HistoriqueInterventions = () => {
  const { user } = useAuth();
  const [loading, setLoading]             = useState(true);
  const [interventions, setInterventions] = useState([]);
  const [filtered, setFiltered]           = useState([]);
  const [searchTerm, setSearchTerm]       = useState('');
  const [filterResolu, setFilterResolu]   = useState('tous'); // tous | resolu | non_resolu
  const [expandedId, setExpandedId]       = useState(null);   // ID de la carte développée
  const [error, setError]                 = useState(null);

  useEffect(() => {
    loadHistorique();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [interventions, searchTerm, filterResolu]);

  // ─── Chargement ──────────────────────────────────────────────────────────
  const loadHistorique = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await interventionService.getInterventionsByTechnicien(user.id);
      if (response.success) {
        setInterventions(response.data || []);
      } else {
        setError('Impossible de charger l\'historique');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Filtrage ─────────────────────────────────────────────────────────────
  const applyFilters = () => {
    let result = [...interventions];

    // Filtre texte
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i =>
        i.demande_titre?.toLowerCase().includes(term) ||
        i.actions_prises?.toLowerCase().includes(term) ||
        i.pieces_remplacees?.toLowerCase().includes(term) ||
        i.utilisateur_nom?.toLowerCase().includes(term) ||
        i.materiel_nom?.toLowerCase().includes(term)
      );
    }

    // Filtre résolu
    if (filterResolu === 'resolu') {
      result = result.filter(i => i.probleme_resolu);
    } else if (filterResolu === 'non_resolu') {
      result = result.filter(i => !i.probleme_resolu);
    }

    setFiltered(result);
  };

  // ─── Statistiques ─────────────────────────────────────────────────────────
  const stats = {
    total:      interventions.length,
    resolues:   interventions.filter(i => i.probleme_resolu).length,
    tauxReussite: interventions.length > 0
      ? Math.round((interventions.filter(i => i.probleme_resolu).length / interventions.length) * 100)
      : 0
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historique de mes interventions</h1>
        <p className="text-gray-600 mt-1">
          Toutes vos interventions passées — {interventions.length} au total
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Total interventions"
          value={stats.total}
          icon={Clock}
          color="primary"
        />
        <StatCard
          title="Problèmes résolus"
          value={stats.resolues}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="Taux de réussite"
          value={`${stats.tauxReussite}%`}
          icon={CheckCircle}
          color="info"
          description="Interventions réussies"
        />
      </div>

      {/* Barre de filtres */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher par demande, actions, pièces..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filtre résolution */}
            <select
              value={filterResolu}
              onChange={e => setFilterResolu(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="tous">Toutes les interventions</option>
              <option value="resolu">Problème résolu</option>
              <option value="non_resolu">Problème non résolu</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Liste des interventions */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Clock className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {searchTerm || filterResolu !== 'tous'
                  ? 'Aucune intervention ne correspond à votre recherche'
                  : 'Aucune intervention enregistrée pour le moment'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(intervention => {
            const isExpanded = expandedId === intervention.id_intervention;
            const resolu = Boolean(intervention.probleme_resolu);

            return (
              <Card
                key={intervention.id_intervention}
                className={`border-l-4 ${resolu ? 'border-l-success-500' : 'border-l-warning-500'}`}
              >
                {/* En-tête cliquable */}
                <button
                  className="w-full text-left px-6 py-4"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : intervention.id_intervention)
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <UrgenceBadge urgence={intervention.demande_urgence} size="xs" />
                        <StatusBadge status={intervention.demande_statut} size="xs" />
                        {resolu ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-success-100 text-success-700 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Résolu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-warning-100 text-warning-700 rounded-full">
                            <Clock className="w-3 h-3" /> Non résolu
                          </span>
                        )}
                      </div>

                      {/* Titre demande */}
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {intervention.demande_titre}
                      </h3>

                      {/* Infos rapides */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(intervention.date_intervention)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {intervention.utilisateur_prenom} {intervention.utilisateur_nom}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {intervention.materiel_nom}
                        </span>
                      </div>
                    </div>

                    {/* Icône expand */}
                    <div className="flex-shrink-0 text-gray-400">
                      {isExpanded
                        ? <ChevronUp className="w-5 h-5" />
                        : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </button>

                {/* Détails développés */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 space-y-4">

                    {/* Actions prises */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Actions prises
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {intervention.actions_prises}
                      </p>
                    </div>

                    {/* Pièces remplacées */}
                    {intervention.pieces_remplacees && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Pièces remplacées
                        </p>
                        <p className="text-sm text-gray-800">
                          {intervention.pieces_remplacees}
                        </p>
                      </div>
                    )}

                    {/* Informations matériel */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Matériel
                        </p>
                        <p className="text-sm text-gray-800">{intervention.materiel_nom}</p>
                        <p className="text-xs text-gray-500">
                          {intervention.materiel_serie} • {intervention.materiel_emplacement}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Demandeur
                        </p>
                        <p className="text-sm text-gray-800">
                          {intervention.utilisateur_prenom} {intervention.utilisateur_nom}
                        </p>
                        {intervention.utilisateur_departement && (
                          <p className="text-xs text-gray-500">
                            {intervention.utilisateur_departement}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Lien vers la demande */}
                    <div className="pt-2">
                      <Link
                        to={`/interventions/${intervention.id_demande}`}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
                      >
                        Voir la demande complète →
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Résumé de la recherche */}
      {(searchTerm || filterResolu !== 'tous') && filtered.length > 0 && (
        <p className="text-sm text-center text-gray-500">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {interventions.length} intervention{interventions.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default HistoriqueInterventions;
