# Push the project to a GitHub repo (PowerShell helper)
# Usage: .\push_to_github.ps1

param(
    [string]$RepoUrl
)

if (-not (Test-Path ".git")) {
    Write-Host "No git repo found — initializing..."
    git init
    git branch -M main
}

if (-not $RepoUrl) {
    $RepoUrl = Read-Host "Enter the GitHub repository HTTPS URL (e.g. https://github.com/username/repo.git)"
}

if (-not $RepoUrl) {
    Write-Error "Repository URL is required. Aborting."
    exit 1
}

# Add remote if not exists
$existing = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add origin $RepoUrl
} else {
    Write-Host "Remote 'origin' already exists: $existing"
    $replace = Read-Host "Replace remote origin with $RepoUrl ? (y/N)"
    if ($replace -match '^y') { git remote set-url origin $RepoUrl }
}

# Commit and push
git add .
if (-not (git status --porcelain)) {
    Write-Host "No changes to commit"
} else {
    git commit -m "chore: prepare for deployment"
}

Write-Host "Pushing to origin main..."
# Use cmd to avoid PowerShell execution policy issues with npm in CI scripts
cmd /c "git push -u origin main --force"

if ($LASTEXITCODE -eq 0) { Write-Host "Push complete." } else { Write-Error "Push failed." }
