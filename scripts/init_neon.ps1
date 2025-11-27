# Initialize Neon database using existing init_schema.cjs
# Usage: .\init_neon.ps1

param(
    [string]$DatabaseUrl
)

if (-not $DatabaseUrl) {
    $DatabaseUrl = Read-Host "Enter Neon DATABASE_URL (postgresql://...)?"
}

if (-not $DatabaseUrl) {
    Write-Error "DATABASE_URL is required. Aborting."
    exit 1
}

Write-Host "Temporarily setting DATABASE_URL and running init_schema.cjs"
$env:DATABASE_URL = $DatabaseUrl

# Run Node script to initialize schema
# Use cmd to avoid PowerShell script execution policy issues when invoking npm/node
cmd /c "node scripts/init_schema.cjs"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database initialized successfully."
} else {
    Write-Error "Database initialization failed. Check the DATABASE_URL and network connectivity."
}
