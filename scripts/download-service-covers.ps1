# Downloads bundled CC0 service cover images from Pexels.
# All sourced from public Pexels URLs (Pexels License: free for commercial use, no attribution required).
# Run from repo root: powershell -ExecutionPolicy Bypass -File fixera/scripts/download-service-covers.ps1

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$svcDir = Join-Path $root 'public\images\services'
$catDir = Join-Path $svcDir '_categories'
New-Item -ItemType Directory -Force -Path $svcDir | Out-Null
New-Item -ItemType Directory -Force -Path $catDir | Out-Null

$qs = '?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop'

$services = @(
    @{ slug = 'interior-design';            id = '1571460' },
    @{ slug = '3d-modeling';                id = '8867434' },
    @{ slug = 'plumbing-services';          id = '8005397' },
    @{ slug = 'electrical-work';            id = '442150' },
    @{ slug = 'hvac-services';              id = '7546011' },
    @{ slug = 'painting-services';          id = '1669754' },
    @{ slug = 'flooring-tiling';            id = '6444286' },
    @{ slug = 'carpentry';                  id = '5974353' },
    @{ slug = 'home-renovation';            id = '1571463' },
    @{ slug = 'roofing';                    id = '8961065' },
    @{ slug = 'masonry-brickwork';          id = '4254893' },
    @{ slug = 'window-door-installation';   id = '6312045' },
    @{ slug = 'siding-cladding';            id = '5582867' },
    @{ slug = 'garden-landscaping';         id = '1108572' },
    @{ slug = 'lawn-care';                  id = '1408221' },
    @{ slug = 'deck-patio-building';        id = '1029599' },
    @{ slug = 'fence-installation';         id = '1216544' }
)

$categories = @(
    @{ slug = 'interior-services';   id = '1571460' },
    @{ slug = 'exterior-structural'; id = '8961065' },
    @{ slug = 'outdoor-garden';      id = '1108572' }
)

function Get-PexelsImage($id, $outFile) {
    $url = "https://images.pexels.com/photos/$id/pexels-photo-$id.jpeg$qs"
    try {
        Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing -TimeoutSec 30
        $size = (Get-Item $outFile).Length
        Write-Output "OK  $outFile ($size bytes)"
    } catch {
        Write-Output "ERR $outFile  $_"
    }
}

foreach ($s in $services) {
    $out = Join-Path $svcDir ("{0}.jpg" -f $s.slug)
    if (Test-Path $out) { Write-Output "SKIP $out (exists)"; continue }
    Get-PexelsImage $s.id $out
}

foreach ($c in $categories) {
    $out = Join-Path $catDir ("{0}.jpg" -f $c.slug)
    if (Test-Path $out) { Write-Output "SKIP $out (exists)"; continue }
    Get-PexelsImage $c.id $out
}
