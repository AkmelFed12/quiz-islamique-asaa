#!/bin/bash
# Database Setup Script for Quiz App
# Run this script to quickly set up and test your database connection

echo "🔧 Quiz App - Database Setup"
echo "============================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "📋 Please create .env.local with your database credentials:"
    echo ""
    echo "   Copy .env.example to .env.local:"
    echo "   cp .env.example .env.local"
    echo ""
    echo "   Then edit .env.local and add your Neon PostgreSQL URL:"
    echo "   DATABASE_URL=postgresql://..."
    echo ""
    exit 1
fi

echo "✅ .env.local found"
echo ""

# Check if DATABASE_URL is configured
if grep -q "DATABASE_URL=postgresql://" .env.local; then
    echo "✅ DATABASE_URL is configured"
else
    echo "⚠️  DATABASE_URL not properly configured in .env.local"
    echo "   Please add: DATABASE_URL=postgresql://user:pass@host/db?sslmode=require"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Starting development server..."
echo "   The database will initialize automatically on startup."
echo ""
echo "   Open http://localhost:5173 in your browser"
echo ""

npm run dev
