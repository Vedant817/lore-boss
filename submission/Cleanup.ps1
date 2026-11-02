param([switch]$Apply)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if($repo -ne 'C:\Users\vedan\Documents\Resources\Code\lore-boss'){throw 'Unexpected workspace; refusing cleanup'}
if((Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'demo.mp4')).Hash -ne '62F5B1CE656ED4B3271B57B755EA0A39923008CDF63BC899134316D5A497BB1C'){throw 'Retained demo hash mismatch'}
$targets=[Collections.Generic.List[string]]::new()
foreach($name in @('node_modules','dist','test-results','playwright-report','recordings')){
 $candidate=Join-Path $repo $name
 if(Test-Path -LiteralPath $candidate){
  $resolved=(Resolve-Path -LiteralPath $candidate).Path
  if($resolved -ne $candidate -or ((Get-Item -LiteralPath $resolved -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Unsafe generated-directory target'}
  $targets.Add($resolved)
 }
}
$roots=@('C:\Users\vedan\Videos','C:\Users\vedan\AppData\Local\Temp',$env:TEMP) | Where-Object {Test-Path -LiteralPath $_} | ForEach-Object {(Resolve-Path -LiteralPath $_).Path} | Select-Object -Unique
foreach($root in $roots){
 foreach($item in @(Get-ChildItem -LiteralPath $root -Directory -Force | Where-Object {$_.Name -match '^LoreBoss[-_]'})){
  $resolved=(Resolve-Path -LiteralPath $item.FullName).Path
  if([IO.Path]::GetDirectoryName($resolved) -ne $root -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Unsafe project-artifact target'}
  $targets.Add($resolved)
 }
}
$targets | ForEach-Object {[pscustomobject]@{Action=if($Apply){'DELETE'}else{'PREVIEW'};Path=$_}} | Format-Table -AutoSize
if(!$Apply){Write-Output 'Preview only. Re-run with -Apply to remove exactly these project-generated directories. Source, .git, .env, data, submission and shared tools are preserved.';exit 0}
$removed=[Collections.Generic.List[string]]::new()
foreach($target in $targets){
 Remove-Item -LiteralPath $target -Recurse -Force
 if(Test-Path -LiteralPath $target){throw 'Cleanup target remains'}
 $removed.Add($target)
}
[pscustomobject]@{completedAt=[DateTime]::UtcNow.ToString('o');removed=$removed;retainedVideo='submission/demo.mp4'} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'evidence/cleanup-applied.json')
Write-Output 'Cleanup completed. Only the retained submission video remains in the workspace; required dependency declarations are preserved.'
