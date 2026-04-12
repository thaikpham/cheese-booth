param(
  [Parameter(Mandatory = $true)]
  [string]$FilePath
)

$ErrorActionPreference = "Stop"

$thumbprint = $env:WINDOWS_CERTIFICATE_THUMBPRINT

if ([string]::IsNullOrWhiteSpace($thumbprint)) {
  Write-Host "WINDOWS_CERTIFICATE_THUMBPRINT is not configured. Skipping Windows signing."
  exit 0
}

$digestAlgorithm = if ($env:WINDOWS_DIGEST_ALGORITHM) {
  $env:WINDOWS_DIGEST_ALGORITHM
} else {
  "sha256"
}

$timestampUrl = if ($env:WINDOWS_TIMESTAMP_URL) {
  $env:WINDOWS_TIMESTAMP_URL
} else {
  "http://timestamp.digicert.com"
}

function Resolve-SignToolPath {
  if ($env:WINDOWS_SIGNTOOL_PATH -and (Test-Path $env:WINDOWS_SIGNTOOL_PATH)) {
    return $env:WINDOWS_SIGNTOOL_PATH
  }

  $signToolCommand = Get-Command signtool.exe -ErrorAction SilentlyContinue
  if ($signToolCommand) {
    return $signToolCommand.Source
  }

  $candidates = Get-ChildItem `
    -Path "C:\Program Files (x86)\Windows Kits\10\bin" `
    -Filter "signtool.exe" `
    -Recurse `
    -ErrorAction SilentlyContinue `
  | Sort-Object FullName -Descending

  if ($candidates.Count -gt 0) {
    return $candidates[0].FullName
  }

  throw "Could not locate signtool.exe on this runner."
}

$signToolPath = Resolve-SignToolPath

$arguments = @(
  "sign"
  "/sha1"
  $thumbprint
  "/fd"
  $digestAlgorithm
  "/tr"
  $timestampUrl
  "/td"
  $digestAlgorithm
  $FilePath
)

Write-Host "Signing Windows bundle with signtool."
& $signToolPath @arguments

if ($LASTEXITCODE -ne 0) {
  throw "signtool failed with exit code $LASTEXITCODE"
}
