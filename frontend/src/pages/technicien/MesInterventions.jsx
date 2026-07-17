import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { demandeService } from '../../services';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Table, { TablePagination } from '../../components/ui/Table';
import { StatusBadge, UrgenceBadge } from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { SearchBar } from '../../components/forms';
import { formatDateTime } from '../../utils/formatters';
import { DEMANDE_STATUS } from '../../utils/constants';

const MesInterventions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState([]);
  const [filteredDemandes, setFilteredDemandes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    loadInterventions();
  }, []);

  useEffect(() => {
    filterDemandes();
  }, [demandes, searchTerm, statusFilter]);

  const loadInterventions = async () => {
    setLoading(true);
    try {
      const response = await demandeService.getAllDemandes({ 
        technicien_id: user.id 
      });
      
      if (response.success) {
        setDemandes(response.data || []);
      }
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
        d.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: DEMANDE_STATUS.ASSIGNEE, label: 'Assignée' },
    { value: DEMANDE_STATUS.ACCEPTEE, label: 'Acceptée' },
    { value: DEMANDE_STATUS.EN_COURS, label: 'En cours' },
    { value: DEMANDE_STATUS.RESOLUE, label: 'Résolue' },
    { value: DEMANDE_STATUS.REFUSEE, label: 'Refusée' }
  ];

  const columns = [
    {
      key: 'titre',
      label: 'Intervention',
      render: (demande) => (
        <div>
          <Link
            to={`/interventions/${demande.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {demande.titre}
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            #{demande.id} • {demande.categorie}
          </p>
        </div>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (demande) => <StatusBadge status={demande.statut} />
    },
    {
      key: 'urgence',
      label: 'Urgence',
      render: (demande) => <UrgenceBadge urgence={demande.urgence} />
    },
    {
      key: 'utilisateur',
      label: 'Demandeur',
      render: (demande) => (
        <span className="text-sm text-gray-900">
          {demande.utilisateur_prenom} {demande.utilisateur_nom}
        </span>
      )
    },
    {
      key: 'date_assignation',
      label: 'Assignée le',
      render: (demande) => (
        <span className="text-sm text-gray-600">
          {formatDateTime(demande.date_assignation)}
        </span>
      )
    }
  ];

  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedDemandes = filteredDemandes.slice(startIndex, startIndex + pagination.itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes interventions</h1>
          <p className="text-gray-600 mt-1">
            {filteredDemandes.length} intervention{filteredDemandes.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Rechercher une intervention..."
                onSearch={setSearchTerm}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des interventions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={paginatedDemandes}
            loading={loading}
            emptyMessage="Aucune intervention trouvée"
            onRowClick={(d) => navigate(`/interventions/${d.id}`)}
          />
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
    </div>
  );
};

export default MesInterventions;