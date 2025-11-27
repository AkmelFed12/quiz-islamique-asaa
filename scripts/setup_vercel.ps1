# Vercel setup helper (PowerShell)
# Requirements: Node.js and npm installed. You will be prompted to login to Vercel.
# Usage: .\setup_vercel.ps1

param(
    [string]$ProjectName,
    [string]$Scope # optional team or user scope
)

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Installing globally (may require admin)..."
    cmd /c "npm install -g vercel"
}

Write-Host "Log in to Vercel (interactive prompt will open)..."
cmd /c "vercel login"

if (-not $ProjectName) {
    $ProjectName = Read-Host "Enter project name to create/import on Vercel (e.g. quiz-islamique-asaa)"
}

# Import project (connect to GitHub) - this command will be interactive
Write-Host "Now run: vercel --prod --confirm --name $ProjectName"
Write-Host "If this is the first deployment, follow the interactive prompts to link your GitHub repo."

Write-Host "
To set environment variables non-interactively you can run (replace values):"
Write-Host "vercel env add DATABASE_URL production < ./env_values/DATABASE_URL.txt"
Write-Host "vercel env add GEMINI_API_KEY production < ./env_values/GEMINI_API_KEY.txt"
Write-Host "vercel env add VITE_ENV production < ./env_values/VITE_ENV.txt"

Write-Host "I recommend creating small files with the values in a folder './env_values' and using the commands above."

Write-Host "When finished, run: vercel --prod"
