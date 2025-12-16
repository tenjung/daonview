# .env.local 복원 스크립트
# 사용법: .\restore-env.ps1

$backupPath = "$env:USERPROFILE\.daonview-env-backup.local"

if (Test-Path $backupPath) {
    Copy-Item $backupPath .env.local -Force
    Write-Host "✅ .env.local 파일이 복원되었습니다!" -ForegroundColor Green
    Write-Host "💡 개발 서버를 재시작하세요: npm run dev" -ForegroundColor Yellow
} else {
    Write-Host "❌ 백업 파일을 찾을 수 없습니다: $backupPath" -ForegroundColor Red
    Write-Host "💡 .env.example을 복사해서 수동으로 설정하세요." -ForegroundColor Yellow
}
