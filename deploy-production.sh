#!/bin/bash

echo "🚀 Restaurant Voice Agents - Production Deployment Script"
echo "========================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi

    # Check git
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi

    print_success "All requirements met"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."

    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi

    # Deploy
    vercel --prod

    print_success "Deployed to Vercel successfully!"
}

# Deploy to Railway
deploy_railway() {
    print_status "Deploying to Railway..."

    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi

    # Deploy
    railway up

    print_success "Deployed to Railway successfully!"
}

# Deploy to Render
deploy_render() {
    print_status "Deploying to Render..."

    # Create render.yaml if it doesn't exist
    if [ ! -f "render.yaml" ]; then
        cat > render.yaml << EOF
services:
  - type: web
    name: restaurant-voice-agents
    env: node
    buildCommand: npm install
    startCommand: npm run server
    envVars:
      - key: NODE_ENV
        value: production
      - key: ELEVENLABS_API_KEY
        sync: false
EOF
    fi

    print_status "Push to GitHub to trigger Render deployment"
    git add .
    git commit -m "Deploy to Render"
    git push

    print_success "Pushed to GitHub. Render will auto-deploy!"
}

# Deploy to Fly.io
deploy_fly() {
    print_status "Deploying to Fly.io..."

    # Check if Fly CLI is installed
    if ! command -v flyctl &> /dev/null; then
        print_warning "Fly CLI not found. Please install from https://fly.io/docs/getting-started/installing-flyctl/"
        return
    fi

    # Create fly.toml if it doesn't exist
    if [ ! -f "fly.toml" ]; then
        flyctl launch --name restaurant-voice-agents --region sjc
    else
        flyctl deploy
    fi

    print_success "Deployed to Fly.io successfully!"
}

# Main deployment menu
main_menu() {
    echo ""
    echo "Select deployment platform:"
    echo "1) Vercel (Recommended for frontend)"
    echo "2) Railway (Full-stack with database)"
    echo "3) Render (Auto-deploy from GitHub)"
    echo "4) Fly.io (Global edge deployment)"
    echo "5) Deploy to all platforms"
    echo "6) Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice

    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_railway
            ;;
        3)
            deploy_render
            ;;
        4)
            deploy_fly
            ;;
        5)
            print_status "Deploying to all platforms..."
            deploy_vercel
            deploy_railway
            deploy_render
            deploy_fly
            ;;
        6)
            print_status "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            main_menu
            ;;
    esac
}

# Environment setup
setup_environment() {
    print_status "Setting up production environment..."

    # Check for .env file
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating..."

        read -p "Enter your ElevenLabs API key: " api_key
        echo "ELEVENLABS_API_KEY=$api_key" > .env
        echo "NODE_ENV=production" >> .env

        print_success ".env file created"
    fi

    # Install dependencies
    print_status "Installing dependencies..."
    npm install --production

    # Build assets if needed
    if [ -f "webpack.config.js" ]; then
        print_status "Building assets..."
        npm run build
    fi

    print_success "Environment setup complete"
}

# Pre-deployment checks
pre_deployment_checks() {
    print_status "Running pre-deployment checks..."

    # Test server
    print_status "Testing server..."
    timeout 5 npm run server > /dev/null 2>&1
    if [ $? -eq 124 ]; then
        print_success "Server starts successfully"
    else
        print_error "Server failed to start"
        exit 1
    fi

    # Check for sensitive data
    print_status "Checking for sensitive data..."
    if grep -r "ELEVENLABS_API_KEY=" --include="*.js" --include="*.html" .; then
        print_warning "Found hardcoded API keys. Please use environment variables!"
    fi

    print_success "Pre-deployment checks passed"
}

# Post-deployment tasks
post_deployment() {
    print_status "Running post-deployment tasks..."

    # Test deployed endpoints
    read -p "Enter your deployment URL: " deploy_url

    print_status "Testing deployment..."
    if curl -s "$deploy_url/health" | grep -q "healthy"; then
        print_success "Deployment is healthy!"
    else
        print_warning "Could not verify deployment health"
    fi

    # Create monitoring
    print_status "Setting up monitoring..."
    cat > monitor.sh << 'EOF'
#!/bin/bash
URL=$1
while true; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL/health)
    if [ $STATUS -eq 200 ]; then
        echo "✅ $(date): Service is healthy"
    else
        echo "❌ $(date): Service is down (Status: $STATUS)"
    fi
    sleep 60
done
EOF
    chmod +x monitor.sh

    print_success "Monitoring script created: ./monitor.sh"
}

# Main execution
main() {
    echo ""
    print_status "Starting Restaurant Voice Agents Deployment"
    echo ""

    check_requirements
    setup_environment
    pre_deployment_checks

    main_menu

    post_deployment

    echo ""
    print_success "🎉 Deployment complete!"
    echo ""
    echo "Next steps:"
    echo "1. Test your agents at your deployment URL"
    echo "2. Configure custom domain"
    echo "3. Set up SSL certificate"
    echo "4. Enable analytics"
    echo "5. Start monitoring with: ./monitor.sh YOUR_URL"
    echo ""
}

# Run main function
main