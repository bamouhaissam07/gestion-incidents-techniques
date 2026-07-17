import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, RefreshCw } from 'lucide-react';
import { materielService } from '../../services';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Table, { TablePagination } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { MaterielStatusBadge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/forms';
import { MATERIEL_STATUS } from '../../utils/constants';
import toast from 'react-hot-toast';

const emptyForm = {
  nom: '', numero_serie: '', marque: '', modele: '',
  emplacement: '', statut: 'EN_SERVICE', description: ''
};

const GestionMateriel = () => {
  const [loading, setLoading]       = useState(true);
  const [materiels, setMateriels]   = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing]       = useState(null);
  const [toDelete, setToDelete]     = useState(null);
  const [formData, setFormData]     = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1, itemsPerPage: 12, totalItems: 0, totalPages: 0
  });

  useEffect(() => { loadMateriels(); }, []);
  useEffect(() => { applyFilter(); }, [materiels, searchTerm]);

  const loadMateriels = async () => {
    setLoading(true);
    try {
      const res = await materielService.getAllMateriel();
      if (res.success) {
        // Normaliser : ajouter .id = id_materiel
        const data = (res.data || []).map(m => ({ ...m, id: m.id_materiel ?? m.id }));
        setMateriels(data);
      }
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const f = materiels.filter(m =>
      !searchTerm ||
      m.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.emplacement?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFiltered(f);
    setPagination(p => ({
      ...p, totalItems: f.length,
      totalPages: Math.ceil(f.length / p.itemsPerPage), currentPage: 1
    }));
  };

  const openCreate = () => {
    setEditing(null); setFormData(emptyForm); setFormErrors({}); setShowModal(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setFormData({
      nom: m.nom || '', numero_serie: m.numero_serie || '',
      marque: m.marque || '', modele: m.modele || '',
      emplacement: m.emplacement || '', statut: m.statut || 'EN_SERVICE',
      description: m.description || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.numero_serie || !formData.emplacement) {
      setFormErrors({
        nom: !formData.nom ? 'Champ requis' : '',
        numero_serie: !formData.numero_serie ? 'Champ requis' : '',
        emplacement: !formData.emplacement ? 'Champ requis' : ''
      });
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await materielService.updateMateriel(editing.id, formData);
        toast.success('Matériel mis à jour');
      } else {
        await materielService.createMateriel(formData);
        toast.success('Matériel ajouté');
      }
      setShowModal(false);
      loadMateriels();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await materielService.deleteMateriel(toDelete.id);
      toast.success('Matériel supprimé');
      setShowDeleteModal(false);
      loadMateriels();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const f = (name, value) => setFormData(p => ({ ...p, [name]: value }));

  const statusOptions = [
    { value: MATERIEL_STATUS.EN_SERVICE,    label: 'En service' },
    { value: MATERIEL_STATUS.EN_PANNE,      label: 'En panne' },
    { value: MATERIEL_STATUS.EN_MAINTENANCE, label: 'En maintenance' },
    { value: MATERIEL_STATUS.HORS_SERVICE,  label: 'Hors service' }
  ];

  const columns = [
    {
      key: 'nom', label: 'Matériel',
      render: m => (
        <div>
          <p className="text-sm font-medium text-gray-900">{m.nom}</p>
          <p className="text-xs text-gray-500">{[m.marque, m.modele].filter(Boolean).join(' ')}</p>
        </div>
      )
    },
    { key: 'numero_serie', label: 'N° Série',   render: m => <span className="text-sm font-mono">{m.numero_serie}</span> },
    { key: 'statut',       label: 'Statut',      render: m => <MaterielStatusBadge status={m.statut} /> },
    { key: 'emplacement',  label: 'Emplacement', render: m => <span className="text-sm">{m.emplacement || '—'}</span> },
    {
      key: 'actions', label: 'Actions',
      render: m => (
        <div className="flex gap-1">
          <Button size="xs" variant="ghost" onClick={e => { e.stopPropagation(); openEdit(m); }}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="xs" variant="ghost" onClick={e => {
            e.stopPropagation(); setToDelete(m); setShowDeleteModal(true);
          }}>
            <Trash2 className="w-4 h-4 text-danger-600" />
          </Button>
        </div>
      )
    }
  ];

  const page = filtered.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du matériel</h1>
          <p className="text-gray-600 mt-1">{materiels.length} équipement{materiels.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMateriels}>
            <RefreshCw className="w-4 h-4 mr-2" />Rafraîchir
          </Button>
          <Button onClick={openCreate}>
            <PlusCircle className="w-4 h-4 mr-2" />Ajouter
          </Button>
        </div>
      </div>

      <Card><CardContent>
        <SearchBar placeholder="Rechercher nom, N° série, emplacement..." onSearch={setSearchTerm} />
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>Inventaire</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table columns={columns} data={page} loading={loading} emptyMessage="Aucun matériel enregistré" />
          {filtered.length > 0 && (
            <TablePagination
              currentPage={pagination.currentPage} totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}   itemsPerPage={pagination.itemsPerPage}
              onPageChange={p => setPagination(prev => ({ ...prev, currentPage: p }))}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Modifier le matériel' : 'Nouveau matériel'} size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)} disabled={submitting}>Annuler</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {editing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nom *"           value={formData.nom}          onChange={e => f('nom', e.target.value)}          error={formErrors.nom}          placeholder="PC portable, Imprimante..." />
            <Input label="Numéro de série *" value={formData.numero_serie} onChange={e => f('numero_serie', e.target.value)} error={formErrors.numero_serie} placeholder="SN-XXXX" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Marque" value={formData.marque} onChange={e => f('marque', e.target.value)} placeholder="Dell, HP..." />
            <Input label="Modèle" value={formData.modele} onChange={e => f('modele', e.target.value)} placeholder="Latitude 5520..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Emplacement *" value={formData.emplacement} onChange={e => f('emplacement', e.target.value)} error={formErrors.emplacement} placeholder="Bureau 205..." />
            <Select label="Statut" value={formData.statut} onChange={e => f('statut', e.target.value)} options={statusOptions} />
          </div>
          <Input label="Description" value={formData.description} onChange={e => f('description', e.target.value)} placeholder="Informations supplémentaires..." />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Supprimer le matériel"
        message={`Supprimer "${toDelete?.nom}" (${toDelete?.numero_serie}) ? Action irréversible.`}
        confirmText="Supprimer" confirmVariant="danger"
      />
    </div>
  );
};

export default GestionMateriel;
