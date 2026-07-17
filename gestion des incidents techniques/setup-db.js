const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('🔍 Vérification de la connexion MySQL...');
    
    // Connexion sans spécifier de base de données d'abord
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ Connexion MySQL réussie !');
    
    // Créer la base de données si elle n'existe pas
    const dbName = process.env.DB_NAME || 'gestion_incidents';
    console.log(`🗄️  Création de la base de données "${dbName}" si nécessaire...`);
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Base de données "${dbName}" prête !`);
    
    await connection.end();
    console.log('🚀 Configuration terminée. Vous pouvez maintenant lancer le backend avec "node app.js"');
    
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL :');
    console.error('Message :', error.message);
    console.error('Code :', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Solutions possibles :');
      console.log('1. Vérifiez le mot de passe MySQL dans le fichier .env');
      console.log('2. Dans MySQL Workbench, créez un utilisateur "root" avec le mot de passe "root"');
      console.log('3. Ou changez DB_PASSWORD dans .env selon votre config MySQL');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solutions possibles :');
      console.log('1. Démarrez le service MySQL via services.msc');
      console.log('2. Ou ouvrez MySQL Workbench et connectez-vous');
    }
    
    process.exit(1);
  }
}

setupDatabase();