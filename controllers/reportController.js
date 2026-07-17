const { 
    DemandeIntervention, 
    Intervention, 
    Materiel, 
    Personne, 
    Technicien, 
    Gestionnaire,
    Notification 
} = require('../models');

class ReportController {

    // ─── 1. Vue d'ensemble du système ─────────────────────────────────────────
    async getSystemOverview(req, res) {
        try {
            const { date_debut, date_fin } = req.query;

            const [demandesStats, materielStats, usersStats, demandesEnRetard, interventionStats] =
                await Promise.all([
                    DemandeIntervention.getStatistiquesGenerales(),
                    Materiel.getStatistiquesParStatut(),
                    Personne.getStatsByType(),
                    DemandeIntervention.getDemandesEnRetard(),
                    Intervention.getStatistiques({ date_debut, date_fin })
                ]);

            res.json({
                success: true,
                data: {
                    demandes: demandesStats,
                    materiel: materielStats,
                    users: usersStats,
                    demandesEnRetard: demandesEnRetard.length,
                    interventions: interventionStats,
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Erreur getSystemOverview:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }

    // ─── 2. Performance des techniciens ──────────────────────────────────────
    async getTechnicianPerformance(req, res) {
        try {
            const { date_debut, date_fin, technicien_id } = req.query;
            const options = {};
            if (date_debut) options.date_debut = date_debut;
            if (date_fin)   options.date_fin   = date_fin;

            const technicianStats = await Intervention.getStatistiquesByTechnicien(options);

            let specificTechnicianData = null;
            if (technicien_id) {
                specificTechnicianData = {
                    interventions: await Intervention.getInterventionsByTechnicien(
                        technicien_id, { ...options }
                    ),
                    stats: await Intervention.getStatistiques({ ...options, technicien_id })
                };
            }

            res.json({
                success: true,
                data: {
                    globalStats: technicianStats,
                    specificTechnician: specificTechnicianData,
                    period: { date_debut, date_fin },
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Erreur getTechnicianPerformance:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }

    // ─── 3. Analyse des incidents ─────────────────────────────────────────────
    async getIncidentAnalysis(req, res) {
        try {
            const [demandesParPriorite, demandesParStatut, categoriesRaw, materielAttention] =
                await Promise.all([
                    DemandeIntervention.getDemandesParPriorite(),
                    DemandeIntervention.getDemandesParStatut(),
                    DemandeIntervention.getCategories(),
                    Materiel.getMaterielAttention()
                ]);

            // getCategories retourne { categories: [...] } ou directement un tableau
            const categories = Array.isArray(categoriesRaw)
                ? categoriesRaw
                : (categoriesRaw.categories || []);

            res.json({
                success: true,
                data: {
                    par_priorite: demandesParPriorite,
                    par_statut:   demandesParStatut,
                    categories,
                    materiel_attention: materielAttention,
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Erreur getIncidentAnalysis:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }

    // ─── 4. Rapport de maintenance ────────────────────────────────────────────
    async getMaintenanceReport(req, res) {
        try {
            const [maintenanceData, topPieces, materielByStatus] = await Promise.all([
                Materiel.getRapportMaintenancePreventive(),
                Intervention.getTopPiecesRemplacees(15),
                Materiel.getStatistiquesParStatut()
            ]);

            res.json({
                success: true,
                data: {
                    maintenance_needed:   maintenanceData,
                    top_pieces_remplacees: topPieces,
                    materiel_par_statut:  materielByStatus,
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Erreur getMaintenanceReport:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }

    // ─── 5. Rapport SLA ───────────────────────────────────────────────────────
    async getSLAReport(req, res) {
        try {
            const { date_debut, date_fin } = req.query;

            const [demandesEnRetard, totalsByUrgence] = await Promise.all([
                DemandeIntervention.getDemandesEnRetard(),
                DemandeIntervention.getDemandesParPriorite()
            ]);

            const slaByUrgence = {
                CRITIQUE: { enRetard: 0, total: 0, seuil: 2,  respectSLA: '100.00' },
                HAUTE:    { enRetard: 0, total: 0, seuil: 8,  respectSLA: '100.00' },
                MOYENNE:  { enRetard: 0, total: 0, seuil: 24, respectSLA: '100.00' },
                BASSE:    { enRetard: 0, total: 0, seuil: 48, respectSLA: '100.00' }
            };

            demandesEnRetard.forEach(d => {
                if (slaByUrgence[d.urgence]) slaByUrgence[d.urgence].enRetard++;
            });

            totalsByUrgence.forEach(item => {
                if (slaByUrgence[item.urgence]) {
                    const s = slaByUrgence[item.urgence];
                    s.total = item.count;
                    s.respectSLA = s.total > 0
                        ? ((s.total - s.enRetard) / s.total * 100).toFixed(2)
                        : '100.00';
                }
            });

            const urgencesAvecDonnees = Object.values(slaByUrgence).filter(s => s.total > 0);
            const globalSLA = urgencesAvecDonnees.length > 0
                ? urgencesAvecDonnees.reduce((sum, s) => sum + parseFloat(s.respectSLA), 0) / urgencesAvecDonnees.length
                : 100;

            res.json({
                success: true,
                data: {
                    slaByUrgence,
                    demandesEnRetard,
                    globalSLACompliance: Math.round(globalSLA),
                    period: { date_debut, date_fin },
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Erreur getSLAReport:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }

    // ─── 6. Satisfaction client ───────────────────────────────────────────────
    async getCustomerSatisfactionReport(req, res) {
        try {
            const { date_debut, date_fin } = req.query;

            const demandesStats = await DemandeIntervention.getStatistiquesGenerales();

            const totalTraitees = (demandesStats.demandes_resolues || 0) + (demandesStats.demandes_refusees || 0);
            const tauxSatisfaction = totalTraitees > 0
                ? ((demandesStats.demandes_resolues || 0) / totalTraitees * 100).toFixed(2)
                : '0';

            const tempsParDepartement = await DemandeIntervention.customQuery(`
                SELECT 
                    COALESCE(u.departement, 'Non défini') as departement,
                    COUNT(*) as total_demandes,
                    ROUND(AVG(CASE 
                        WHEN di.date_cloture IS NOT NULL 
                        THEN TIMESTAMPDIFF(HOUR, di.date_creation, di.date_cloture) 
                        ELSE NULL 
                    END), 1) as temps_moyen_heures
                FROM demande_intervention di
                INNER JOIN utilisateur u ON di.id_utilisateur = u.id_utilisateur
                WHERE di.statut IN ('RESOLUE', 'FERMEE')
                GROUP BY u.departement
                ORDER BY temps_moyen_heures ASC
            `, []);

            res.json({
                success: true,
                data: {
                    taux_satisfaction:   parseFloat(tauxSatisfaction),
                    demandes_resolues:   demandesStats.demandes_resolues || 0,
                    demandes_refusees:   demandesStats.demandes_refusees || 0,
                    temps_par_departement: tempsParDepartement,
                    period: { date_debut, date_fin },
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Erreur getCustomerSatisfactionReport:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }

    // ─── 7. Rapport d'activité par période ───────────────────────────────────
    async getActivityReport(req, res) {
        try {
            const { date_debut, date_fin } = req.query;

            if (!date_debut || !date_fin) {
                return res.status(400).json({
                    success: false,
                    message: 'Date de début et date de fin requises'
                });
            }

            const [interventionsByPeriod, demandesByPeriod] = await Promise.all([
                Intervention.getInterventionsByPeriod(date_debut, date_fin),
                Gestionnaire.getStatistiquesPeriode(date_debut, date_fin)
            ]);

            res.json({
                success: true,
                data: {
                    period: { date_debut, date_fin },
                    interventions_par_jour: interventionsByPeriod,
                    demandes_par_jour: demandesByPeriod,
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Erreur getActivityReport:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }

    // ─── 8. Générer un rapport personnalisé ───────────────────────────────────
    async generateCustomReport(req, res) {
        try {
            console.log('📊 === GÉNÉRATION RAPPORT PERSONNALISÉ ===');
            console.log('📝 Body reçu:', JSON.stringify(req.body, null, 2));
            console.log('👤 Gestionnaire ID:', req.userId);

            const { type, snapshot } = req.body;
            let { periode_debut, periode_fin } = req.body;
            const gestionnaireId = req.userId;

            if (!type) {
                console.log('❌ Type de rapport manquant');
                return res.status(400).json({ success: false, message: 'Type de rapport requis' });
            }

            // 📅 Dates par défaut si non fournies (dernier mois)
            if (!periode_debut || !periode_fin) {
                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                const formatDate = (date) => [
                    date.getFullYear(),
                    String(date.getMonth() + 1).padStart(2, '0'),
                    String(date.getDate()).padStart(2, '0')
                ].join('-');
                
                // Utiliser les composantes locales : toISOString() peut décaler la date
                // d'un jour dans les fuseaux horaires à l'est de l'UTC.
                periode_debut = periode_debut || formatDate(lastMonth);
                periode_fin = periode_fin || formatDate(endOfLastMonth);
                
                console.log('📅 Dates par défaut appliquées:', { periode_debut, periode_fin });
            }

            console.log(`📊 Génération rapport type: ${type}`);
            console.log(`📅 Période: ${periode_debut} → ${periode_fin}`);

            // Sauvegarder en base
            console.log('💾 Sauvegarde en base...');
            const rapport = await Gestionnaire.genererRapport(
                gestionnaireId,
                periode_debut,
                periode_fin
            );

            console.log('✅ Rapport créé avec ID:', rapport.id_rapport);

            // Conserver un instantané des données visibles au moment de la sauvegarde.
            // Il permet de relire le rapport même lorsque les données du système évoluent.
            await Gestionnaire.customQuery(
                'UPDATE rapport SET contenu = ? WHERE id_rapport = ?',
                [JSON.stringify({
                    type,
                    periode_debut,
                    periode_fin,
                    date_generation: new Date().toISOString(),
                    details: snapshot || null
                }), rapport.id_rapport]
            );

            console.log('✅ Contenu rapport mis à jour');
            console.log('📊 === FIN GÉNÉRATION RAPPORT ===');

            res.status(201).json({
                success: true,
                message: 'Rapport sauvegardé avec succès',
                data: {
                    rapport: {
                        id_rapport: rapport.id_rapport,
                        type,
                        periode_debut,
                        periode_fin
                    }
                }
            });
        } catch (error) {
            console.error('❌ Erreur generateCustomReport:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }

    // ─── 8. Rapports sauvegardés ─────────────────────────────────────────────
    async getSavedReports(req, res) {
        try {
            const gestionnaireId = req.userId;
            const options = {
                limit:  req.pagination?.limit  || 10,
                offset: req.pagination?.offset || 0
            };

            const rapports = await Gestionnaire.getRapports(gestionnaireId, options);

            const rapportsFormates = rapports.map(rapport => ({
                ...rapport,
                contenu: typeof rapport.contenu === 'string'
                    ? (() => { try { return JSON.parse(rapport.contenu); } catch { return rapport.contenu; } })()
                    : rapport.contenu
            }));

            res.json({
                success: true,
                data: {
                    rapports: rapportsFormates,
                    pagination: req.pagination
                        ? { page: req.pagination.page, limit: req.pagination.limit }
                        : null
                }
            });
        } catch (error) {
            console.error('Erreur getSavedReports:', error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }
}

module.exports = new ReportController();
