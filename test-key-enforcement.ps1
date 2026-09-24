$email    = "profjero947@gmail.com"
$password = Read-Host "Firebase password" -AsSecureString
$plain    = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)
$signIn = Invoke-RestMethod `
  -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyD3xt0baD2zzSB4Lk5vEH2wzb5p7lokhSI" `
  -Method Post -Body (@{ email = $email; password = $plain; returnSecureToken = $true } | ConvertTo-Json) `
  -ContentType "application/json"

$h = @{ Authorization = "Bearer $($signIn.idToken)" }
$apiBase = "https://profjero-sms-api-prod.amoakob947.workers.dev"

Write-Host "`n=== /admin/me ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$apiBase/admin/me" -Headers $h | ConvertTo-Json

Write-Host "`n=== /admin/providers ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$apiBase/admin/providers" -Headers $h | ConvertTo-Json -Depth 4