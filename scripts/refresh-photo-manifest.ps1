$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$photosRoot = Join-Path $root "assets\\photos"
$outputPath = Join-Path $root "photo-manifest.js"

$categories = [ordered]@{
  "beach" = "assets/photos/beach"
  "nature" = "assets/photos/nature"
  "street" = "assets/photos/street"
  "black-and-white" = "assets/photos/black-and-white"
  "people" = "assets/photos/people"
}

$extensions = @(".jpg", ".jpeg", ".png", ".webp", ".avif")
$manifest = [ordered]@{}

foreach ($entry in $categories.GetEnumerator()) {
  $categoryPath = Join-Path $root $entry.Value
  if (-not (Test-Path $categoryPath)) {
    $manifest[$entry.Key] = @()
    continue
  }

  $files = Get-ChildItem -Path $categoryPath -File |
    Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    ForEach-Object { "$($entry.Value)/$($_.Name)" }

  $manifest[$entry.Key] = @($files)
}

$json = $manifest | ConvertTo-Json -Depth 4
$content = "window.GLLRY_PHOTO_MANIFEST = $json;"
Set-Content -Path $outputPath -Value $content -Encoding UTF8

Write-Output "Updated photo manifest: $outputPath"
