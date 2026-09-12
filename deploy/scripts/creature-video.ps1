# Monta creature_animation_test.mp4 a partir dos frames capturados pelo Unity.
# Os frames sao gerados por GenoryxCreatureCapture; este script so precisa de ffmpeg.

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dir = Join-Path $root "apps\unity-game\Captures\creature-system-v1"
$frames = Join-Path $dir "video-frames"
$out = Join-Path $dir "creature_animation_test.mp4"

# O winget instala o ffmpeg via alias em WindowsApps e so exporta o PATH para shells
# NOVOS. Num shell que ja estava aberto durante a instalacao, `ffmpeg` nao resolve, e o
# script falhava mesmo com o binario presente. Por isso o fallback no diretorio do pacote.
$ffmpeg = $null
$onPath = Get-Command ffmpeg -ErrorAction SilentlyContinue
if ($onPath) {
    $ffmpeg = $onPath.Source
}

if (-not $ffmpeg) {
    $ffmpeg = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse `
        -Filter ffmpeg.exe -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
}

if (-not $ffmpeg) {
    Write-Error "ffmpeg nao encontrado. Instale com: winget install Gyan.FFmpeg"
}

if (-not (Test-Path $frames)) {
    Write-Error "Frames nao encontrados em $frames. Rode as capturas do Unity antes."
}

& $ffmpeg -y -framerate 20 -i (Join-Path $frames "frame_%04d.png") `
    -c:v libx264 -pix_fmt yuv420p -vf "scale=1024:-2" $out

Write-Host "video: $out"
