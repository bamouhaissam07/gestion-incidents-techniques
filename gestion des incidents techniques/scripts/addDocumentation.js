#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * Script pour ajouter la documentation Swagger à l'application existante
 * Ce script modifie app.js pour inclure les routes de documentation
 */

async function addSwaggerDocumentation() {
    try {
        console.log('📚 Ajout de la documentation Swagger...');
        
        const appPath = path.join(__dirname, '..', 'app.js');
        
        // Lire le contenu actuel d'app.js
        let appContent = await fs.readFile(appPath, 'utf8');
        
        // Vérifier si la documentation est déjà ajoutée
        if (appContent.includes('setupSwagger') || appContent.includes('/api/docs')) {
            console.log('✅ Documentation déjà configurée dans app.js');
            return;
        }
        
        // Ajouter l'import de la configuration Swagger après les autres imports de config
        const configImportRegex = /(const { testConnection } = require\('\.\/config\/database'\);)/;
        const swaggerImport = "$1\nconst { setupSwagger } = require('./config/swagger');";
        
        if (configImportRegex.test(appContent)) {
            appContent = appContent.replace(configImportRegex, swaggerImport);
            console.log('✓ Import Swagger ajouté');
        }
        
        // Ajouter la route de documentation après les routes principales
        const routesRegex = /(app\.use\('\/api\/reports', reportRoutes\);)/;
        const docsRoute = `$1

// Route de documentation
const docsRoutes = require('./routes/docs');
app.use('/api/docs', docsRoutes);

// Configuration de la documentation Swagger
setupSwagger(app);`;
        
        if (routesRegex.test(appContent)) {
            appContent = appContent.replace(routesRegex, docsRoute);
            console.log('✓ Routes de documentation ajoutées');
        }
        
        // Écrire le fichier modifié
        await fs.writeFile(appPath, appContent, 'utf8');
        
        console.log('✅ Documentation Swagger configurée avec succès!');
        console.log('📖 Accessible sur : http://localhost:3000/api/docs');
        console.log('🔧 Spécification OpenAPI : http://localhost:3000/api/docs/swagger.json');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de la documentation:', error.message);
        console.log('\n📝 Pour ajouter manuellement la documentation à app.js:');
        console.log('1. Ajouter : const { setupSwagger } = require(\'./config/swagger\');');
        console.log('2. Ajouter : const docsRoutes = require(\'./routes/docs\');');
        console.log('3. Ajouter : app.use(\'/api/docs\', docsRoutes);');
        console.log('4. Ajouter : setupSwagger(app);');
    }
}

// Instructions d'utilisation manuelle
function printManualInstructions() {
    console.log('\n📋 Instructions pour ajouter la documentation manuellement:');
    console.log('');
    console.log('1. Dans app.js, après les imports existants, ajouter:');
    console.log('   const { setupSwagger } = require(\'./config/swagger\');');
    console.log('   const docsRoutes = require(\'./routes/docs\');');
    console.log('');
    console.log('2. Après les routes existantes, ajouter:');
    console.log('   app.use(\'/api/docs\', docsRoutes);');
    console.log('   setupSwagger(app);');
    console.log('');
    console.log('3. Redémarrer le serveur et aller sur:');
    console.log('   http://localhost:3000/api/docs');
    console.log('');
}

// Exécuter si appelé directement
if (require.main === module) {
    const arg = process.argv[2];
    
    if (arg === '--help' || arg === '-h') {
        printManualInstructions();
        process.exit(0);
    }
    
    if (arg === '--manual') {
        printManualInstructions();
        process.exit(0);
    }
    
    addSwaggerDocumentation()
        .then(() => {
            console.log('\n🎉 Configuration terminée!');
            process.exit(0);
        })
        .catch(error => {
            console.error(error);
            printManualInstructions();
            process.exit(1);
        });
}

module.exports = { addSwaggerDocumentation };