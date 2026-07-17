const { Materiel } = require('../models');

// Script pour initialiser les matériels de base dans le système
const materielData = [
    {
        nom: 'Ordinateur portable Dell Direction',
        type: 'Ordinateur',
        numero_serie: 'DL789456123',
        marque: 'Dell',
        modele: 'Latitude 7420',
        emplacement: 'Bureau Direction - Étage 3',
        statut: 'FONCTIONNEL',
        description: 'Ordinateur portable de direction avec docking station'
    },
    {
        nom: 'Imprimante HP Salle Réunion A',
        type: 'Imprimante',
        numero_serie: 'HP123789456',
        marque: 'HP',
        modele: 'LaserJet Pro MFP M428fdw',
        emplacement: 'Salle de réunion A - Étage 2',
        statut: 'FONCTIONNEL',
        description: 'Imprimante multifonction laser noir et blanc'
    },
    {
        nom: 'Écran Samsung Comptabilité',
        type: 'Écran',
        numero_serie: 'SM456123789',
        marque: 'Samsung',
        modele: 'S24F350FH 24"',
        emplacement: 'Poste comptabilité - Étage 1',
        statut: 'FONCTIONNEL',
        description: 'Écran 24 pouces Full HD'
    },
    {
        nom: 'Serveur Dell Salle Serveur',
        type: 'Serveur',
        numero_serie: 'DL987654321',
        marque: 'Dell',
        modele: 'PowerEdge T340',
        emplacement: 'Salle serveur - Sous-sol',
        statut: 'FONCTIONNEL',
        description: 'Serveur principal de l\'entreprise'
    },
    {
        nom: 'Switch Cisco Baie Réseau',
        type: 'Réseau',
        numero_serie: 'CS789123456',
        marque: 'Cisco',
        modele: 'SG250-24 24-Port',
        emplacement: 'Baie réseau - Étage 2',
        statut: 'FONCTIONNEL',
        description: 'Switch réseau 24 ports gigabit'
    },
    {
        nom: 'Ordinateur fixe Marketing',
        type: 'Ordinateur',
        numero_serie: 'HP654321987',
        marque: 'HP',
        modele: 'EliteDesk 800 G6',
        emplacement: 'Open space marketing - Étage 2',
        statut: 'FONCTIONNEL',
        description: 'PC fixe pour équipe marketing'
    },
    {
        nom: 'Téléphone IP Commercial',
        type: 'Téléphonie',
        numero_serie: 'YL147258369',
        marque: 'Yealink',
        modele: 'T46S',
        emplacement: 'Bureau commercial - Étage 1',
        statut: 'FONCTIONNEL',
        description: 'Téléphone IP avec écran couleur'
    },
    {
        nom: 'Imprimante couleur RH',
        type: 'Imprimante',
        numero_serie: 'CN951753864',
        marque: 'Canon',
        modele: 'imageRUNNER C1335iF',
        emplacement: 'Bureau RH - Étage 1',
        statut: 'EN_PANNE',
        description: 'Imprimante couleur multifonction (actuellement en panne)'
    },
    {
        nom: 'Projecteur Salle Réunion B',
        type: 'Audiovisuel',
        numero_serie: 'EP852741963',
        marque: 'Epson',
        modele: 'EB-2247U',
        emplacement: 'Salle de réunion B - Étage 3',
        statut: 'FONCTIONNEL',
        description: 'Projecteur WUXGA pour présentations'
    },
    {
        nom: 'Scanner Archivage',
        type: 'Scanner',
        numero_serie: 'FJ369258147',
        marque: 'Fujitsu',
        modele: 'ScanSnap iX1500',
        emplacement: 'Bureau archivage - Étage 1',
        statut: 'MAINTENANCE',
        description: 'Scanner haute vitesse pour numérisation documents'
    }
];

async function initMateriel() {
    try {
        console.log('🔄 Initialisation des matériels...');
        
        for (const materiel of materielData) {
            // Vérifier si le matériel existe déjà
            const exists = await Materiel.numeroSerieExists(materiel.numero_serie);
            
            if (!exists) {
                await Materiel.create(materiel);
                console.log(`✅ Matériel ajouté: ${materiel.nom}`);
            } else {
                console.log(`⚠️  Matériel existant: ${materiel.nom}`);
            }
        }
        
        console.log('🎉 Initialisation terminée!');
        console.log(`📦 ${materielData.length} matériels dans le système`);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
}

// Exporter la fonction pour pouvoir l'appeler
module.exports = { initMateriel };

// Si exécuté directement
if (require.main === module) {
    initMateriel().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Erreur fatale:', error);
        process.exit(1);
    });
}