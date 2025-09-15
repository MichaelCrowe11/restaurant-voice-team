# 🍽️ Restaurant Voice Agents

An ElevenLabs-powered voice-first restaurant management team with unique personalities and specialized abilities. Deploy AI agents that excel at all aspects of restaurant operations through intelligent voice interactions.

## ✨ Features

- **11 Unique Voice Agents** with distinct personalities and specialties
- **ElevenLabs Integration** for realistic voice synthesis
- **CLI-Based Deployment** for easy setup and management
- **Restaurant Scenario Templates** for different business types
- **Real-time Voice Interactions** and task coordination
- **Customizable Agent Configurations** for any restaurant environment

## 🤖 Meet Your Restaurant Team

### Kitchen Operations
- **🍳 Chef Sophia Romano** - Head Chef with Italian passion and culinary excellence
- **⚡ Diego "Lightning" Rodriguez** - Kitchen Expediter for perfect timing and coordination
- **🧁 Chen Wei** - Pastry Chef specializing in desserts and dietary accommodations

### Front of House
- **🎯 Marcus Washington** - Front Manager with exceptional customer service
- **👋 Amara Johnson** - Guest Relations Host creating memorable first impressions
- **🍷 Isabella Dubois** - Master Sommelier with wine expertise

### Support & Operations
- **💰 Raj Patel** - Financial Controller for cost optimization
- **📱 Luna Martinez** - Marketing Coordinator for brand engagement
- **🛡️ Victor Stone** - Security Manager ensuring safety protocols
- **📚 Zara Thompson** - Training Specialist for staff development
- **💻 Oliver Kim** - Tech Support for digital solutions

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/restaurant-voice-agents.git
cd restaurant-voice-agents

# Install dependencies
npm install

# Make CLI globally available
npm link
```

### Configuration

```bash
# Configure ElevenLabs API
restaurant-agents config
```

Enter your ElevenLabs API key and select voice preferences.

### Launch Your Team

```bash
# Start the voice agent system
restaurant-agents start

# Deploy to a specific restaurant type
restaurant-agents deploy --type "Fine Dining" --capacity 80

# List all available agents
restaurant-agents list
```

## 📋 Restaurant Scenarios

Choose from pre-configured scenarios or create custom deployments:

- **Fine Dining Restaurant** - Premium service with sommelier and pastry chef
- **Fast Casual** - Efficient operations focused on speed and value
- **Cafe & Bakery** - Cozy atmosphere with fresh baked goods
- **Sports Bar & Grill** - Lively environment with entertainment focus
- **Mobile Food Truck** - Compact team for mobile operations
- **Catering Service** - Event-focused with logistics coordination

## 🎛️ CLI Commands

```bash
# Start the system
restaurant-agents start [options]
  -s, --scenario <type>    Load specific scenario
  -a, --agent <name>       Start specific agent

# Deploy agents
restaurant-agents deploy [options]
  -t, --type <type>        Restaurant type
  -c, --capacity <number>  Restaurant capacity

# Configuration
restaurant-agents config   # Set up ElevenLabs API

# Information
restaurant-agents list     # List all agents
restaurant-agents --help   # Show help
```

## 🎭 Agent Personalities

Each agent has a unique personality with:

- **Distinct Voice Characteristics** - Accents, speaking styles, and mannerisms
- **Specialized Knowledge** - Domain expertise in their restaurant function
- **Response Patterns** - Contextual reactions to different situations
- **Working Hours** - Realistic availability schedules
- **Skill Sets** - Specific capabilities and problem-solving approaches

## 🔧 Customization

### Custom Scenarios

Create custom restaurant scenarios by adding JSON files to the `scenarios/` directory:

```json
{
  "id": "my-restaurant",
  "name": "My Custom Restaurant",
  "description": "Unique dining experience",
  "capacity": 100,
  "serviceStyle": "full-service",
  "agentConfiguration": {
    "required": ["sophia", "marcus", "amara"],
    "optional": ["isabella", "chen"],
    "priorities": ["quality", "service"]
  }
}
```

### Voice Customization

Modify agent voice characteristics in `src/agents/definitions.js`:

```javascript
voiceConfig: {
  voiceId: 'custom_voice_id',
  model: 'eleven_turbo_v2',
  stability: 0.8,
  clarity: 0.9,
  style: 0.7,
  accent: 'Custom-Accent'
}
```

## 🔐 Environment Variables

Create a `.env` file in your project root:

```env
ELEVENLABS_API_KEY=your_api_key_here
DEFAULT_VOICE_MODEL=eleven_turbo_v2
```

## 📁 Project Structure

```
restaurant-voice-agents/
├── src/
│   ├── agents/           # Agent definitions and management
│   ├── cli/              # Command-line interface
│   ├── config/           # Scenario and configuration management
│   ├── voice/            # ElevenLabs integration
│   └── utils/            # Utility functions
├── scenarios/            # Restaurant scenario templates
├── docs/                 # Documentation
└── tests/               # Test files
```

## 🎯 Use Cases

- **Training New Staff** - Agents demonstrate proper procedures
- **Customer Service** - Handle inquiries and complaints professionally
- **Operational Coordination** - Sync kitchen and front-of-house activities
- **Quality Assurance** - Monitor and maintain service standards
- **Crisis Management** - Respond to incidents with appropriate protocols
- **Menu Development** - Collaborate on new dishes and pricing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@restaurant-voice-agents.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/restaurant-voice-agents/issues)
- 📖 Docs: [Full Documentation](docs/)

## 🙏 Acknowledgments

- [ElevenLabs](https://elevenlabs.io/) for powerful voice synthesis
- Restaurant industry professionals for insights and feedback
- Open source community for tools and inspiration

---

**Transform your restaurant operations with AI-powered voice agents!** 🚀