import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { demandeService, materielService } from '../../services';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import { validateDemandeForm } from '../../utils/validators';
import { URGENCE_LEVELS } from '../../utils/constants';
import toast from 'react-hot-toast';

/**
 * Page de création d'une nouvelle demande d'intervention
 */
const CreateDemande = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingMateriel, setLoadingMateriel] = useState(true);
  const [materielList, setMaterielList] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    urgence: '',
    categorie: '',
    id_materiel: '',
    localisation: ''
  });

  const [errors, setErrors] = useState({});

  // Charger les données nécessaires
  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    setLoadingMateriel(true);
    try {
      // Charger le matériel disponible
      const materielResponse = await materielService.getAllMateriel();
      if (materielResponse.success) {
        setMaterielList(materielResponse.data || []);
      }

      // Charger les catégories
      const categoriesResponse = await demandeService.getCategories();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoadingMateriel(false);
    }
  };

  // Options d'urgence
  const urgenceOptions = [
    { value: '', label: 'Sélectionnez le niveau d\'urgence', disabled: true },
    { value: URGENCE_LEVELS.BASSE, label: 'Basse - Problème mineur, pas d\'impact immédiat' },
    { value: URGENCE_LEVELS.MOYENNE, label: 'Moyenne - Gêne modérée dans le travail' },
    { value: URGENCE_LEVELS.HAUTE, label: 'Haute - Impact significatif sur le travail' },
    { value: URGENCE_LEVELS.CRITIQUE, label: 'Critique - Blocage total, urgent' }
  ];

  // Options de catégories
  const categorieOptions = [
    { value: '', label: 'Sélectionnez une catégorie', disabled: true },
    ...categories.map(cat => ({
      value: cat.nom || cat,
      label: cat.nom || cat
    }))
  ];

  // Options de matériel — utiliser id_materiel comme valeur
  const materielOptions = [
    { value: '', label: 'Sélectionnez le matériel concerné', disabled: true },
    ...materielList.map(mat => ({
      value: mat.id_materiel ?? mat.id,
      label: `${mat.nom} - ${mat.numero_serie} (${mat.emplacement})`
    }))
  ];

  // Gérer les changements de champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Nettoyer l'erreur du champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const { isValid, errors: validationErrors } = validateDemandeForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await demandeService.createDemande({
        ...formData,
        id_utilisateur: user.id,
        id_materiel: parseInt(formData.id_materiel)
      });

      if (response.success) {
        toast.success('Demande créée avec succès');
        navigate('/demandes');
      }
    } catch (error) {
      console.error('Erreur de création:', error);
      toast.error('Erreur lors de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <h1 className="text-2xl font-bold text-gray-900">
          Nouvelle demande d'intervention
        </h1>
        <p className="text-gray-600 mt-1">
          Décrivez le problème rencontré avec le plus de détails possible
        </p>
      </div>

      {/* Informations importantes */}
      <Alert variant="info" className="mb-6">
        <strong>Avant de soumettre votre demande :</strong>
        <ul className="mt-2 text-sm space-y-1">
          <li>• Vérifiez que le problème n'est pas déjà résolu</li>
          <li>• Décrivez précisément le problème et les étapes pour le reproduire</li>
          <li>• Choisissez le bon niveau d'urgence pour prioriser le traitement</li>
        </ul>
      </Alert>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de la demande</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Titre */}
            <Input
              label="Titre de la demande"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              error={errors.titre}
              placeholder="Ex: Ordinateur qui ne démarre plus"
              helperText="Un titre court et descriptif"
              required
            />

            {/* Description */}
            <Textarea
              label="Description détaillée"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              placeholder="Décrivez le problème en détail : quand est-il apparu, quelles sont les conséquences, que se passe-t-il exactement..."
              rows={6}
              maxLength={1000}
              helperText="Plus vous êtes précis, plus vite nous pourrons vous aider"
              required
            />

            {/* Urgence et Catégorie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Niveau d'urgence"
                name="urgence"
                value={formData.urgence}
                onChange={handleChange}
                error={errors.urgence}
                options={urgenceOptions}
                required
              />

              <Select
                label="Catégorie"
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                error={errors.categorie}
                options={categorieOptions}
                required
              />
            </div>

            {/* Matériel concerné */}
            <Select
              label="Matériel concerné"
              name="id_materiel"
              value={formData.id_materiel}
              onChange={handleChange}
              error={errors.id_materiel}
              options={materielOptions}
              helperText="Sélectionnez l'équipement qui pose problème"
              disabled={loadingMateriel}
              required
            />

            {/* Localisation */}
            <Input
              label="Localisation"
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              error={errors.localisation}
              placeholder="Ex: Bureau 205, Bâtiment A"
              helperText="Où se trouve le matériel concerné ?"
            />

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                loading={loading}
                disabled={loadingMateriel}
              >
                <Send className="w-4 h-4 mr-2" />
                Soumettre la demande
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Aide supplémentaire */}
      <Card className="mt-6 bg-gray-50">
        <CardContent>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Temps de réponse estimés selon l'urgence
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>Critique :</strong> Prise en charge dans les 2 heures</p>
            <p>• <strong>Haute :</strong> Prise en charge dans les 8 heures</p>
            <p>• <strong>Moyenne :</strong> Prise en charge sous 24 heures</p>
            <p>• <strong>Basse :</strong> Prise en charge sous 48 heures</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateDemande;