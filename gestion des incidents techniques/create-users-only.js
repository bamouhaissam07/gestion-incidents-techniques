#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const { Personne, Utilisateur, Technicien, Gestionnaire, Materiel } = require('./models');

const createTestUsersOnly = async () => {
    const password = await bcrypt.hash('password123', 12);
    
    try {
        console.log('👤 Création des utilisateurs de test...\n');
        
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
        
        console.log('\n🎉 Utilisateurs de test créés avec succès!');
        console.log('\n📋 Comptes pour te connecter:');
        console.log('   👤 Gestionnaire: gestionnaire@test.com / password123');
        console.log('   🔧 Technicien: technicien@test.com / password123');
        console.log('   👥 Utilisateur: utilisateur@test.com / password123');
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('⚠️  Les utilisateurs existent déjà!');
            console.log('\n📋 Comptes pour te connecter:');
            console.log('   👤 Gestionnaire: gestionnaire@test.com / password123');
            console.log('   🔧 Technicien: technicien@test.com / password123');
            console.log('   👥 Utilisateur: utilisateur@test.com / password123');
        } else {
            throw error;
        }
    }
};

createTestUsersOnly()
    .then(() => {
        console.log('\n🌐 Va sur http://localhost:5173 et connecte-toi!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    });