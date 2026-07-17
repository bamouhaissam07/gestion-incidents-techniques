const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuration Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gestion des Incidents Techniques',
      version: '1.0.0',
      description: `
        API REST complète pour la gestion des incidents techniques en entreprise.
        
        ## Fonctionnalités principales
        - **Authentification JWT** sécurisée
        - **Gestion multi-rôles** (Utilisateurs, Techniciens, Gestionnaires)
        - **Workflow complet** de traitement des incidents
        - **Système de notifications** en temps réel
        - **Rapports et analytics** pour les gestionnaires
        
        ## Types d'utilisateurs
        - **UTILISATEUR** : Peut créer des demandes d'intervention
        - **TECHNICIEN** : Traite les demandes assignées et crée des comptes-rendus
        - **GESTIONNAIRE** : Supervise, assigne les tâches et génère des rapports
        
        ## Authentification
        Utilisez l'endpoint \`/api/auth/login\` pour obtenir un token JWT.
        Ajoutez ce token dans l'en-tête \`Authorization: Bearer <token>\` pour les requêtes authentifiées.
      `,
      contact: {
        name: 'Support API',
        email: 'support@gestion-incidents.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.gestion-incidents.com',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Message d\'erreur descriptif'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z'
            },
            path: {
              type: 'string',
              example: '/api/endpoint'
            },
            method: {
              type: 'string',
              example: 'GET'
            }
          }
        },
        Success: {
          type: 'object',
          required: ['success'],
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Opération réussie'
            },
            data: {
              type: 'object',
              description: 'Données de réponse'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
              description: 'Page actuelle'
            },
            limit: {
              type: 'integer',
              example: 10,
              description: 'Nombre d\'éléments par page'
            },
            total: {
              type: 'integer',
              example: 100,
              description: 'Nombre total d\'éléments'
            },
            pages: {
              type: 'integer',
              example: 10,
              description: 'Nombre total de pages'
            }
          }
        },
        Personne: {
          type: 'object',
          required: ['nom', 'prenom', 'email', 'type_personne'],
          properties: {
            id_personne: {
              type: 'integer',
              example: 1,
              readOnly: true
            },
            nom: {
              type: 'string',
              maxLength: 100,
              example: 'Dupont'
            },
            prenom: {
              type: 'string',
              maxLength: 100,
              example: 'Jean'
            },
            email: {
              type: 'string',
              format: 'email',
              maxLength: 150,
              example: 'jean.dupont@example.com'
            },
            type_personne: {
              type: 'string',
              enum: ['UTILISATEUR', 'TECHNICIEN', 'GESTIONNAIRE'],
              example: 'UTILISATEUR'
            },
            date_creation: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        Utilisateur: {
          allOf: [
            { $ref: '#/components/schemas/Personne' },
            {
              type: 'object',
              properties: {
                id_utilisateur: {
                  type: 'integer',
                  example: 1,
                  readOnly: true
                },
                poste: {
                  type: 'string',
                  maxLength: 100,
                  example: 'Développeur'
                },
                departement: {
                  type: 'string',
                  maxLength: 100,
                  example: 'Informatique'
                }
              }
            }
          ]
        },
        Technicien: {
          allOf: [
            { $ref: '#/components/schemas/Personne' },
            {
              type: 'object',
              properties: {
                id_technicien: {
                  type: 'integer',
                  example: 1,
                  readOnly: true
                },
                specialite: {
                  type: 'string',
                  maxLength: 100,
                  example: 'Réseau'
                },
                disponibilite: {
                  type: 'boolean',
                  example: true,
                  default: true
                }
              }
            }
          ]
        },
        Materiel: {
          type: 'object',
          required: ['nom', 'numero_serie'],
          properties: {
            id_materiel: {
              type: 'integer',
              example: 1,
              readOnly: true
            },
            nom: {
              type: 'string',
              maxLength: 150,
              example: 'Ordinateur Portable Dell'
            },
            description: {
              type: 'string',
              example: 'Ordinateur portable pour les développeurs'
            },
            numero_serie: {
              type: 'string',
              maxLength: 100,
              example: 'DELL001'
            },
            emplacement: {
              type: 'string',
              maxLength: 150,
              example: 'Bureau 101'
            },
            statut: {
              type: 'string',
              enum: ['EN_SERVICE', 'EN_PANNE', 'EN_MAINTENANCE', 'HORS_SERVICE'],
              default: 'EN_SERVICE',
              example: 'EN_SERVICE'
            }
          }
        },
        DemandeIntervention: {
          type: 'object',
          required: ['titre', 'id_materiel'],
          properties: {
            id_demande: {
              type: 'integer',
              example: 1,
              readOnly: true
            },
            titre: {
              type: 'string',
              maxLength: 200,
              example: 'Problème d\'imprimante'
            },
            description: {
              type: 'string',
              example: 'L\'imprimante ne fonctionne plus depuis ce matin'
            },
            nature_technique: {
              type: 'string',
              maxLength: 150,
              example: 'Défaillance matérielle'
            },
            categorie: {
              type: 'string',
              maxLength: 100,
              example: 'Hardware'
            },
            urgence: {
              type: 'string',
              enum: ['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'],
              default: 'MOYENNE',
              example: 'HAUTE'
            },
            statut: {
              type: 'string',
              enum: ['CREEE', 'ASSIGNEE', 'ACCEPTEE', 'REFUSEE', 'EN_COURS', 'RESOLUE', 'FERMEE'],
              default: 'CREEE',
              example: 'CREEE'
            },
            date_creation: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2024-01-15T10:30:00.000Z'
            },
            date_cloture: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2024-01-16T14:30:00.000Z'
            },
            id_materiel: {
              type: 'integer',
              example: 1
            }
          }
        },
        Intervention: {
          type: 'object',
          required: ['id_demande'],
          properties: {
            id_intervention: {
              type: 'integer',
              example: 1,
              readOnly: true
            },
            date_intervention: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T14:30:00.000Z'
            },
            actions_prises: {
              type: 'string',
              example: 'Remplacement du toner et nettoyage des têtes d\'impression'
            },
            pieces_remplacees: {
              type: 'string',
              example: 'Toner noir HP CF280A'
            },
            probleme_resolu: {
              type: 'boolean',
              default: false,
              example: true
            },
            id_demande: {
              type: 'integer',
              example: 1
            }
          }
        },
        Notification: {
          type: 'object',
          required: ['message', 'id_demande', 'id_destinataire'],
          properties: {
            id_notification: {
              type: 'integer',
              example: 1,
              readOnly: true
            },
            date_envoi: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2024-01-15T10:30:00.000Z'
            },
            message: {
              type: 'string',
              maxLength: 500,
              example: 'Votre demande a été assignée à un technicien'
            },
            type: {
              type: 'string',
              enum: ['ASSIGNATION', 'REFUS', 'RESOLUTION', 'CLOTURE', 'AUTRE'],
              default: 'AUTRE',
              example: 'ASSIGNATION'
            },
            lue: {
              type: 'boolean',
              default: false,
              example: false
            },
            id_demande: {
              type: 'integer',
              example: 1
            },
            id_destinataire: {
              type: 'integer',
              example: 1
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  // Configuration des options Swagger UI
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { color: #2c3e50; }
    `,
    customSiteTitle: 'API Gestion des Incidents - Documentation'
  };

  // Route pour la documentation Swagger
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
  
  // Route pour obtenir le JSON de spécification
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Documentation Swagger configurée sur /api/docs');
};

module.exports = { setupSwagger, specs };