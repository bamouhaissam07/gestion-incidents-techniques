import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { demandeService } from '../../services';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table, { TablePagination } from '../../components/ui/Table';
import { StatusBadge, UrgenceBadge } from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { SearchBar } from '../../components/forms';
import { formatDateTime } from '../../utils/formatters';
import { DEMANDE_STATUS } from '../../utils/constants';

/**
 * Page de liste des demandes de l'utilisateur
 */
const MesDemandes = () => {
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
    loadDemandes();
  }, []);

  useEffect(() => {
    filterDemandes();
  }, [demandes, searchTerm, statusFilter]);

  const loadDemandes = async () => {
    setLoading(true);
    try {
      const response = await demandeService.getDemandesByUser(user.id);
      
      if (response.success) {
        const data = response.data || [];
        setDemandes(data);
        setFilteredDemandes(data);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDemandes = () => {
    let filtered = [...demandes];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter) {
      filtered = filtered.filter(d => d.statut === statusFilter);
    }

    setFilteredDemandes(filtered);
    
    // Mettre à jour la pagination
    setPagination(prev => ({
      ...prev,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.itemsPerPage),
      currentPage: 1
    }));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Options de filtre par statut
  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: DEMANDE_STATUS.CREEE, label: 'Créée' },
    { value: DEMANDE_STATUS.ASSIGNEE, label: 'Assignée' },
    { value: DEMANDE_STATUS.ACCEPTEE, label: 'Acceptée' },
    { value: DEMANDE_STATUS.EN_COURS, label: 'En cours' },
    { value: DEMANDE_STATUS.RESOLUE, label: 'Résolue' },
    { value: DEMANDE_STATUS.FERMEE, label: 'Fermée' },
    { value: DEMANDE_STATUS.REFUSEE, label: 'Refusée' }
  ];

  // Colonnes du tableau
  const columns = [
    {
      key: 'titre',
      label: 'Demande',
      render: (demande) => (
        <div>
          <Link
            to={`/demandes/${demande.id}`}
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
      key: 'technicien',
      label: 'Technicien',
      render: (demande) => (
        <span className="text-sm text-gray-900">
          {demande.technicien_nom 
            ? `${demande.technicien_prenom} ${demande.technicien_nom}`
            : <span className="text-gray-400">Non assigné</span>
          }
        </span>
      )
    },
    {
      key: 'date_creation',
      label: 'Date de création',
      render: (demande) => (
        <span className="text-sm text-gray-600">
          {formatDateTime(demande.date_creation)}
        </span>
      )
    }
  ];

  // Pagination des données
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  const paginatedDemandes = filteredDemandes.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes demandes</h1>
          <p className="text-gray-600 mt-1">
            {filteredDemandes.length} demande{filteredDemandes.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/demandes/create">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Rechercher une demande..."
                onSearch={handleSearch}
              />
            </div>
            
            <div className="w-full md:w-64">
              <Select
                name="statusFilter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                options={statusOptions}
              />
            </div>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des demandes</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={paginatedDemandes}
            loading={loading}
            emptyMessage="Aucune demande trouvée"
            onRowClick={(demande) => navigate(`/demandes/${demande.id}`)}
          />
          
          {filteredDemandes.length > 0 && (
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MesDemandes;