# 🚀 Live Deployment Guide - Restaurant Voice Agents

Follow these steps to deploy your ML-powered restaurant voice agents to ElevenLabs ConvAI.

## 📋 Prerequisites

### 1. Get Your ElevenLabs API Key
1. Go to https://elevenlabs.io/
2. Sign up for an account (free tier available)
3. Navigate to Profile Settings → API Keys
4. Generate and copy your API key

## 🔧 Step-by-Step Deployment

### Step 1: Configure API Key
```bash
cd restaurant-voice-agents

# Run the setup script
node test-setup.js
# Enter your ElevenLabs API key when prompted
```

### Step 2: Authenticate with ConvAI
```bash
# Login to ConvAI (opens browser for authentication)
npx convai login
```

### Step 3: Initialize ConvAI Project
```bash
# Create a new ConvAI project in the current directory
npx convai init

# When prompted:
# - Project name: restaurant-voice-agents
# - Select: New project
# - Language: English
```

### Step 4: Create Your First Agent (Chef Sophia)
```bash
# Add Chef Sophia with Italian personality
npx convai add agent "Chef Sophia" --template assistant

# This creates a basic agent that we'll enhance
```

### Step 5: Configure Agent with ML Personality
Create a file `convai-configs/chef-sophia.json`:

```json
{
  "name": "Chef Sophia Romano",
  "prompt": "You are Chef Sophia Romano, a passionate Italian-American head chef with 15 years of culinary excellence. Your personality traits: Openness (8/10), Conscientiousness (9/10), Extraversion (6/10). You speak with Italian expressions like 'Bellissimo!' and 'Perfetto!' You are passionate about quality ingredients, traditional techniques, and creating memorable dining experiences. Always stay in character as a proud Italian chef who treats every dish as a work of art.",
  "language": "en",
  "llm": {
    "model": "gpt-4",
    "temperature": 0.7
  },
  "tts": {
    "voice_id": "EXAVITQu4vr4xnSDxMaL",
    "model": "eleven_turbo_v2",
    "stability": 0.8,
    "similarity_boost": 0.9,
    "style": 0.7
  },
  "conversation": {
    "max_duration": 3600,
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "silence_duration_ms": 800
    }
  }
}
```

### Step 6: Apply Configuration
```bash
# Update the agent with our ML-enhanced configuration
npx convai update agent "Chef Sophia" --config convai-configs/chef-sophia.json
```

### Step 7: Deploy to Production
```bash
# Sync all agents to ElevenLabs platform
npx convai sync

# This deploys your agents and makes them available for voice interactions
```

### Step 8: Test Voice Interaction
```bash
# Start a test conversation
npx convai test "Chef Sophia"

# Or open the web widget
npx convai widget "Chef Sophia"
```

## 🎤 Testing Your Agents

### Quick Test Commands
```bash
# Test Chef Sophia
npx convai test "Chef Sophia" --message "What's your signature dish?"

# Test Marcus (Front Manager)
npx convai test "Marcus Washington" --message "How do you handle difficult customers?"

# Test Isabella (Sommelier)
npx convai test "Isabella Dubois" --message "What wine pairs with seafood?"
```

### Expected Responses

**Chef Sophia** should respond with:
- Italian expressions and passion
- Detailed culinary knowledge
- Strong opinions about ingredients
- Stories about Italian cooking traditions

**Marcus** should demonstrate:
- Professional customer service
- Diplomatic problem-solving
- Team leadership qualities
- Motivational communication

**Isabella** should exhibit:
- French sophistication
- Deep wine knowledge
- Educational approach
- Elegant vocabulary

## 🔥 Quick Deploy All 11 Agents

### Automated Deployment Script
Create `deploy-all.sh`:

```bash
#!/bin/bash

# Array of agent names
agents=(
  "Chef Sophia Romano"
  "Marcus Washington"
  "Isabella Dubois"
  "Diego Rodriguez"
  "Amara Johnson"
  "Chen Wei"
  "Raj Patel"
  "Luna Martinez"
  "Victor Stone"
  "Zara Thompson"
  "Oliver Kim"
)

# Create each agent
for agent in "${agents[@]}"; do
  echo "Creating agent: $agent"
  npx convai add agent "$agent" --template assistant
done

# Deploy all
npx convai sync

echo "✅ All 11 agents deployed!"
```

Run it:
```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

## 📊 Monitor Your Agents

### Check Deployment Status
```bash
# List all deployed agents
npx convai list agents

# Get agent details
npx convai get agent "Chef Sophia"

# View conversation logs
npx convai logs "Chef Sophia" --limit 10
```

### Analytics Dashboard
1. Go to https://elevenlabs.io/conversational-ai
2. Sign in with your account
3. View real-time agent metrics:
   - Active conversations
   - Response times
   - User satisfaction
   - Usage statistics

## 🎯 Live Demo Scenarios

### Scenario 1: Dinner Rush
```javascript
// Test multiple agents handling dinner service
npx convai test "Chef Sophia" --message "We have 20 orders backed up!"
npx convai test "Diego Rodriguez" --message "Table 5 is waiting 30 minutes!"
npx convai test "Marcus Washington" --message "Customer complaint at table 8"
```

### Scenario 2: Wine Pairing Event
```javascript
// Test sommelier and chef collaboration
npx convai test "Isabella Dubois" --message "Suggest wines for a 7-course tasting"
npx convai test "Chef Sophia" --message "Create dishes to pair with Bordeaux"
```

### Scenario 3: New Staff Training
```javascript
// Test training specialist
npx convai test "Zara Thompson" --message "How do I train a new server?"
npx convai test "Marcus Washington" --message "What's our service standard?"
```

## 🛠️ Troubleshooting

### Common Issues

**"API key invalid"**
- Verify key at https://elevenlabs.io/settings
- Ensure no extra spaces in .env file

**"Voice not found"**
- Use `npx convai voices list` to see available voices
- Update voice_id in configuration

**"Agent not responding"**
- Check `npx convai status`
- Verify internet connection
- Review agent logs: `npx convai logs [agent-name]`

## 🎉 Success Checklist

- [ ] ElevenLabs account created
- [ ] API key configured in .env
- [ ] ConvAI CLI authenticated
- [ ] First agent (Chef Sophia) created
- [ ] Agent deployed with `convai sync`
- [ ] Voice interaction tested
- [ ] All 11 agents deployed
- [ ] Live demo completed

## 📞 Next Steps

1. **Share Your Demo**: Record agent conversations
2. **Customize Voices**: Fine-tune voice parameters
3. **Add Memory**: Implement conversation history
4. **Restaurant Integration**: Connect to POS systems
5. **Analytics**: Track performance metrics

## 🆘 Support

- **ElevenLabs Docs**: https://elevenlabs.io/docs
- **ConvAI Guide**: https://elevenlabs.io/docs/conversational-ai
- **GitHub Issues**: https://github.com/MichaelCrowe11/restaurant-voice-team/issues

---

**You're ready to bring your restaurant voice agents to life!** 🎭🍽️