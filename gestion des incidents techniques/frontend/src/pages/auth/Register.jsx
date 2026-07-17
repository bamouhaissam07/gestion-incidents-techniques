import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Building, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { validateRegisterForm } from '../../utils/validators';
import { ROLES, ROLE_LABELS } from '../../utils/constants';

/**
 * Page d'inscription
 */
const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    confirmPassword: '',
    type_personne: '',
    telephone: '',
    departement: '',
    // Champs spécifiques technicien
    specialite: '',
    niveau_expertise: '',
    // Champ spécifique utilisateur
    poste: ''
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Options pour le type de compte (GESTIONNAIRE retiré - création seulement par admin)
  const typePersonneOptions = [
    { value: ROLES.UTILISATEUR, label: ROLE_LABELS[ROLES.UTILISATEUR] },
    { value: ROLES.TECHNICIEN, label: ROLE_LABELS[ROLES.TECHNICIEN] }
    // GESTIONNAIRE ne peut plus être sélectionné à l'inscription publique
  ];

  // Options niveau d'expertise (pour techniciens)
  const niveauExpertiseOptions = [
    { value: '', label: 'Sélectionner...', disabled: true },
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'INTERMEDIAIRE', label: 'Intermédiaire' },
    { value: 'SENIOR', label: 'Senior' },
    { value: 'EXPERT', label: 'Expert' }
  ];

  // Gérer les changements de champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Nettoyer l'erreur du champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Nettoyer l'erreur serveur
    if (serverError) {
      setServerError('');
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation côté client
    const { isValid, errors: validationErrors } = validateRegisterForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Préparer les données selon le type de personne
      const dataToSend = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        mot_de_passe: formData.mot_de_passe,
        type_personne: formData.type_personne,
        telephone: formData.telephone || null,
        departement: formData.departement || null
      };

      // Ajouter les champs spécifiques selon le rôle
      if (formData.type_personne === ROLES.TECHNICIEN) {
        dataToSend.specialite = formData.specialite || null;
        dataToSend.niveau_expertise = formData.niveau_expertise || 'JUNIOR';
      } else if (formData.type_personne === ROLES.UTILISATEUR) {
        dataToSend.poste = formData.poste || null;
      }
      // GESTIONNAIRE n'a pas de champs spécifiques supplémentaires

      await register(dataToSend);

      // Rediriger vers le dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(error.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
    }
  };

  const isTechnicien = formData.type_personne === ROLES.TECHNICIEN;
  const isUtilisateur = formData.type_personne === ROLES.UTILISATEUR;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl w-full">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">GIT</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Créer un compte
          </h1>
          <p className="text-gray-600">
            Rejoignez la plateforme de gestion des incidents
          </p>
        </div>

        {/* Formulaire d'inscription */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {serverError && (
            <Alert variant="danger" className="mb-6" onClose={() => setServerError('')}>
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Informations de base */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                error={errors.prenom}
                placeholder="Jean"
                icon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                error={errors.nom}
                placeholder="Dupont"
                icon={<User className="w-4 h-4" />}
                required
              />
            </div>

            <Input
              label="Adresse email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="jean.dupont@entreprise.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />

            {/* Type de compte */}
            <Select
              label="Type de compte"
              name="type_personne"
              value={formData.type_personne}
              onChange={handleChange}
              error={errors.type_personne}
              options={typePersonneOptions}
              placeholder="Sélectionnez votre rôle"
              required
            />

            {/* Champs communs optionnels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Téléphone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleChange}
                error={errors.telephone}
                placeholder="01 23 45 67 89"
                icon={<Phone className="w-4 h-4" />}
              />

              <Input
                label="Département"
                name="departement"
                value={formData.departement}
                onChange={handleChange}
                error={errors.departement}
                placeholder="IT, RH, Finance..."
                icon={<Building className="w-4 h-4" />}
              />
            </div>

            {/* Champs spécifiques Technicien */}
            {isTechnicien && (
              <div className="border-t border-gray-200 pt-5 space-y-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Informations techniques
                </h3>
                
                <Input
                  label="Spécialité"
                  name="specialite"
                  value={formData.specialite}
                  onChange={handleChange}
                  error={errors.specialite}
                  placeholder="Réseaux, Matériel, Logiciel..."
                  helperText="Votre domaine d'expertise principal"
                />

                <Select
                  label="Niveau d'expertise"
                  name="niveau_expertise"
                  value={formData.niveau_expertise}
                  onChange={handleChange}
                  error={errors.niveau_expertise}
                  options={niveauExpertiseOptions}
                />
              </div>
            )}

            {/* Champs spécifiques Utilisateur */}
            {isUtilisateur && (
              <div className="border-t border-gray-200 pt-5">
                <Input
                  label="Poste"
                  name="poste"
                  value={formData.poste}
                  onChange={handleChange}
                  error={errors.poste}
                  placeholder="Chef de projet, Analyste..."
                  helperText="Votre fonction dans l'entreprise"
                />
              </div>
            )}

            {/* Mot de passe */}
            <div className="border-t border-gray-200 pt-5 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Sécurité
              </h3>

              <Input
                label="Mot de passe"
                name="mot_de_passe"
                type="password"
                value={formData.mot_de_passe}
                onChange={handleChange}
                error={errors.mot_de_passe}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                helperText="Au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre"
                required
              />

              <Input
                label="Confirmer le mot de passe"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Créer mon compte
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Info supplémentaire */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            En créant un compte, vous acceptez nos{' '}
            <Link to="/terms" className="text-primary-600 hover:underline">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">
              politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;