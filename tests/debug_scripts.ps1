Add-Type -AssemblyName System.Windows.Forms
$wb = New-Object System.Windows.Forms.WebBrowser
$wb.ScriptErrorsSuppressed = $false

$fileUri = (Resolve-Path "tests\tests.html").ToString()
$wb.Navigate($fileUri)

$timeout = 0
while ($wb.ReadyState -ne [System.Windows.Forms.WebBrowserReadyState]::Complete -and $timeout -lt 80) {
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 50
    $timeout++
}
Start-Sleep -Milliseconds 500
[System.Windows.Forms.Application]::DoEvents()

$doc = $wb.Document
$res = $doc.InvokeScript("eval", [object[]]@("try { eval('const z = 1;'); 'const OK'; } catch(e) { e.message; }"))
Write-Host "Const eval: $res"
