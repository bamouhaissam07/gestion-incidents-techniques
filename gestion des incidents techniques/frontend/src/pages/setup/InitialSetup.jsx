import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock, Shield, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { api } from '../../services/api';

/**
 * 🏢 Page d'installation initiale pour l'entreprise
 * 
 * Cette page ne s'affiche que s'il n'y a aucun gestionnaire dans le système
 * Elle permet de créer le premier compte gestionnaire (directeur, responsable IT, etc.)
 */
const InitialSetup = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Informations entreprise
    nomEntreprise: '',
    secteurActivite: '',
    
    // Informations gestionnaire
    nom: '',
    prenom: '',
    email: '',
    poste: '',
    telephone: '',
    mot_de_passe: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Vérifier si l'installation est nécessaire
  useEffect(() => {
    checkIfSetupNeeded();
  }, []);

  const checkIfSetupNeeded = async () => {
    try {
      // Vérifier s'il y a des gestionnaires existants
      const response = await api.get('/auth/check-setup');
      
      if (response.data.hasGestionnaires) {
        // Il y a déjà des gestionnaires, rediriger vers login
        navigate('/login', { 
          state: { 
            message: 'Le système est déjà configuré. Connectez-vous avec vos identifiants.' 
          }
        });
      }
    } catch (error) {
      console.log('Vérification setup échouée, continuer avec l\'installation');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Nettoyer l'erreur du champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.nomEntreprise.trim()) {
      newErrors.nomEntreprise = 'Le nom de l\'entreprise est obligatoire';
    }
    
    if (!formData.secteurActivite.trim()) {
      newErrors.secteurActivite = 'Le secteur d\'activité est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est obligatoire';
    }
    
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est obligatoire';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.poste.trim()) {
      newErrors.poste = 'Le poste est obligatoire';
    }
    
    if (!formData.mot_de_passe) {
      newErrors.mot_de_passe = 'Le mot de passe est obligatoire';
    } else if (formData.mot_de_passe.length < 8) {
      newErrors.mot_de_passe = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    if (formData.mot_de_passe !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const setupData = {
        // Données entreprise
        entreprise: {
          nom: formData.nomEntreprise,
          secteur: formData.secteurActivite
        },
        
        // Données gestionnaire
        gestionnaire: {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          poste: formData.poste,
          telephone: formData.telephone,
          mot_de_passe: formData.mot_de_passe
        }
      };

      await api.post('/auth/initial-setup', setupData);
      
      setSetupComplete(true);
      
      // Rediriger vers login après 3 secondes
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Installation terminée ! Connectez-vous avec vos identifiants.',
            email: formData.email
          }
        });
      }, 3000);
      
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Erreur lors de l\'installation'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              🎉 Installation Terminée !
            </h1>
            
            <p className="text-gray-600 mb-6">
              Votre système de gestion des incidents techniques est maintenant configuré.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Gestionnaire créé :</strong><br />
                {formData.prenom} {formData.nom}<br />
                {formData.email}
              </p>
            </div>
            
            <p className="text-gray-500 text-sm">
              Redirection automatique vers la page de connexion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuration Initiale
          </h1>
          <p className="text-gray-600">
            Bienvenue ! Configurons votre système de gestion des incidents techniques.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className={`text-sm ${step >= 1 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
              1. Entreprise
            </span>
            <span className={`text-sm ${step >= 2 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
              2. Gestionnaire
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {errors.submit && (
            <Alert variant="danger" className="mb-6">
              {errors.submit}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Informations de l'entreprise
                </h2>
                
                <Input
                  label="Nom de l'entreprise"
                  name="nomEntreprise"
                  value={formData.nomEntreprise}
                  onChange={handleChange}
                  error={errors.nomEntreprise}
                  placeholder="Ex: TechCorp Solutions"
                  icon={Building2}
                  required
                />
                
                <Input
                  label="Secteur d'activité"
                  name="secteurActivite"
                  value={formData.secteurActivite}
                  onChange={handleChange}
                  error={errors.secteurActivite}
                  placeholder="Ex: Informatique, Industrie, Services..."
                  required
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="button"
                    onClick={handleNext}
                    className="px-8"
                  >
                    Suivant →
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Compte Gestionnaire Principal
                  </h2>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Ce compte aura tous les privilèges administrateur du système.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    error={errors.nom}
                    placeholder="Nom de famille"
                    icon={User}
                    required
                  />
                  
                  <Input
                    label="Prénom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    error={errors.prenom}
                    placeholder="Prénom"
                    required
                  />
                </div>
                
                <Input
                  label="Email professionnel"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="directeur@votre-entreprise.com"
                  icon={Mail}
                  required
                />
                
                <Input
                  label="Poste/Fonction"
                  name="poste"
                  value={formData.poste}
                  onChange={handleChange}
                  error={errors.poste}
                  placeholder="Ex: Directeur IT, Responsable Technique"
                  required
                />
                
                <Input
                  label="Téléphone (optionnel)"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+33 1 23 45 67 89"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Mot de passe"
                    name="mot_de_passe"
                    type="password"
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    error={errors.mot_de_passe}
                    placeholder="Minimum 8 caractères"
                    icon={Lock}
                    required
                  />
                  
                  <Input
                    label="Confirmer le mot de passe"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    placeholder="Répéter le mot de passe"
                    required
                  />
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    ← Retour
                  </Button>
                  
                  <Button 
                    type="submit"
                    isLoading={isLoading}
                    className="px-8"
                  >
                    Finaliser l'installation
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          Cette configuration n'est nécessaire qu'une seule fois.
        </div>
      </div>
    </div>
  );
};

export default InitialSetup;