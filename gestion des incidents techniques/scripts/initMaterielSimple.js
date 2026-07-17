// Script simple pour ajouter des matériels via l'API
const axios = require('axios');

// Configuration API
const API_BASE_URL = 'http://localhost:3001/api';

// Token de gestionnaire (tu devras te connecter pour récupérer un vrai token)
let authToken = '';

// Données de matériels simplifiées (sans les champs manquants)
const materielData = [
    {
        nom: 'Ordinateur portable Dell Direction',
        numero_serie: 'DL789456123',
        emplacement: 'Bureau Direction - Étage 3',
        statut: 'FONCTIONNEL'
    },
    {
        nom: 'Imprimante HP Salle Réunion A',
        numero_serie: 'HP123789456',
        emplacement: 'Salle de réunion A - Étage 2',
        statut: 'FONCTIONNEL'
    },
    {
        nom: 'Écran Samsung Comptabilité',
        numero_serie: 'SM456123789',
        emplacement: 'Poste comptabilité - Étage 1',
        statut: 'FONCTIONNEL'
    },
    {
        nom: 'Serveur Dell Salle Serveur',
        numero_serie: 'DL987654321',
        emplacement: 'Salle serveur - Sous-sol',
        statut: 'FONCTIONNEL'
    },
    {
        nom: 'Switch Cisco Baie Réseau',
        numero_serie: 'CS789123456',
        emplacement: 'Baie réseau - Étage 2',
        statut: 'FONCTIONNEL'
    }
];

async function loginAndGetToken() {
    try {
        console.log('🔐 Connexion en tant que gestionnaire...');
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@entreprise.com',
            password: 'admin123'
        });
        
        if (response.data.success) {
            authToken = response.data.data.token;
            console.log('✅ Connexion réussie');
            return true;
        }
    } catch (error) {
        console.error('❌ Erreur de connexion:', error.response?.data || error.message);
        return false;
    }
}

async function addMateriel(materiel) {
    try {
        const response = await axios.post(`${API_BASE_URL}/materiel`, materiel, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            console.log(`✅ Matériel ajouté: ${materiel.nom}`);
            return true;
        } else {
            console.log(`❌ Erreur: ${response.data.message}`);
            return false;
        }
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('existe déjà')) {
            console.log(`⚠️  Matériel existant: ${materiel.nom}`);
            return true;
        } else {
            console.error(`❌ Erreur pour ${materiel.nom}:`, error.response?.data || error.message);
            return false;
        }
    }
}

async function initMateriel() {
    console.log('🚀 === INITIALISATION MATÉRIELS ===');
    
    // Se connecter d'abord
    const loginSuccess = await loginAndGetToken();
    if (!loginSuccess) {
        console.log('❌ Impossible de se connecter. Vérifiez que:');
        console.log('   1. Le serveur backend est démarré sur localhost:3001');
        console.log('   2. Le compte admin@entreprise.com / admin123 existe');
        return;
    }
    
    console.log('📦 Ajout des matériels...');
    let added = 0;
    let existing = 0;
    
    for (const materiel of materielData) {
        const success = await addMateriel(materiel);
        if (success) {
            if (materiel.numero_serie) {
                added++;
            } else {
                existing++;
            }
        }
    }
    
    console.log('\n🎉 === RÉSULTATS ===');
    console.log(`✅ Matériels ajoutés: ${added}`);
    console.log(`⚠️  Matériels existants: ${existing}`);
    console.log(`📦 Total dans le système: ${added + existing}`);
    console.log('\n💡 Tu peux maintenant te connecter comme gestionnaire et voir ces matériels dans "Gestion du matériel"');
    console.log('🎯 Les utilisateurs pourront sélectionner ces matériels lors de la création de demandes');
}

// Exécuter si appelé directement
if (require.main === module) {
    initMateriel().then(() => {
        console.log('\n✅ Script terminé');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
}

module.exports = { initMateriel };