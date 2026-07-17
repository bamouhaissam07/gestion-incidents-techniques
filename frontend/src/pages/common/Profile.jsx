import React, { useState } from 'react';
import { User, Mail, Phone, Building, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { RoleBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { validateProfileForm } from '../../utils/validators';
import { formatPhone } from '../../utils/formatters';

/**
 * Page Profil utilisateur
 */
const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // État du formulaire de profil
  const [profileForm, setProfileForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    // Champs utilisateur
    departement: user?.departement || '',
    poste: user?.poste || '',
    // Champs technicien
    specialite: user?.specialite || '',
    disponibilite: user?.disponibilite || false
  });
  const [profileErrors, setProfileErrors] = useState({});

  // État du formulaire de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmation_mot_de_passe: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Gérer les changements du formulaire de profil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    // Nettoyer l'erreur du champ
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Gérer les changements du formulaire de mot de passe
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    // Nettoyer l'erreur du champ
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Soumettre la mise à jour du profil
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const { isValid, errors } = validateProfileForm(profileForm);
    if (!isValid) {
      setProfileErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await updateProfile(profileForm);
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Erreur:', error);
      setProfileErrors({ general: error.message || 'Erreur lors de la mise à jour' });
    } finally {
      setLoading(false);
    }
  };

  // Soumettre le changement de mot de passe
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validation simple
    const errors = {};
    if (!passwordForm.ancien_mot_de_passe) {
      errors.ancien_mot_de_passe = 'L\'ancien mot de passe est requis';
    }
    if (!passwordForm.nouveau_mot_de_passe) {
      errors.nouveau_mot_de_passe = 'Le nouveau mot de passe est requis';
    } else if (passwordForm.nouveau_mot_de_passe.length < 8) {
      errors.nouveau_mot_de_passe = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (passwordForm.nouveau_mot_de_passe !== passwordForm.confirmation_mot_de_passe) {
      errors.confirmation_mot_de_passe = 'Les mots de passe ne correspondent pas';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        ancien_mot_de_passe: passwordForm.ancien_mot_de_passe,
        nouveau_mot_de_passe: passwordForm.nouveau_mot_de_passe
      });
      setIsChangingPassword(false);
      setPasswordForm({
        ancien_mot_de_passe: '',
        nouveau_mot_de_passe: '',
        confirmation_mot_de_passe: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte informations principales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informations personnelles</CardTitle>
              {!isEditingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {isEditingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {profileErrors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{profileErrors.general}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Prénom"
                    name="prenom"
                    value={profileForm.prenom}
                    onChange={handleProfileChange}
                    error={profileErrors.prenom}
                    required
                  />
                  <Input
                    label="Nom"
                    name="nom"
                    value={profileForm.nom}
                    onChange={handleProfileChange}
                    error={profileErrors.nom}
                    required
                  />
                </div>

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  error={profileErrors.email}
                  required
                  icon={<Mail className="w-4 h-4" />}
                />

                <Input
                  label="Téléphone"
                  name="telephone"
                  type="tel"
                  value={profileForm.telephone}
                  onChange={handleProfileChange}
                  error={profileErrors.telephone}
                  icon={<Phone className="w-4 h-4" />}
                />

                {/* Champs spécifiques selon le rôle */}
                {user?.type_personne === 'UTILISATEUR' && (
                  <>
                    <Input
                      label="Département"
                      name="departement"
                      value={profileForm.departement}
                      onChange={handleProfileChange}
                      error={profileErrors.departement}
                      icon={<Building className="w-4 h-4" />}
                    />
                    <Input
                      label="Poste"
                      name="poste"
                      value={profileForm.poste}
                      onChange={handleProfileChange}
                      error={profileErrors.poste}
                      icon={<Building className="w-4 h-4" />}
                    />
                  </>
                )}

                {user?.type_personne === 'TECHNICIEN' && (
                  <>
                    <Input
                      label="Spécialité"
                      name="specialite"
                      value={profileForm.specialite}
                      onChange={handleProfileChange}
                      error={profileErrors.specialite}
                      placeholder="ex: Réseau, Hardware, Software..."
                      icon={<Building className="w-4 h-4" />}
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="disponibilite"
                        name="disponibilite"
                        checked={profileForm.disponibilite || false}
                        onChange={(e) => setProfileForm(prev => ({ 
                          ...prev, 
                          disponibilite: e.target.checked 
                        }))}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="disponibilite" className="text-sm text-gray-700">
                        Disponible pour interventions
                      </label>
                    </div>
                  </>
                )}

                {user?.type_personne === 'GESTIONNAIRE' && (
                  <div className="text-sm text-gray-500 italic">
                    Aucun champ spécifique pour les gestionnaires.
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="submit" loading={loading}>
                    Enregistrer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileForm({
                        nom: user?.nom || '',
                        prenom: user?.prenom || '',
                        email: user?.email || '',
                        telephone: user?.telephone || '',
                        departement: user?.departement || ''
                      });
                      setProfileErrors({});
                    }}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Prénom</p>
                    <p className="text-base font-medium text-gray-900">{user?.prenom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nom</p>
                    <p className="text-base font-medium text-gray-900">{user?.nom}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base font-medium text-gray-900">{user?.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatPhone(user?.telephone) || '-'}
                  </p>
                </div>

                {/* Champs spécifiques selon le rôle */}
                {user?.type_personne === 'UTILISATEUR' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Département</p>
                      <p className="text-base font-medium text-gray-900">
                        {user?.departement || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Poste</p>
                      <p className="text-base font-medium text-gray-900">
                        {user?.poste || '-'}
                      </p>
                    </div>
                  </>
                )}

                {user?.type_personne === 'TECHNICIEN' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Spécialité</p>
                      <p className="text-base font-medium text-gray-900">
                        {user?.specialite || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Disponibilité</p>
                      <p className="text-base font-medium text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user?.disponibilite 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user?.disponibilite ? 'Disponible' : 'Non disponible'}
                        </span>
                      </p>
                    </div>
                  </>
                )}

                {user?.type_personne === 'GESTIONNAIRE' && (
                  <div>
                    <p className="text-sm text-gray-500">Informations spéciales</p>
                    <p className="text-base text-gray-600 italic">
                      Aucune information spécifique pour les gestionnaires.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carte rôle et sécurité */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rôle</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleBadge role={user?.type_personne} size="md" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsChangingPassword(true)}
              >
                <Lock className="w-4 h-4 mr-2" />
                Changer le mot de passe
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal changement de mot de passe */}
      <Modal
        isOpen={isChangingPassword}
        onClose={() => {
          setIsChangingPassword(false);
          setPasswordForm({
            ancien_mot_de_passe: '',
            nouveau_mot_de_passe: '',
            confirmation_mot_de_passe: ''
          });
          setPasswordErrors({});
        }}
        title="Changer le mot de passe"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsChangingPassword(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button onClick={handlePasswordSubmit} loading={loading}>
              Changer
            </Button>
          </>
        }
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Ancien mot de passe"
            name="ancien_mot_de_passe"
            type="password"
            value={passwordForm.ancien_mot_de_passe}
            onChange={handlePasswordChange}
            error={passwordErrors.ancien_mot_de_passe}
            required
          />

          <Input
            label="Nouveau mot de passe"
            name="nouveau_mot_de_passe"
            type="password"
            value={passwordForm.nouveau_mot_de_passe}
            onChange={handlePasswordChange}
            error={passwordErrors.nouveau_mot_de_passe}
            helperText="Au moins 8 caractères"
            required
          />

          <Input
            label="Confirmer le nouveau mot de passe"
            name="confirmation_mot_de_passe"
            type="password"
            value={passwordForm.confirmation_mot_de_passe}
            onChange={handlePasswordChange}
            error={passwordErrors.confirmation_mot_de_passe}
            required
          />
        </form>
      </Modal>
    </div>
  );
};

export default Profile;