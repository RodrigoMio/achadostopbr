param(
  [Parameter(Mandatory = $true)]
  [string]$RemoteUrl
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$existing = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
  if ($existing -ne $RemoteUrl) {
    git remote set-url origin $RemoteUrl
    Write-Host "Remote origin atualizado para $RemoteUrl"
  }
} else {
  git remote add origin $RemoteUrl
  Write-Host "Remote origin adicionado: $RemoteUrl"
}

git push -u origin main
Write-Host 'Push concluído.'
