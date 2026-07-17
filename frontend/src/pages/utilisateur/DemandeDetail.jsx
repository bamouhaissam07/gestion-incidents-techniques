import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, User, Package, MapPin,
  Clock, CheckCircle, AlertTriangle, X
} from 'lucide-react';
import { demandeService, interventionService } from '../../services';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge, UrgenceBadge } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { formatDateTime, formatDuration } from '../../utils/formatters';
import { getTimeAgo } from '../../utils/helpers';
import toast from 'react-hot-toast';

/**
 * Page de détail d'une demande — utilise les vrais champs retournés par l'API :
 *   materiel_serie, probleme_resolu, id_intervention, etc.
 */
const DemandeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demande, setDemande] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadDemandeDetails(); }, [id]);

  const loadDemandeDetails = async () => {
    setLoading(true);
    try {
      console.log('🔍 === DEBUG FRONTEND ===');
      console.log('📝 Chargement demande ID:', id);
      
      const [demandeRes, interventionsRes] = await Promise.allSettled([
        demandeService.getDemandeById(id),
        interventionService.getInterventionsByDemande(id)
      ]);
      
      console.log('📄 Réponse demandeService:', demandeRes);
      
      if (demandeRes.status === 'fulfilled' && demandeRes.value.success) {
        console.log('✅ Demande trouvée:', demandeRes.value.data);
        setDemande(demandeRes.value.data);
      } else {
        console.log('❌ Erreur ou demande non trouvée:', demandeRes.reason || 'success = false');
      }
      
      if (interventionsRes.status === 'fulfilled' && interventionsRes.value.success) {
        setInterventions(interventionsRes.value.data || []);
      }
      
    } catch (error) {
      console.error('❌ Erreur de chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDemande = async () => {
    setSubmitting(true);
    try {
      console.log('🔒 Fermeture de la demande ID:', id);
      await demandeService.changeStatut(id, 'FERMEE');
      toast.success('Demande fermée avec succès');
      setShowCloseModal(false);
      // Recharger les détails pour mettre à jour l'affichage
      await loadDemandeDetails();
    } catch (error) {
      console.error('❌ Erreur fermeture:', error);
      toast.error('Erreur lors de la fermeture de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (!demande) {
    return <Alert variant="danger">Demande introuvable</Alert>;
  }

  const isResolved = demande.statut === 'RESOLUE';
  const isClosed = demande.statut === 'FERMEE';
  const isRefused = demande.statut === 'REFUSEE';
  const canClose = isResolved && !isClosed; // Peut fermer seulement si résolue et pas encore fermée

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/demandes')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Retour à mes demandes
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <StatusBadge status={demande.statut} size="md" />
          <UrgenceBadge urgence={demande.urgence} size="md" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{demande.titre}</h1>
        <p className="text-gray-600 mt-1">Demande #{demande.id} • {demande.categorie}</p>
      </div>

      {/* Alertes */}
      {isRefused && demande.raison_refus && (
        <Alert variant="danger"><strong>Demande refusée :</strong> {demande.raison_refus}</Alert>
      )}
      {isResolved && (
        <Alert variant="success">
          <CheckCircle className="w-5 h-5 inline mr-2" />Cette demande a été résolue
        </Alert>
      )}
      {isClosed && (
        <Alert variant="info">
          <CheckCircle className="w-5 h-5 inline mr-2" />Cette demande a été fermée définitivement
        </Alert>
      )}

      {/* Actions utilisateur */}
      {canClose && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">Demande résolue</h3>
              <p className="text-sm text-green-700 mt-1">
                Le technicien a terminé l'intervention. Si tout fonctionne correctement, 
                vous pouvez fermer définitivement cette demande.
              </p>
              <div className="mt-3">
                <Button 
                  variant="success" 
                  onClick={() => setShowCloseModal(true)}
                  className="text-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Fermer la demande
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader><CardTitle>Description du problème</CardTitle></CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{demande.description}</p>
            </CardContent>
          </Card>

          {/* Interventions */}
          {interventions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Historique des interventions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interventions.map((intervention, index) => (
                    <div
                      key={intervention.id_intervention ?? index}
                      className="border-l-4 border-primary-500 pl-4 pb-4 last:pb-0"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900">
                          Intervention #{index + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(intervention.date_intervention)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Actions :</strong> {intervention.actions_prises}
                      </p>

                      {intervention.pieces_remplacees && (
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Pièces remplacées :</strong> {intervention.pieces_remplacees}
                        </p>
                      )}

                      {intervention.duree && (
                        <p className="text-sm text-gray-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Durée : {formatDuration(intervention.duree)}
                        </p>
                      )}

                      <div className="mt-2">
                        {/* Le backend retourne probleme_resolu */}
                        {intervention.probleme_resolu ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-success-100 text-success-700 rounded">
                            <CheckCircle className="w-3 h-3 mr-1" />Problème résolu
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-warning-100 text-warning-700 rounded">
                            En cours
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Créée</span>
                </div>
                <p className="text-sm text-gray-900">{formatDateTime(demande.date_creation)}</p>
                <p className="text-xs text-gray-500">{getTimeAgo(demande.date_creation)}</p>
              </div>

              {demande.technicien_nom && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Technicien assigné</span>
                  </div>
                  <p className="text-sm text-gray-900">
                    {demande.technicien_prenom} {demande.technicien_nom}
                  </p>
                  {demande.technicien_specialite && (
                    <p className="text-xs text-gray-500">{demande.technicien_specialite}</p>
                  )}
                </div>
              )}

              {demande.materiel_nom && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Package className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Matériel</span>
                  </div>
                  <p className="text-sm text-gray-900">{demande.materiel_nom}</p>
                  {/* Le backend retourne materiel_serie (pas materiel_numero_serie) */}
                  <p className="text-xs text-gray-500">{demande.materiel_serie}</p>
                  {demande.materiel_emplacement && (
                    <p className="text-xs text-gray-500">{demande.materiel_emplacement}</p>
                  )}
                </div>
              )}

              {demande.localisation && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Localisation</span>
                  </div>
                  <p className="text-sm text-gray-900">{demande.localisation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chronologie */}
          <Card>
            <CardHeader><CardTitle>Chronologie</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Créée</p>
                    <p className="text-xs text-gray-500">{formatDateTime(demande.date_creation)}</p>
                  </div>
                </div>

                {demande.technicien_nom && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Assignée</p>
                      <p className="text-xs text-gray-500">
                        {demande.technicien_prenom} {demande.technicien_nom}
                      </p>
                    </div>
                  </div>
                )}

                {isResolved || isClosed && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-success-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {isClosed ? 'Fermée' : 'Résolue'}
                      </p>
                      {demande.date_cloture && (
                        <p className="text-xs text-gray-500">{formatDateTime(demande.date_cloture)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de confirmation de fermeture */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Fermer la demande"
        footer={
          <>
            <Button 
              variant="ghost" 
              onClick={() => setShowCloseModal(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button 
              variant="success" 
              onClick={handleCloseDemande}
              loading={submitting}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmer la fermeture
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Êtes-vous satisfait de l'intervention ?
              </h3>
              <p className="text-gray-600 mt-2">
                En fermant cette demande, vous confirmez que :
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Le problème est complètement résolu
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Le matériel fonctionne correctement
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Vous n'avez plus besoin d'assistance
                </li>
              </ul>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  <strong>Attention :</strong> Une fois fermée, cette demande ne pourra plus être modifiée. 
                  Si le problème persiste, vous devrez créer une nouvelle demande.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DemandeDetail;
