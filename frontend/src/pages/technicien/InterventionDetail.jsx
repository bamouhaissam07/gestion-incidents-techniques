import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Wrench } from 'lucide-react';
import { demandeService, interventionService } from '../../services';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge, UrgenceBadge } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const InterventionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demande, setDemande] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [raisonRefus, setRaisonRefus] = useState('');
  const [interventionForm, setInterventionForm] = useState({
    actions_prises: '',
    pieces_remplacees: '',
    duree: '',
    resolu: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔧 === DEBUG TECHNICIEN FRONTEND ===');
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
      console.error('❌ Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await demandeService.changeStatut(id, 'ACCEPTEE');
      toast.success('Demande acceptée');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefuse = async () => {
    if (!raisonRefus.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }
    setSubmitting(true);
    try {
      await demandeService.changeStatut(id, 'REFUSEE', raisonRefus);
      toast.success('Demande refusée');
      setShowRefuseModal(false);
      navigate('/interventions');
    } catch (error) {
      toast.error('Erreur lors du refus');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnregistrerIntervention = async () => {
    if (!interventionForm.actions_prises.trim()) {
      toast.error('Veuillez décrire les actions prises');
      return;
    }
    setSubmitting(true);
    try {
      await interventionService.createIntervention({
        id_demande:          parseInt(id),
        actions_prises:      interventionForm.actions_prises,
        pieces_remplacees:   interventionForm.pieces_remplacees || null,
        duree:               interventionForm.duree ? parseInt(interventionForm.duree) : null,
        probleme_resolu:     interventionForm.resolu  // le backend attend probleme_resolu
      });
      
      // Si résolu, changer le statut de la demande
      if (interventionForm.resolu) {
        await demandeService.changeStatut(id, 'RESOLUE');
      }
      
      toast.success('Intervention enregistrée');
      setShowInterventionModal(false);
      setInterventionForm({
        actions_prises: '',
        pieces_remplacees: '',
        duree: '',
        resolu: false
      });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (!demande) {
    return <div className="text-center py-12 text-gray-500">Demande introuvable</div>;
  }

  const canAcceptRefuse = demande.statut === 'ASSIGNEE';
  const canIntervene = ['ACCEPTEE', 'EN_COURS'].includes(demande.statut);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/interventions')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={demande.statut} size="md" />
              <UrgenceBadge urgence={demande.urgence} size="md" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{demande.titre}</h1>
            <p className="text-gray-600 mt-1">Demande #{demande.id}</p>
          </div>
          
          <div className="flex gap-2">
            {canAcceptRefuse && (
              <>
                <Button variant="success" onClick={handleAccept} loading={submitting}>
                  <Check className="w-4 h-4 mr-2" />
                  Accepter
                </Button>
                <Button variant="danger" onClick={() => setShowRefuseModal(true)}>
                  <X className="w-4 h-4 mr-2" />
                  Refuser
                </Button>
              </>
            )}
            {canIntervene && (
              <Button onClick={() => setShowInterventionModal(true)}>
                <Wrench className="w-4 h-4 mr-2" />
                Enregistrer intervention
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{demande.description}</p>
            </CardContent>
          </Card>

          {interventions.length > 0 && (
            <Card className="mt-6">
              <CardHeader><CardTitle>Interventions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interventions.map((inter, idx) => (
                    <div key={inter.id} className="border-l-4 border-primary-500 pl-4">
                      <p className="text-sm font-semibold mb-1">Intervention #{idx + 1}</p>
                      <p className="text-sm text-gray-700 mb-2"><strong>Actions:</strong> {inter.actions_prises}</p>
                      {inter.pieces_remplacees && <p className="text-sm text-gray-700 mb-2"><strong>Pièces:</strong> {inter.pieces_remplacees}</p>}
                      <p className="text-xs text-gray-500">{formatDateTime(inter.date_intervention)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Demandeur</p>
                <p className="text-sm text-gray-900">{demande.utilisateur_prenom} {demande.utilisateur_nom}</p>
                <p className="text-xs text-gray-500">{demande.utilisateur_email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Matériel</p>
                <p className="text-sm text-gray-900">{demande.materiel_nom}</p>
                <p className="text-xs text-gray-500">{demande.materiel_numero_serie}</p>
              </div>
              {demande.localisation && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Localisation</p>
                  <p className="text-sm text-gray-900">{demande.localisation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Refus */}
      <Modal
        isOpen={showRefuseModal}
        onClose={() => setShowRefuseModal(false)}
        title="Refuser la demande"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRefuseModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleRefuse} loading={submitting}>Confirmer le refus</Button>
          </>
        }
      >
        <Textarea
          label="Raison du refus"
          value={raisonRefus}
          onChange={(e) => setRaisonRefus(e.target.value)}
          placeholder="Expliquez pourquoi vous refusez cette demande..."
          rows={4}
          required
        />
      </Modal>

      {/* Modal Intervention */}
      <Modal
        isOpen={showInterventionModal}
        onClose={() => setShowInterventionModal(false)}
        title="Enregistrer une intervention"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowInterventionModal(false)}>Annuler</Button>
            <Button onClick={handleEnregistrerIntervention} loading={submitting}>Enregistrer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Actions prises"
            value={interventionForm.actions_prises}
            onChange={(e) => setInterventionForm(prev => ({ ...prev, actions_prises: e.target.value }))}
            placeholder="Décrivez les actions effectuées..."
            rows={4}
            required
          />
          <Textarea
            label="Pièces remplacées"
            value={interventionForm.pieces_remplacees}
            onChange={(e) => setInterventionForm(prev => ({ ...prev, pieces_remplacees: e.target.value }))}
            placeholder="Listez les pièces remplacées (optionnel)"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée (minutes)</label>
              <input
                type="number"
                value={interventionForm.duree}
                onChange={(e) => setInterventionForm(prev => ({ ...prev, duree: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="60"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={interventionForm.resolu}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, resolu: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Problème résolu</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InterventionDetail;