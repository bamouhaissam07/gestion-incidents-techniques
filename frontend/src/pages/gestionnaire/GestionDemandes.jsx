import React, { useState, useEffect } from 'react';
import { demandeService, userService } from '../../services';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Table, { TablePagination } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { StatusBadge, UrgenceBadge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/forms';
import toast from 'react-hot-toast';

const GestionDemandes = () => {
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState([]);
  const [filteredDemandes, setFilteredDemandes] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [selectedTechnicien, setSelectedTechnicien] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDemandes();
  }, [demandes, searchTerm, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [demandesRes, techniciensRes] = await Promise.all([
        demandeService.getAllDemandes(),
        userService.getAvailableTechnicians()
      ]);
      
      if (demandesRes.success) setDemandes(demandesRes.data || []);
      if (techniciensRes.success) setTechniciens(techniciensRes.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDemandes = () => {
    let filtered = [...demandes];
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.titre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(d => d.statut === statusFilter);
    }
    setFilteredDemandes(filtered);
    setPagination(prev => ({
      ...prev,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.itemsPerPage),
      currentPage: 1
    }));
  };

  const handleAssign = async () => {
    if (!selectedTechnicien) {
      toast.error('Sélectionnez un technicien');
      return;
    }
    try {
      await demandeService.assignerTechnicien(selectedDemande.id, parseInt(selectedTechnicien));
      toast.success('Technicien assigné');
      setShowAssignModal(false);
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const columns = [
    {
      key: 'titre',
      label: 'Demande',
      render: (d) => (
        <div>
          <p className="text-sm font-medium">{d.titre}</p>
          <p className="text-xs text-gray-500">#{d.id} • {d.categorie}</p>
        </div>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (d) => <StatusBadge status={d.statut} />
    },
    {
      key: 'urgence',
      label: 'Urgence',
      render: (d) => <UrgenceBadge urgence={d.urgence} />
    },
    {
      key: 'utilisateur',
      label: 'Demandeur',
      render: (d) => <span className="text-sm">{d.utilisateur_prenom} {d.utilisateur_nom}</span>
    },
    {
      key: 'technicien',
      label: 'Technicien',
      render: (d) => (
        <span className="text-sm">
          {d.technicien_nom ? `${d.technicien_prenom} ${d.technicien_nom}` : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (d) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDemande(d);
            setShowAssignModal(true);
          }}
        >
          Assigner
        </Button>
      )
    }
  ];

  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedDemandes = filteredDemandes.slice(startIndex, startIndex + pagination.itemsPerPage);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestion des demandes</h1>

      <Card>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <SearchBar placeholder="Rechercher..." onSearch={setSearchTerm} />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'Tous les statuts' },
                { value: 'CREEE', label: 'Créée' },
                { value: 'ASSIGNEE', label: 'Assignée' },
                { value: 'EN_COURS', label: 'En cours' },
                { value: 'RESOLUE', label: 'Résolue' }
              ]}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Liste des demandes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table columns={columns} data={paginatedDemandes} loading={loading} />
          {filteredDemandes.length > 0 && (
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assigner un technicien"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAssignModal(false)}>Annuler</Button>
            <Button onClick={handleAssign}>Assigner</Button>
          </>
        }
      >
        <Select
          label="Technicien"
          value={selectedTechnicien}
          onChange={(e) => setSelectedTechnicien(e.target.value)}
          options={[
            { value: '', label: 'Sélectionner un technicien', disabled: true },
            ...techniciens.map(t => ({
              value: t.id_technicien ?? t.id_personne ?? t.id,
              label: `${t.prenom} ${t.nom} - ${t.specialite || 'Généraliste'}`
            }))
          ]}
        />
      </Modal>
    </div>
  );
};

export default GestionDemandes;