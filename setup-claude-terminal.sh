#!/bin/bash

# Claude Terminal Setup Script
echo "🤖 Claude Terminal Setup"
echo "========================"
echo ""
echo "This script will help you set up Claude in your terminal."
echo ""
echo "📋 First, get your API key:"
echo "1. Go to https://console.anthropic.com"
echo "2. Sign in to your account"
echo "3. Navigate to 'API Keys' section"
echo "4. Create a new API key (starts with sk-ant-api03-...)"
echo ""
echo -n "Paste your Anthropic API key here: "
read API_KEY

# Validate API key format
if [[ ! "$API_KEY" =~ ^sk-ant-api03-.+ ]]; then
    echo "❌ Invalid API key format. It should start with 'sk-ant-api03-'"
    exit 1
fi

# Update .zshrc
if grep -q "ANTHROPIC_API_KEY" ~/.zshrc; then
    # Replace existing key
    sed -i '' "s/export ANTHROPIC_API_KEY=.*/export ANTHROPIC_API_KEY=\"$API_KEY\"/" ~/.zshrc
    echo "✅ Updated API key in ~/.zshrc"
else
    # Add new key
    echo "" >> ~/.zshrc
    echo "# Anthropic API Key for Claude CLI" >> ~/.zshrc
    echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> ~/.zshrc
    echo "✅ Added API key to ~/.zshrc"
fi

# Source the updated config
source ~/.zshrc

# Test the connection
echo ""
echo "Testing Claude connection..."
if claude "Say 'Hello! Claude is working!' if you can hear me" 2>/dev/null; then
    echo ""
    echo "🎉 Success! Claude is now set up in your terminal."
    echo ""
    echo "You can use these commands:"
    echo "  claude 'your question'    - Ask Claude anything"
    echo "  cc 'your question'        - Short alias for claude"
    echo "  ccfix                     - Find and fix errors in your project"
    echo "  cct                       - Run tests and review results"
    echo ""
else
    echo ""
    echo "⚠️  Claude command didn't work. Please check your API key and try again."
    echo "You can manually edit ~/.zshrc to update your API key."
fi