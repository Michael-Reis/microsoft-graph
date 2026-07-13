<#
  setup-entra-teams-app.ps1
  ------------------------------------------------------------
  Cria (ou atualiza) um App Registration no Microsoft Entra ID
  para a aplicacao enviar mensagens no Teams via Microsoft Graph
  usando o fluxo ROPC (usuario + senha, sem interacao).

  PRE-REQUISITOS
    1. Azure CLI instalado:  https://aka.ms/installazurecli
    2. Logar como ADMINISTRADOR GLOBAL do tenant orit.com.br:
         az login
    3. Rodar este script no PowerShell:
         .\scripts\setup-entra-teams-app.ps1

  O QUE ELE FAZ
    - Cria o App Registration "ORIT Teams Notifier"
    - Habilita "public client flows" (necessario para ROPC)
    - Adiciona as permissoes DELEGADAS do Graph:
        User.Read, User.ReadBasic.All, Chat.ReadWrite, ChatMessage.Send
    - Cria um client secret
    - Concede admin consent
    - Imprime os valores prontos para colar no .env
#>

$ErrorActionPreference = 'Stop'

$AppName    = 'ORIT Teams Notifier'
$GraphAppId = '00000003-0000-0000-c000-000000000000'   # Microsoft Graph (constante)
$Scopes     = @('User.Read', 'User.ReadBasic.All', 'Chat.ReadWrite', 'ChatMessage.Send')

Write-Host '==> Verificando login do Azure CLI...' -ForegroundColor Cyan
try { $account = az account show | ConvertFrom-Json } catch { $account = $null }
if (-not $account) { throw "Rode 'az login' como administrador global do tenant antes de continuar." }
$TenantId = $account.tenantId
Write-Host "    Tenant: $TenantId"

Write-Host '==> Obtendo service principal do Microsoft Graph...' -ForegroundColor Cyan
$graphSp = az ad sp show --id $GraphAppId | ConvertFrom-Json

# Resolve o ID de cada permissao delegada pelo nome (sem GUIDs fixos)
$resourceAccess = @()
foreach ($s in $Scopes) {
    $scope = $graphSp.oauth2PermissionScopes | Where-Object { $_.value -eq $s }
    if (-not $scope) { throw "Permissao delegada nao encontrada no Graph: $s" }
    $resourceAccess += @{ id = $scope.id; type = 'Scope' }
}
$rraJson = ConvertTo-Json @(@{ resourceAppId = $GraphAppId; resourceAccess = $resourceAccess }) -Depth 6

Write-Host "==> Procurando App Registration existente '$AppName'..." -ForegroundColor Cyan
$existing = az ad app list --display-name $AppName | ConvertFrom-Json
if ($existing.Count -gt 0) {
    $AppId = $existing[0].appId
    Write-Host "    Encontrado. appId=$AppId (as permissoes serao atualizadas)"
} else {
    Write-Host '==> Criando App Registration...' -ForegroundColor Cyan
    $created = az ad app create --display-name $AppName --sign-in-audience AzureADMyOrg | ConvertFrom-Json
    $AppId = $created.appId
    Write-Host "    Criado. appId=$AppId"
}

Write-Host '==> Habilitando public client flows (necessario para ROPC)...' -ForegroundColor Cyan
az ad app update --id $AppId --is-fallback-public-client true | Out-Null

Write-Host '==> Aplicando permissoes do Microsoft Graph...' -ForegroundColor Cyan
$tmp = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tmp, $rraJson)   # UTF-8 sem BOM (o az nao aceita BOM)
az ad app update --id $AppId --required-resource-accesses "@$tmp" | Out-Null
Remove-Item $tmp -Force

# Garante o service principal do app (necessario para o consent)
$appSp = az ad sp list --filter "appId eq '$AppId'" | ConvertFrom-Json
if ($appSp.Count -eq 0) {
    Write-Host '==> Criando service principal do app...' -ForegroundColor Cyan
    az ad sp create --id $AppId | Out-Null
}

Write-Host '==> Gerando client secret (validade 2 anos)...' -ForegroundColor Cyan
$secret = az ad app credential reset --id $AppId --append --display-name 'ropc-secret' --years 2 | ConvertFrom-Json
$ClientSecret = $secret.password

Write-Host '==> Concedendo admin consent...' -ForegroundColor Cyan
Start-Sleep -Seconds 5   # aguarda a propagacao do service principal
az ad app permission admin-consent --id $AppId

Write-Host ''
Write-Host '====================== COLE NO .env ======================' -ForegroundColor Green
Write-Host "CLIENT_ID=$AppId"
Write-Host "CLIENT_SECRET=$ClientSecret"
Write-Host "AUTHORITY=https://login.microsoftonline.com/$TenantId"
Write-Host 'MICROSOFT_GRAPH_ROPC_USER=noreply@orit.com.br'
Write-Host 'MICROSOFT_GRAPH_ROPC_PASSWORD=<senha da conta noreply>'
Write-Host '==========================================================' -ForegroundColor Green
Write-Host ''
Write-Host 'IMPORTANTE: a conta noreply@orit.com.br precisa ter licenca do Teams e estar SEM MFA.' -ForegroundColor Yellow
Write-Host 'Guarde o CLIENT_SECRET agora - ele nao pode ser recuperado depois.' -ForegroundColor Yellow
