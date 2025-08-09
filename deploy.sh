#!/bin/bash

echo "🚀 Hotel Inventory System - Auto Deploy Script"
echo "=============================================="

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Node.js and npm found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Check if Vercel CLI is installed
if command -v vercel >/dev/null 2>&1; then
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "🎉 Deployment successful!"
        echo "📱 Your app is now live on Vercel"
    else
        echo "⚠️  Deployment failed, but you can deploy manually:"
        echo "   1. Install Vercel CLI: npm i -g vercel"
        echo "   2. Run: vercel --prod"
    fi
else
    echo "⚠️  Vercel CLI not found. Manual deployment required:"
    echo "   1. Install Vercel CLI: npm i -g vercel"
    echo "   2. Run: vercel --prod"
    echo "   3. Or upload the .next folder to your hosting provider"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Open /setup page in your browser"
echo "   2. Enter your Supabase credentials"
echo "   3. Run the automatic setup wizard"
echo "   4. Your hotel inventory system will be ready!"
echo ""
echo "✨ Happy managing your hotel inventory!"
