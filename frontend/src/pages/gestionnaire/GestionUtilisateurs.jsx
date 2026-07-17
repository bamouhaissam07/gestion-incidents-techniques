import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { userService } from '../../services';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Table, { TablePagination } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { RoleBadge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/forms';
import toast from 'react-hot-toast';

const emptyForm = {
  nom: '', prenom: '', email: '',
  type_personne: '', telephone: '', departement: ''
};

/**
 * Gestion des utilisateurs — CRUD complet
 */
const GestionUtilisateurs = () => {
  const [loading, setLoading]           = useState(true);
  const [users, setUsers]               = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showModal, setShowModal]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser]   = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [formData, setFormData]         = useState(emptyForm);
  const [pagination, setPagination]     = useState({
    currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0
  });

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { filterUsers(); }, [users, searchTerm]);

  // ─── Chargement ─────────────────────────────────────────────────────────
  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('📊 Chargement des utilisateurs...');
      const response = await userService.getAllUsers();
      console.log('📊 Response getAllUsers:', response);
      
      if (response.success) {
        // Normaliser : ajouter .id = id_personne pour simplifier les opérations
        const normalized = (response.data || []).map(u => ({
          ...u,
          id: u.id_personne ?? u.id
        }));
        console.log('📊 Utilisateurs normalisés:', normalized);
        setUsers(normalized);
        console.log('✅ État users mis à jour');
      }
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast.error('Erreur de chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // ─── Filtrage ────────────────────────────────────────────────────────────
  const filterUsers = () => {
    const f = users.filter(u =>
      !searchTerm ||
      `${u.prenom} ${u.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(f);
    setPagination(p => ({
      ...p,
      totalItems: f.length,
      totalPages: Math.ceil(f.length / p.itemsPerPage),
      currentPage: 1
    }));
  };

  // ─── Sauvegarde (création / édition) ─────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.nom || !formData.prenom || !formData.email || !formData.type_personne) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      if (editingUser) {
        console.log('🔄 Modification utilisateur:', editingUser.id, formData);
        const result = await userService.updateUser(editingUser.id, formData);
        console.log('✅ Résultat modification:', result);
        toast.success('Utilisateur modifié');
      } else {
        // mot_de_passe temporaire — l'utilisateur devra le changer
        await userService.createUser({ ...formData, mot_de_passe: 'Temp@' + Math.random().toString(36).slice(2, 8) });
        toast.success('Utilisateur créé');
      }
      setShowModal(false);
      resetForm();
      
      // 🚀 FORCE LE RECHARGEMENT AVEC DEBUG
      console.log('🔄 Rechargement des utilisateurs...');
      await loadUsers();
      console.log('✅ Rechargement terminé');
      
      // 🔄 RECHARGEMENT ADDITIONNEL AVEC DÉLAI (au cas où)
      setTimeout(async () => {
        console.log('🔄 Rechargement secondaire...');
        await loadUsers();
      }, 1000);
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // ─── Suppression ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await userService.deleteUser(userToDelete.id);
      toast.success('Utilisateur supprimé');
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData(emptyForm);
    setEditingUser(null);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      nom:          user.nom,
      prenom:       user.prenom,
      email:        user.email,
      type_personne: user.type_personne,
      telephone:    user.telephone || '',
      departement:  user.departement || ''
    });
    setShowModal(true);
  };

  const field = (name, value) => setFormData(p => ({ ...p, [name]: value }));

  // ─── Colonnes ────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'nom', label: 'Utilisateur',
      render: u => (
        <div>
          <p className="text-sm font-medium">{u.prenom} {u.nom}</p>
          <p className="text-xs text-gray-500">{u.email}</p>
        </div>
      )
    },
    { key: 'role',        label: 'Rôle',        render: u => <RoleBadge role={u.type_personne} /> },
    { key: 'departement', label: 'Département',  render: u => <span className="text-sm">{u.departement || '—'}</span> },
    { key: 'specialite',  label: 'Spécialité',   render: u => <span className="text-sm">{u.specialite || '—'}</span> },
    {
      key: 'actions', label: 'Actions',
      render: u => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEditModal(u)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setUserToDelete(u); setShowDeleteModal(true); }}>
            <Trash2 className="w-4 h-4 text-danger-600" />
          </Button>
        </div>
      )
    }
  ];

  const startIndex    = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedData = filteredUsers.slice(startIndex, startIndex + pagination.itemsPerPage);

  // ─── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-1">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            🔄 Actualiser
          </Button>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent>
          <SearchBar placeholder="Rechercher par nom, prénom ou email..." onSearch={setSearchTerm} />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Liste des utilisateurs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={paginatedData}
            loading={loading}
            emptyMessage="Aucun utilisateur trouvé"
          />
          {filteredUsers.length > 0 && (
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={p => setPagination(prev => ({ ...prev, currentPage: p }))}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal création / édition */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
            <Button onClick={handleSubmit}>Enregistrer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom *" value={formData.prenom} onChange={e => field('prenom', e.target.value)} required />
            <Input label="Nom *"    value={formData.nom}    onChange={e => field('nom', e.target.value)}    required />
          </div>
          <Input label="Email *" type="email" value={formData.email} onChange={e => field('email', e.target.value)} required />
          <Select
            label="Rôle *"
            value={formData.type_personne}
            onChange={e => field('type_personne', e.target.value)}
            options={[
              { value: '',             label: 'Sélectionner un rôle', disabled: true },
              { value: 'UTILISATEUR',  label: 'Utilisateur' },
              { value: 'TECHNICIEN',   label: 'Technicien' },
              { value: 'GESTIONNAIRE', label: 'Gestionnaire' }
            ]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Téléphone"   value={formData.telephone}   onChange={e => field('telephone', e.target.value)} />
            <Input label="Département" value={formData.departement} onChange={e => field('departement', e.target.value)} />
          </div>
          {!editingUser && (
            <p className="text-xs text-gray-500">
              Un mot de passe temporaire sera généré automatiquement. L'utilisateur devra le changer à sa première connexion.
            </p>
          )}
        </div>
      </Modal>

      {/* Confirmation suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setUserToDelete(null); }}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Voulez-vous vraiment supprimer ${userToDelete?.prenom} ${userToDelete?.nom} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        confirmVariant="danger"
      />
    </div>
  );
};

export default GestionUtilisateurs;
