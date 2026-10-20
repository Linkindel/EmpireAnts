$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$url = "file:///" + ((Resolve-Path "tests\tests.html").ToString().Replace("\", "/"))
$outPath = (Resolve-Path "tests").ToString() + "\edge_out.html"
$tmpProfile = "$env:TEMP\EdgeTestProfile_" + (Get-Random)

Write-Host "Edge Path: $edgePath"
Write-Host "URL: $url"

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $edgePath
$psi.Arguments = "--headless=new --disable-gpu --no-sandbox --user-data-dir=`"$tmpProfile`" --dump-dom `"$url`""
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true

$proc = [System.Diagnostics.Process]::Start($psi)
$stdout = $proc.StandardOutput.ReadToEnd()
$stderr = $proc.StandardError.ReadToEnd()
$proc.WaitForExit(15000)

Write-Host "ExitCode: $($proc.ExitCode)"
Write-Host "Stdout length: $($stdout.Length)"
if ($stderr) {
    Write-Host "Stderr: $stderr"
}

if ($stdout.Length -gt 0) {
    [System.IO.File]::WriteAllText($outPath, $stdout)
    Write-Host "Dump written to $outPath"
    if ($stdout -match 'data-test-summary="([^"]+)"') {
        Write-Host "Summary: $($matches[1])"
    } elseif ($stdout -match 'statTotal">([^<]+)<') {
        Write-Host "Total: $($matches[1])"
    }
}
