# .env.local 백업 스크립트
# 사용법: .\backup-env.ps1

$backupPath = "$env:USERPROFILE\.daonview-env-backup.local"

if (Test-Path .env.local) {
    Copy-Item .env.local $backupPath -Force
    Write-Host "✅ .env.local 파일이 백업되었습니다: $backupPath" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local 파일을 찾을 수 없습니다." -ForegroundColor Red
}
