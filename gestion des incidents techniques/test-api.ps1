# Script PowerShell pour tester l'API Gestion des Incidents
# Usage: .\test-api.ps1

Write-Host "🧪 TESTS DE L'API GESTION DES INCIDENTS" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

$baseUrl = "http://localhost:3001"
$headers = @{'Content-Type' = 'application/json'}

# Test 1: Health Check
Write-Host "`n1️⃣  Test Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    Write-Host "✅ API fonctionnelle" -ForegroundColor Green
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
    Write-Host "   Base de données: $($response.database)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur Health Check: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login Gestionnaire
Write-Host "`n2️⃣  Test Login Gestionnaire" -ForegroundColor Yellow
$loginData = @{
    email = "gestionnaire@test.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginData -Headers $headers
    $token = $loginResponse.data.token
    Write-Host "✅ Connexion réussie" -ForegroundColor Green
    Write-Host "   Utilisateur: $($loginResponse.data.user.prenom) $($loginResponse.data.user.nom)" -ForegroundColor Gray
    Write-Host "   Rôle: $($loginResponse.data.user.type_personne)" -ForegroundColor Gray
    
    # Headers avec token pour les prochaines requêtes
    $authHeaders = @{
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $token"
    }
} catch {
    Write-Host "❌ Erreur Login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Liste des utilisateurs
Write-Host "`n3️⃣  Test Liste des utilisateurs" -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Get -Headers $authHeaders
    Write-Host "✅ $($users.data.pagination.total) utilisateurs trouvés" -ForegroundColor Green
    foreach ($user in $users.data.items[0..2]) {  # Afficher les 3 premiers
        Write-Host "   - $($user.prenom) $($user.nom) ($($user.type_personne))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erreur liste utilisateurs: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Liste du matériel
Write-Host "`n4️⃣  Test Liste du matériel" -ForegroundColor Yellow
try {
    $materiel = Invoke-RestMethod -Uri "$baseUrl/api/materiel" -Method Get -Headers $authHeaders
    Write-Host "✅ $($materiel.data.pagination.total) équipements trouvés" -ForegroundColor Green
    foreach ($item in $materiel.data.items[0..2]) {  # Afficher les 3 premiers
        Write-Host "   - $($item.nom) [$($item.statut)]" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erreur liste matériel: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Créer une demande d'intervention (en tant qu'utilisateur)
Write-Host "`n5️⃣  Test Connexion Utilisateur et création demande" -ForegroundColor Yellow
$userLoginData = @{
    email = "utilisateur@test.com"
    password = "password123"
} | ConvertTo-Json

try {
    $userLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $userLoginData -Headers $headers
    $userToken = $userLogin.data.token
    $userHeaders = @{
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $userToken"
    }
    
    Write-Host "✅ Connexion utilisateur réussie" -ForegroundColor Green
    
    # Créer une demande
    $demandeData = @{
        titre = "Test - Problème imprimante"
        description = "L'imprimante ne fonctionne plus depuis ce matin"
        urgence = "MOYENNE"
        categorie = "Hardware"
        nature_technique = "Défaillance matérielle"
        id_materiel = 1
    } | ConvertTo-Json
    
    $demande = Invoke-RestMethod -Uri "$baseUrl/api/demandes" -Method Post -Body $demandeData -Headers $userHeaders
    Write-Host "✅ Demande créée avec succès (ID: $($demande.data.id_demande))" -ForegroundColor Green
    Write-Host "   Titre: $($demande.data.titre)" -ForegroundColor Gray
    Write-Host "   Statut: $($demande.data.statut)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur création demande: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Liste des demandes
Write-Host "`n6️⃣  Test Liste des demandes" -ForegroundColor Yellow
try {
    $demandes = Invoke-RestMethod -Uri "$baseUrl/api/demandes" -Method Get -Headers $authHeaders
    Write-Host "✅ $($demandes.data.pagination.total) demandes trouvées" -ForegroundColor Green
    foreach ($demande in $demandes.data.items[0..2]) {  # Afficher les 3 premières
        Write-Host "   - #$($demande.id_demande): $($demande.titre) [$($demande.statut)]" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erreur liste demandes: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Notifications
Write-Host "`n7️⃣  Test Notifications" -ForegroundColor Yellow
try {
    $notifications = Invoke-RestMethod -Uri "$baseUrl/api/notifications/me" -Method Get -Headers $userHeaders
    Write-Host "✅ $($notifications.data.pagination.total) notifications trouvées" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur notifications: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Rapport système (gestionnaire)
Write-Host "`n8️⃣  Test Rapports système" -ForegroundColor Yellow
try {
    $rapport = Invoke-RestMethod -Uri "$baseUrl/api/reports/system-overview" -Method Get -Headers $authHeaders
    Write-Host "✅ Rapport système généré" -ForegroundColor Green
    Write-Host "   Demandes totales: $($rapport.data.demandes.total)" -ForegroundColor Gray
    Write-Host "   Matériel en service: $($rapport.data.materiel.en_service)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur rapport système: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Tests terminés !" -ForegroundColor Green
Write-Host "Documentation disponible sur: $baseUrl/api/docs" -ForegroundColor Cyan