#!/bin/bash

# HireVify Offline Mode Fix Script
# This script helps you get your app connected to the backend

echo "🚀 HireVify Offline Mode Fix Script"
echo "==================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored text
print_color() {
    echo -e "${1}${2}${NC}"
}

# Check if .env.local exists
if [ ! -f .env.local ]; then
    print_color $YELLOW "⚠️  No .env.local file found"
    
    if [ -f .env.example ]; then
        print_color $BLUE "📝 Creating .env.local from .env.example..."
        cp .env.example .env.local
        print_color $GREEN "✅ Created .env.local"
        print_color $YELLOW "🔧 Please edit .env.local with your actual Supabase credentials"
        print_color $BLUE "📖 See PRODUCTION_SETUP.md for detailed instructions"
    else
        print_color $RED "❌ No .env.example found either!"
        exit 1
    fi
else
    print_color $GREEN "✅ Found .env.local"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_color $YELLOW "⚠️  Supabase CLI not found"
    print_color $BLUE "📦 Installing Supabase CLI..."
    npm install -g supabase
    print_color $GREEN "✅ Supabase CLI installed"
fi

# Check if user is logged in to Supabase
if ! supabase --version &> /dev/null; then
    print_color $YELLOW "🔐 Please login to Supabase:"
    supabase login
fi

# Deploy functions
print_color $BLUE "🚀 Deploying Supabase Edge Functions..."
supabase functions deploy --project-ref lfwfwnqoioqyxnbzlnje

if [ $? -eq 0 ]; then
    print_color $GREEN "✅ Functions deployed successfully"
else
    print_color $RED "❌ Function deployment failed"
    print_color $YELLOW "💡 Make sure you're logged in and have access to the project"
    exit 1
fi

# Test backend health
print_color $BLUE "🏥 Testing backend health..."
npm run check-backend

# Instructions
print_color $GREEN "\n🎉 Setup complete!"
print_color $BLUE "📋 Next steps:"
print_color $YELLOW "   1. Edit .env.local with your actual credentials"
print_color $YELLOW "   2. Restart your development server: npm run dev"
print_color $YELLOW "   3. Check browser console for 'Backend is accessible' message"
print_color $BLUE "\n📖 For detailed instructions: PRODUCTION_SETUP.md"