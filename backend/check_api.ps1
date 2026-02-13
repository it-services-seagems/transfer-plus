# ========================================
# Script de Verificacao da API TRANSFERPLUS
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICACAO DA API TRANSFERPLUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# URLs para testar
$urls = @(
    "http://127.0.0.1:9282/health",
    "http://10.15.3.30:9282/health"
)

$allSuccess = $true

foreach ($url in $urls) {
    Write-Host "Testando: $url" -ForegroundColor Yellow
    
    try {
        # Fazer requisicao HTTP
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -UseBasicParsing
        
        # Verificar status code
        if ($response.StatusCode -eq 200) {
            Write-Host "   Status Code: $($response.StatusCode) OK" -ForegroundColor Green
            
            # Parse JSON response
            $jsonResponse = $response.Content | ConvertFrom-Json
            
            Write-Host "   Resposta da API:" -ForegroundColor Cyan
            Write-Host "      - Status: $($jsonResponse.status)" -ForegroundColor White
            Write-Host "      - CORS: $($jsonResponse.cors)" -ForegroundColor White
            Write-Host "      - Server: $($jsonResponse.server)" -ForegroundColor White
            Write-Host "      - Timestamp: $($jsonResponse.timestamp)" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Yellow
            $allSuccess = $false
        }
    }
    catch {
        Write-Host "   ERRO: API nao esta respondendo" -ForegroundColor Red
        Write-Host "      Detalhes: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        $allSuccess = $false
    }
}

Write-Host "========================================" -ForegroundColor Cyan
if ($allSuccess) {
    Write-Host "API ESTA FUNCIONANDO CORRETAMENTE!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "PROBLEMAS DETECTADOS NA API" -ForegroundColor Red
    Write-Host "" 
    Write-Host "Verificacoes sugeridas:" -ForegroundColor Yellow
    Write-Host "   1. Verifique se o servidor esta rodando: python api.py" -ForegroundColor White
    Write-Host "   2. Confirme se a porta 9281 esta disponivel" -ForegroundColor White
    Write-Host "   3. Verifique firewall e configuracoes de rede" -ForegroundColor White
    exit 1
}
Write-Host "========================================" -ForegroundColor Cyan
