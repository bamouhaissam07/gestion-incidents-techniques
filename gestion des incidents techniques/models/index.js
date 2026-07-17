// Point d'entrée pour tous les modèles
const BaseModel = require('./BaseModel');
const Personne = require('./Personne');
const Utilisateur = require('./Utilisateur');
const Technicien = require('./Technicien');
const Gestionnaire = require('./Gestionnaire');
const Materiel = require('./Materiel');
const DemandeIntervention = require('./DemandeIntervention');
const Intervention = require('./Intervention');
const Notification = require('./Notification');

module.exports = {
    BaseModel,
    Personne,
    Utilisateur,
    Technicien,
    Gestionnaire,
    Materiel,
    DemandeIntervention,
    Intervention,
    Notification
};