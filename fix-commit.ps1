# Script to fix the commit with secrets
Write-Host "=== Fixing Git Commit with Secrets ===" -ForegroundColor Cyan
Write-Host ""

# Check current state
Write-Host "Current commits:" -ForegroundColor Yellow
git log --oneline -3

Write-Host "`nStarting interactive rebase to fix commit 'I'm pissed'..." -ForegroundColor Yellow
Write-Host "This will open an editor. Change 'pick' to 'edit' for commit 89d88a3" -ForegroundColor Cyan
Write-Host ""

# Set the editor to something simple (or use the default)
$env:GIT_EDITOR = "notepad"

# Start the rebase
Write-Host "Starting rebase..." -ForegroundColor Yellow
git rebase -i HEAD~2

Write-Host "`nIf rebase stopped, the files should already be fixed." -ForegroundColor Green
Write-Host "Run these commands:" -ForegroundColor Cyan
Write-Host "  git add supabase/functions/QUICK_DEPLOY.md supabase/functions/SUPABASE_SETUP.md" -ForegroundColor White
Write-Host "  git commit --amend --no-edit" -ForegroundColor White
Write-Host "  git rebase --continue" -ForegroundColor White




