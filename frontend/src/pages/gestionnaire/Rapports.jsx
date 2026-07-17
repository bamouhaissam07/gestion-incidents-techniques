import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, Wrench,
  ShieldCheck, Star, Download, RefreshCw, Package, Eye
} from 'lucide-react';
import { reportService } from '../../services';
import { BarChart, LineChart } from '../../components/charts';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/charts';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { MaterielStatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const formatReportDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('fr-FR');
};

/**
 * Page Rapports & Statistiques — affiche les vraies données du backend
 */
const Rapports = () => {
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading]     = useState(false);
  const [data, setData]           = useState(null);
  const [error, setError]         = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [selectedSavedReport, setSelectedSavedReport] = useState(null);

  const tabs = [
    { id: 'performance',  label: 'Techniciens',      icon: Users       },
    { id: 'incidents',    label: 'Incidents',         icon: BarChart3   },
    { id: 'sla',          label: 'SLA',               icon: ShieldCheck },
    { id: 'maintenance',  label: 'Maintenance',       icon: Wrench      },
    { id: 'satisfaction', label: 'Satisfaction',      icon: Star        }
  ];

  useEffect(() => { loadReport(activeTab); }, [activeTab]);
  useEffect(() => { loadSavedReports(); }, []);

  const loadSavedReports = async () => {
    try {
      const res = await reportService.getSavedReports();
      if (res.success) setSavedReports(res.data || []);
    } catch (error) {
      console.error('Unable to load saved reports:', error);
    }
  };

  const loadReport = async (tab) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      let res;
      switch (tab) {
        case 'performance':  res = await reportService.getTechnicianPerformance();       break;
        case 'incidents':    res = await reportService.getIncidentAnalysis();            break;
        case 'sla':          res = await reportService.getSlaReport();                   break;
        case 'maintenance':  res = await reportService.getMaintenanceReport();           break;
        case 'satisfaction': res = await reportService.getCustomerSatisfactionReport();  break;
        default: return;
      }
      if (res.success) setData(res.data);
      else setError('Rapport indisponible');
    } catch {
      setError('Impossible de charger ce rapport. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data) {
      toast.error('Attendez le chargement du rapport avant de le sauvegarder');
      return;
    }

    try {
      await reportService.generateCustomReport({
        type: activeTab.toUpperCase(),
        snapshot: data
      });
      await loadSavedReports();
      toast.success('Rapport sauvegardé');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-gray-600 mt-1">Analyse des performances du système</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadReport(activeTab)}>
            <RefreshCw className="w-4 h-4 mr-2" />Actualiser
          </Button>
          <Button onClick={handleSave}>
            <Download className="w-4 h-4 mr-2" />Sauvegarder
          </Button>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="xl" /></div>
      ) : error ? (
        <Alert variant="warning">{error}</Alert>
      ) : !data ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="w-16 h-16 mx-auto mb-3" />
          <p>Aucune donnée disponible</p>
        </div>
      ) : (
        <ReportContent type={activeTab} data={data} />
      )}

      <Card>
        <CardHeader><CardTitle>Rapports sauvegardes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {savedReports.length === 0 ? (
            <p className="px-6 py-5 text-sm text-gray-500">Aucun rapport sauvegarde.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Periode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Sauvegarde le</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {savedReports.map(report => (
                    <tr key={report.id_rapport}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {report.contenu?.type || 'RAPPORT'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Du {formatReportDate(report.periode_debut)} au {formatReportDate(report.periode_fin)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {report.date_generation ? new Date(report.date_generation).toLocaleString('fr-FR') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSavedReport(report)}
                        >
                          <Eye className="mr-1 h-4 w-4" />Voir les détails
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSavedReport && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Détails du rapport {selectedSavedReport.contenu?.type || ''}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setSelectedSavedReport(null)}>
              Fermer
            </Button>
          </CardHeader>
          <CardContent>
            {selectedSavedReport.contenu?.details ? (
              <ReportContent
                type={(selectedSavedReport.contenu.type || '').toLowerCase()}
                data={selectedSavedReport.contenu.details}
              />
            ) : (
              <p className="text-sm text-gray-500">
                Les détails ne sont pas disponibles pour les rapports sauvegardés avant cette mise à jour.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * Contenu spécifique à chaque type de rapport
 */
const ReportContent = ({ type, data }) => {
  switch (type) {

    /* ── Performance techniciens ─────────────────────────────────────── */
    case 'performance': {
      const stats = data.globalStats || [];
      const chartData = stats.map(t => ({
        nom: `${t.technicien_prenom} ${t.technicien_nom}`,
        interventions: t.total_interventions || 0,
        resolus: parseInt(t.problemes_resolus) || 0
      }));

      return (
        <div className="space-y-6">
          {/* Cartes résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Techniciens actifs</p>
                <p className="text-3xl font-bold text-primary-600">{stats.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Total interventions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.reduce((s, t) => s + (t.total_interventions || 0), 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Problèmes résolus</p>
                <p className="text-3xl font-bold text-success-600">
                  {stats.reduce((s, t) => s + (parseInt(t.problemes_resolus) || 0), 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 && (
            <BarChart
              title="Interventions par technicien"
              data={chartData}
              dataKey="interventions"
              xAxisKey="nom"
              color="#8b5cf6"
            />
          )}

          {/* Tableau détaillé */}
          {stats.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Détail par technicien</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Technicien', 'Spécialité', 'Interventions', 'Résolus', 'Délai moyen'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.map(t => (
                      <tr key={t.id_technicien}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {t.technicien_prenom} {t.technicien_nom}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{t.specialite || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{t.total_interventions}</td>
                        <td className="px-6 py-4 text-sm text-success-600 font-medium">
                          {t.problemes_resolus}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {t.delai_moyen_heures ? `${parseFloat(t.delai_moyen_heures).toFixed(1)}h` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    /* ── Analyse des incidents ───────────────────────────────────────── */
    case 'incidents': {
      const parPriorite  = (data.par_priorite  || []).map(d => ({ urgence: d.urgence, count: d.count }));
      const parStatut    = (data.par_statut    || []).map(d => ({ statut:  d.statut,  count: d.count }));
      const materielAttn = data.materiel_attention || [];

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              title="Demandes par niveau d'urgence"
              data={parPriorite}
              dataKey="count"
              xAxisKey="urgence"
              color="#f59e0b"
            />
            <BarChart
              title="Demandes par statut"
              data={parStatut}
              dataKey="count"
              xAxisKey="statut"
              color="#3b82f6"
            />
          </div>

          {/* Matériel nécessitant attention */}
          {materielAttn.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-warning-600" />
                  Matériel nécessitant attention ({materielAttn.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Matériel', 'N° Série', 'Emplacement', 'Statut', 'Demandes ouvertes'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materielAttn.map(m => (
                      <tr key={m.id_materiel}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.nom}</td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{m.numero_serie}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{m.emplacement}</td>
                        <td className="px-6 py-4"><MaterielStatusBadge status={m.statut} /></td>
                        <td className="px-6 py-4 text-sm text-gray-900">{m.demandes_ouvertes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    /* ── SLA ─────────────────────────────────────────────────────────── */
    case 'sla': {
      const slaByUrgence = data.slaByUrgence || {};
      const demandesRetard = data.demandesEnRetard || [];
      const urgenceColors = {
        CRITIQUE: 'text-danger-600',
        HAUTE:    'text-orange-600',
        MOYENNE:  'text-warning-600',
        BASSE:    'text-success-600'
      };

      return (
        <div className="space-y-6">
          {/* Score global */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Score SLA global</p>
                  <p className="text-5xl font-bold text-primary-600">
                    {data.globalSLACompliance ?? 100}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Respect des délais d'intervention</p>
                </div>
                <ShieldCheck className="w-16 h-16 text-primary-200" />
              </div>
            </CardContent>
          </Card>

          {/* Détail par urgence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(slaByUrgence).map(([urgence, sla]) => (
              <Card key={urgence}>
                <CardContent>
                  <p className={`text-sm font-semibold mb-1 ${urgenceColors[urgence] || 'text-gray-600'}`}>
                    {urgence}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sla.respectSLA ?? '100'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {sla.enRetard} retard{sla.enRetard !== 1 ? 's' : ''} / {sla.total} demande{sla.total !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-400">SLA : {sla.seuil}h</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Demandes en retard */}
          {demandesRetard.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-danger-600">
                  Demandes en retard ({demandesRetard.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-gray-100">
                  {demandesRetard.slice(0, 10).map(d => (
                    <li key={d.id_demande} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.titre}</p>
                        <p className="text-xs text-gray-500">
                          {d.utilisateur_prenom} {d.utilisateur_nom}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        d.urgence === 'CRITIQUE' ? 'bg-danger-100 text-danger-700' :
                        d.urgence === 'HAUTE'    ? 'bg-orange-100 text-orange-700' :
                        'bg-warning-100 text-warning-700'
                      }`}>
                        {d.urgence}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    /* ── Maintenance ─────────────────────────────────────────────────── */
    case 'maintenance': {
      const maintenanceNeeded = data.maintenance_needed || [];
      const topPieces         = data.top_pieces_remplacees || [];
      const parStatut         = data.materiel_par_statut || [];

      return (
        <div className="space-y-6">
          {/* Stats statuts matériel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {parStatut.map(s => (
              <Card key={s.statut}>
                <CardContent>
                  <MaterielStatusBadge status={s.statut} />
                  <p className="text-3xl font-bold text-gray-900 mt-2">{s.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Matériel en maintenance */}
            <Card>
              <CardHeader>
                <CardTitle>Matériel en maintenance / en panne</CardTitle>
              </CardHeader>
              <CardContent>
                {maintenanceNeeded.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">Aucun matériel en attente de maintenance</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {maintenanceNeeded.map(m => (
                      <li key={m.id_materiel} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{m.nom}</p>
                          <p className="text-xs text-gray-500">{m.emplacement} — {m.numero_serie}</p>
                        </div>
                        <MaterielStatusBadge status={m.statut} size="xs" />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Top pièces remplacées */}
            <Card>
              <CardHeader>
                <CardTitle>Pièces les plus remplacées</CardTitle>
              </CardHeader>
              <CardContent>
                {topPieces.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">Aucune pièce remplacée pour le moment</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {topPieces.slice(0, 8).map((p, i) => (
                      <li key={i} className="py-2 flex justify-between items-center">
                        <p className="text-sm text-gray-900">{p.pieces_remplacees}</p>
                        <span className="text-sm font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                          ×{p.frequency}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    /* ── Satisfaction client ─────────────────────────────────────────── */
    case 'satisfaction': {
      const taux        = data.taux_satisfaction    ?? 0;
      const resolues    = data.demandes_resolues     ?? 0;
      const refusees    = data.demandes_refusees     ?? 0;
      const parDept     = data.temps_par_departement ?? [];

      return (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Taux de satisfaction</p>
                <p className="text-5xl font-bold text-primary-600">{taux}%</p>
                <p className="text-xs text-gray-500 mt-1">Demandes résolues / total traité</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Demandes résolues</p>
                <p className="text-4xl font-bold text-success-600">{resolues}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Demandes refusées</p>
                <p className="text-4xl font-bold text-danger-600">{refusees}</p>
              </CardContent>
            </Card>
          </div>

          {/* Temps par département */}
          {parDept.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Temps de résolution par département</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Département', 'Demandes', 'Temps moyen (h)'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parDept.map((d, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.departement}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{d.total_demandes}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {d.temps_moyen_heures !== null ? `${d.temps_moyen_heures}h` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    default:
      return <p className="text-gray-500">Rapport non disponible</p>;
  }
};

export default Rapports;
