$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$tpl  = Join-Path $root 'creative-template.html'
$out  = Join-Path $root 'creatives'
$sizes = @{ feed = '1080,1350'; square = '1080,1080'; story = '1080,1920' }
foreach ($v in 'a','b','c') {
  foreach ($f in 'feed','square','story') {
    $file = Join-Path $out ("dieselcraft-$v-$f.png")
    $url  = ([System.Uri]$tpl).AbsoluteUri + "#$v-$f"
    & $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
      --window-size=$($sizes[$f]) --screenshot="$file" $url | Out-Null
    Write-Host "$file"
  }
}
