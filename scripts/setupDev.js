#!/usr/bin/env node

const { createDatabase } = require('./initDatabase');
const bcrypt = require('bcryptjs');
const { Personne, Utilisateur, Technicien, Gestionnaire, Materiel } = require('../models');

/**
 * Script de configuration pour l'environnement de développement
 * Crée la base de données et insère des données de test
 */

const setupDevelopmentEnvironment = async () => {
    try {
        console.log('🔧 Configuration de l\'environnement de développement...\n');
        
        // 1. Initialiser la base de données
        console.log('1️⃣  Initialisation de la base de données...');
        await createDatabase();
        console.log('✅ Base de données initialisée\n');
        
        // 2. Créer des utilisateurs de test
        console.log('2️⃣  Création des utilisateurs de test...');
        await createTestUsers();
        console.log('✅ Utilisateurs de test créés\n');
        
        // 3. Créer du matériel de test
        console.log('3️⃣  Création du matériel de test...');
        await createTestMateriel();
        console.log('✅ Matériel de test créé\n');
        
        console.log('🎉 Configuration terminée avec succès!');
        console.log('\n📋 Comptes de test créés:');
        console.log('   👤 Gestionnaire: gestionnaire@test.com / password123');
        console.log('   🔧 Technicien: technicien@test.com / password123');
        console.log('   👥 Utilisateur: utilisateur@test.com / password123');
        console.log('\n🌐 Serveur: npm run dev');
        console.log('📚 API: http://localhost:3000/api\n');
        
    } catch (error) {
        console.error('❌ Erreur lors de la configuration:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

const createTestUsers = async () => {
    const password = await bcrypt.hash('password123', 12);
    
    try {
        // Créer un gestionnaire
        await Gestionnaire.create({
            nom: 'Admin',
            prenom: 'Gestionnaire',
            email: 'gestionnaire@test.com',
            mot_de_passe: password
        });
        console.log('   ✓ Gestionnaire créé');
        
        // Créer un technicien
        await Technicien.create({
            nom: 'Martin',
            prenom: 'Technicien',
            email: 'technicien@test.com',
            mot_de_passe: password,
            specialite: 'Informatique',
            disponibilite: true
        });
        console.log('   ✓ Technicien créé');
        
        // Créer un technicien spécialisé réseau
        await Technicien.create({
            nom: 'Durand',
            prenom: 'Pierre',
            email: 'technicien.reseau@test.com',
            mot_de_passe: password,
            specialite: 'Réseau',
            disponibilite: true
        });
        console.log('   ✓ Technicien réseau créé');
        
        // Créer un utilisateur standard
        await Utilisateur.create({
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'utilisateur@test.com',
            mot_de_passe: password,
            poste: 'Employé',
            departement: 'Comptabilité'
        });
        console.log('   ✓ Utilisateur standard créé');
        
        // Créer un utilisateur RH
        await Utilisateur.create({
            nom: 'Bernard',
            prenom: 'Marie',
            email: 'marie.rh@test.com',
            mot_de_passe: password,
            poste: 'Responsable RH',
            departement: 'Ressources Humaines'
        });
        console.log('   ✓ Utilisateur RH créé');
        
    } catch (error) {
        if (error.message && error.message.includes('email')) {
            console.log('   ⚠️  Utilisateurs déjà existants, ignoré');
        } else {
            throw error;
        }
    }
};

const createTestMateriel = async () => {
    const materiels = [
        {
            nom: 'Ordinateur Portable Dell Latitude 5520',
            description: 'Ordinateur portable pour les employés',
            numero_serie: 'DELL001',
            emplacement: 'Bureau 101',
            statut: 'EN_SERVICE'
        },
        {
            nom: 'Imprimante HP LaserJet Pro 400',
            description: 'Imprimante laser couleur',
            numero_serie: 'HP001',
            emplacement: 'Open Space RDC',
            statut: 'EN_SERVICE'
        },
        {
            nom: 'Switch Cisco 24 ports',
            description: 'Switch réseau principal',
            numero_serie: 'CISCO001',
            emplacement: 'Salle serveur',
            statut: 'EN_SERVICE'
        },
        {
            nom: 'Serveur Dell PowerEdge R740',
            description: 'Serveur de production',
            numero_serie: 'DELL_SRV001',
            emplacement: 'Salle serveur',
            statut: 'EN_MAINTENANCE'
        },
        {
            nom: 'Écran Samsung 24 pouces',
            description: 'Écran de bureau',
            numero_serie: 'SAM001',
            emplacement: 'Bureau 102',
            statut: 'EN_PANNE'
        }
    ];
    
    try {
        for (const materiel of materiels) {
            await Materiel.create(materiel);
            console.log(`   ✓ ${materiel.nom} créé`);
        }
    } catch (error) {
        if (error.message && error.message.includes('série')) {
            console.log('   ⚠️  Matériel déjà existant, ignoré');
        } else {
            throw error;
        }
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    setupDevelopmentEnvironment()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { setupDevelopmentEnvironment };