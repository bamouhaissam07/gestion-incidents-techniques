# Script de test simple pour l'API
Write-Host "🧪 Tests API Gestion des Incidents" -ForegroundColor Green

$baseUrl = "http://localhost:3001"

# Test 1: Health Check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    Write-Host "✅ API fonctionnelle - Version: $($response.version)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "`n2. Test Login..." -ForegroundColor Yellow
$loginData = '{"email":"gestionnaire@test.com","password":"password123"}'
$headers = @{'Content-Type' = 'application/json'}

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginData -Headers $headers
    $token = $loginResponse.data.token
    Write-Host "✅ Login réussi - Role: $($loginResponse.data.user.type_personne)" -ForegroundColor Green
    
    $authHeaders = @{
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $token"
    }
} catch {
    Write-Host "❌ Erreur login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Liste utilisateurs
Write-Host "`n3. Liste utilisateurs..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Get -Headers $authHeaders
    Write-Host "✅ $($users.data.pagination.total) utilisateurs trouvés" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Liste matériel
Write-Host "`n4. Liste matériel..." -ForegroundColor Yellow
try {
    $materiel = Invoke-RestMethod -Uri "$baseUrl/api/materiel" -Method Get -Headers $authHeaders
    Write-Host "✅ $($materiel.data.pagination.total) équipements trouvés" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Tests terminés avec succès!" -ForegroundColor Green
Write-Host "📖 Documentation: http://localhost:3001/api/docs" -ForegroundColor Cyan