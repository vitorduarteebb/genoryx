# Empacota o repo para deploy na VPS e envia o tarball.
# O passo remoto e deploy/scripts/vps-deploy-remote.sh, que espera /tmp/nexora-alpha.tgz.
#
# Exclusoes que importam:
#   apps/unity-game  - Library sozinha tem 3.5 GB e nenhuma imagem Docker usa o projeto.
#                      O que vai para producao e o bundle ja compilado em
#                      apps/web/public/unity-game, que NAO e excluido.
#   .env.production  - o remoto preserva o arquivo que ja esta na VPS.
#
# Somente ASCII neste arquivo: o PowerShell 5.1 le .ps1 sem BOM como cp1252, e um
# em-dash UTF-8 vira aspa tipografica, que abre string e quebra o parse.

param(
    [string]$Key = "$env:USERPROFILE\.ssh\id_ed25519_vps_paesleme",
    [string]$Target = "root@85.31.60.84",
    [switch]$SkipUpload
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$tarball = Join-Path $env:TEMP "nexora-alpha.tgz"

$exclude = @(
    ".git", ".turbo", "node_modules", ".next", "coverage",
    "apps/unity-game",
    "backups", "release", "dist-desktop", "downloads", "instalador",
    ".env", ".env.production", ".env.meshy.local"
)

# $args e variavel automatica do PowerShell; nao reutilizar.
$tarArgs = @("-czf", $tarball)
foreach ($item in $exclude) {
    $tarArgs += "--exclude=./$item"
}
$tarArgs += @("-C", $root, ".")

Write-Host "empacotando $root"
& tar @tarArgs
if ($LASTEXITCODE -ne 0) {
    Write-Error "tar falhou com codigo $LASTEXITCODE"
}

$mb = [math]::Round((Get-Item $tarball).Length / 1MB, 1)
Write-Host "tarball: $tarball ($mb MB)"

if (-not (Test-Path (Join-Path $root "apps/web/public/unity-game/Build"))) {
    Write-Warning "sem bundle WebGL em apps/web/public/unity-game/Build - /game-unity cai no Phaser"
}

if ($SkipUpload) {
    return
}

Write-Host "enviando para $Target"
& scp -i $Key $tarball "${Target}:/tmp/nexora-alpha.tgz"
if ($LASTEXITCODE -ne 0) {
    Write-Error "scp falhou com codigo $LASTEXITCODE"
}

Write-Host "ok. no remoto: sh deploy/scripts/vps-deploy-remote.sh"
