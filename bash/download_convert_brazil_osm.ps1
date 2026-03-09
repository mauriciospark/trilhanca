param(
  [string]$OutDir = "data"
)
$ErrorActionPreference = "Stop"
$uri = "https://download.geofabrik.de/south-america/brazil-latest.osm.pbf"
$outDirAbs = Join-Path (Get-Location) $OutDir
New-Item -ItemType Directory -Force -Path $outDirAbs | Out-Null
$pbfPath = Join-Path $outDirAbs "brazil-latest.osm.pbf"
Invoke-WebRequest -Uri $uri -OutFile $pbfPath
$osmconvertCandidates = @(
  Join-Path $PSScriptRoot "osmconvert64.exe",
  Join-Path $PSScriptRoot "tools\osmconvert64.exe",
  "osmconvert64.exe",
  "osmconvert.exe"
)
$osm = $null
foreach($c in $osmconvertCandidates){
  if(Get-Command $c -ErrorAction SilentlyContinue){ $osm = (Get-Command $c).Source; break }
  if(Test-Path $c){ $osm = $c; break }
}
if($osm){
  $osmPath = Join-Path $outDirAbs "brazil.osm"
  & $osm $pbfPath "-o=$osmPath"
  Write-Host "OK: $osmPath"
}else{
  Write-Host "Osmconvert não encontrado. Baixe osmconvert64.exe e coloque em bash/ ou bash/tools/, depois reexecute."
}
