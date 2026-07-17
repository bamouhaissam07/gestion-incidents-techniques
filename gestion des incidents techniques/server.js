#!/usr/bin/env node

const app = require('./app');
const config = require('./config/config');
const { testConnection } = require('./config/database');
const { 
    handleUncaughtException, 
    handleUnhandledRejection, 
    handleGracefulShutdown 
} = require('./middleware/errorHandler');

// Gestion des exceptions non gérées (doit être en premier)
handleUncaughtException();

// Variables d'environnement
const PORT = config.server.port;
const NODE_ENV = config.server.environment;

// Fonction de démarrage du serveur
const startServer = async () => {
    try {
        console.log('🚀 Démarrage du serveur...');
        console.log(`📊 Environnement: ${NODE_ENV}`);
        
        // Test de connexion à la base de données
        console.log('🔌 Test de connexion à la base de données...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Impossible de se connecter à la base de données');
            process.exit(1);
        }
        
        console.log('✅ Connexion à la base de données établie');
        
        // Démarrage du serveur HTTP
        const server = app.listen(PORT, () => {
            console.log(`🌟 Serveur démarré avec succès`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`📡 API: http://localhost:${PORT}/api`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`📚 Documentation: http://localhost:${PORT}/api/docs`);
            console.log('----------------------------------------');
            
            // Afficher les routes disponibles
            console.log('🛣️  Routes disponibles:');
            console.log('   • POST   /api/auth/login');
            console.log('   • POST   /api/auth/register');
            console.log('   • GET    /api/users');
            console.log('   • GET    /api/materiel');
            console.log('   • GET    /api/demandes');
            console.log('   • GET    /api/interventions');
            console.log('   • GET    /api/notifications');
            console.log('   • GET    /api/reports');
            console.log('----------------------------------------');
            
            if (NODE_ENV === 'development') {
                console.log('🔧 Mode développement activé');
                console.log('📝 Logs de requêtes activés');
                console.log('🐛 Stack trace dans les erreurs activé');
            }
            
            console.log('✨ Serveur prêt à recevoir des requêtes\n');
        });
        
        // Configuration des timeouts
        server.timeout = 30000; // 30 secondes
        server.keepAliveTimeout = 65000; // 65 secondes
        server.headersTimeout = 66000; // 66 secondes
        
        // Gestion des erreurs du serveur
        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }
            
            const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
            
            switch (error.code) {
                case 'EACCES':
                    console.error(`❌ ${bind} nécessite des privilèges élevés`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(`❌ ${bind} est déjà utilisé`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
        
        // Gestion de l'arrêt gracieux
        handleGracefulShutdown(server);
        handleUnhandledRejection(server);
        
        return server;
        
    } catch (error) {
        console.error('💥 Erreur lors du démarrage du serveur:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

// Fonction pour afficher les informations système
const displaySystemInfo = () => {
    console.log('\n' + '='.repeat(50));
    console.log('🏢 SYSTÈME DE GESTION DES INCIDENTS TECHNIQUES');
    console.log('='.repeat(50));
    console.log(`📦 Version: ${require('./package.json').version}`);
    console.log(`🟢 Node.js: ${process.version}`);
    console.log(`💾 Plateforme: ${process.platform} ${process.arch}`);
    console.log(`🔧 PID: ${process.pid}`);
    console.log(`⚡ Démarrage: ${new Date().toISOString()}`);
    console.log('='.repeat(50) + '\n');
};

// Démarrage principal
if (require.main === module) {
    displaySystemInfo();
    startServer().catch((error) => {
        console.error('💥 Échec du démarrage:', error.message);
        process.exit(1);
    });
}

module.exports = { startServer };