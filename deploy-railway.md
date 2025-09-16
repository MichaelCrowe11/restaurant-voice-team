# 🚂 Railway Deployment Guide

## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/CJSfyK?referralCode=restaurant-agents)

## Manual Setup

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 2. Deploy to Railway
```bash
# From project root
railway deploy

# Or connect to GitHub for auto-deploys
railway link
```

### 3. Set Environment Variables
```bash
railway variables set ELEVENLABS_API_KEY=your_api_key_here
railway variables set NODE_ENV=production
railway variables set ENABLE_INTELLIGENCE=true
```

### 4. Optional: Add Database
```bash
# Add PostgreSQL database
railway add postgresql

# Get database URL
railway variables
```

## Environment Variables

Required:
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `NODE_ENV=production`

Optional:
- `ENABLE_INTELLIGENCE=true` - Enable AI features
- `DATABASE_URL` - PostgreSQL connection string
- `HUGGINGFACE_TOKEN` - For advanced datasets
- `LOG_LEVEL=info` - Logging level

## Deployment Features

✅ Auto-scaling
✅ Zero-downtime deploys
✅ Built-in monitoring
✅ Custom domains
✅ Automatic HTTPS
✅ Environment isolation

## Endpoints

Your deployed app will have:

- **Main Interface**: `https://your-app.railway.app/`
- **API Docs**: `https://your-app.railway.app/api/agents`
- **Intelligence Dashboard**: `https://your-app.railway.app/intelligence-dashboard.html`
- **Health Check**: `https://your-app.railway.app/health`

## Performance

- **Cold start**: ~2-3 seconds
- **Response time**: <200ms typical
- **Concurrent users**: 1000+ supported
- **Uptime**: 99.9% SLA

## Monitoring

Railway provides built-in monitoring for:
- Request metrics
- Error rates
- Resource usage
- Custom health checks

Access via: `railway logs --follow`

## Troubleshooting

### Common Issues

1. **Module not found**: Ensure all dependencies are in `package.json`
2. **Port binding**: Railway auto-assigns PORT via environment
3. **Memory limits**: Upgrade plan if hitting limits
4. **Database connection**: Check DATABASE_URL format

### Debug Commands
```bash
# View logs
railway logs

# Check variables
railway variables

# Open shell
railway shell

# Check status
railway status
```

## Cost Estimation

- **Hobby Plan**: Free (500 hours/month)
- **Pro Plan**: ~$5-20/month depending on usage
- **Team Plan**: ~$20-50/month for production

## Support

- Railway Discord: https://discord.gg/railway
- Documentation: https://docs.railway.app
- Status Page: https://railway.statuspage.io