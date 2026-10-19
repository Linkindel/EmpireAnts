Add-Type -AssemblyName System.Windows.Forms
$wb = New-Object System.Windows.Forms.WebBrowser
$wb.ScriptErrorsSuppressed = $true
$fileUri = (Resolve-Path "tests\tests.html").ToString()
$wb.Navigate($fileUri)

$timeout = 0
while ($wb.ReadyState -ne [System.Windows.Forms.WebBrowserReadyState]::Complete -and $timeout -lt 80) {
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 50
    $timeout++
}
Start-Sleep -Milliseconds 400
[System.Windows.Forms.Application]::DoEvents()

$doc = $wb.Document
$summaryJson = $doc.Body.GetAttribute('data-test-summary')
Write-Host "=== TEST SUMMARY ==="
Write-Host $summaryJson

$total = $doc.GetElementById('statTotal').InnerText
$pass = $doc.GetElementById('statPass').InnerText
$fail = $doc.GetElementById('statFail').InnerText
$rate = $doc.GetElementById('statRate').InnerText

Write-Host "Total: $total | Passes: $pass | Echecs: $fail | Taux: $rate"

if ([int]$fail -gt 0) {
    Write-Host "ERREURS DETECTEES DANS LES TESTS:"
    $cards = $doc.GetElementsByTagName('div')
    foreach ($div in $cards) {
        if ($div.GetAttribute('className') -eq 'test-error') {
            Write-Host ("- " + $div.InnerText)
        }
    }
    exit 1
} else {
    Write-Host "TOUS LES TESTS ONT REUSSI AVEC SUCCES (100% SUCCES)"
    exit 0
}
