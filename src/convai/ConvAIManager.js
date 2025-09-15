import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export class ConvAIManager extends EventEmitter {
  constructor() {
    super();
    this.projectPath = path.join(process.cwd(), 'convai-agents');
    this.agentConfigs = new Map();
    this.deployedAgents = new Map();
    this.isAuthenticated = false;
  }

  async initialize() {
    console.log(chalk.blue('🤖 Initializing ConvAI Manager...'));

    // Check if ConvAI CLI is installed
    await this.checkCLIInstallation();

    // Initialize ConvAI project
    await this.initializeProject();

    // Authenticate with ElevenLabs
    await this.authenticate();

    console.log(chalk.green('✅ ConvAI Manager ready'));
  }

  async checkCLIInstallation() {
    try {
      const { stdout } = await execAsync('convai --version');
      console.log(chalk.green(`✅ ConvAI CLI found: ${stdout.trim()}`));
    } catch (error) {
      console.log(chalk.yellow('⚠️  ConvAI CLI not found. Installing...'));
      await this.installCLI();
    }
  }

  async installCLI() {
    try {
      await execAsync('npm install -g @elevenlabs/convai-cli');
      console.log(chalk.green('✅ ConvAI CLI installed successfully'));
    } catch (error) {
      throw new Error(`Failed to install ConvAI CLI: ${error.message}`);
    }
  }

  async initializeProject() {
    try {
      // Create project directory if it doesn't exist
      await fs.mkdir(this.projectPath, { recursive: true });

      // Check if already initialized
      const configPath = path.join(this.projectPath, 'convai.json');
      try {
        await fs.access(configPath);
        console.log(chalk.blue('📂 ConvAI project already initialized'));
        return;
      } catch (error) {
        // Project not initialized, create it
      }

      // Initialize ConvAI project
      process.chdir(this.projectPath);
      await execAsync('convai init');
      console.log(chalk.green('✅ ConvAI project initialized'));

    } catch (error) {
      console.log(chalk.yellow(`⚠️  Project initialization: ${error.message}`));
    }
  }

  async authenticate() {
    try {
      // Check if already authenticated
      const { stdout } = await execAsync('convai auth status', { cwd: this.projectPath });
      if (stdout.includes('authenticated')) {
        this.isAuthenticated = true;
        console.log(chalk.green('✅ Already authenticated with ElevenLabs'));
        return;
      }
    } catch (error) {
      // Not authenticated, need to login
    }

    console.log(chalk.yellow('🔐 Please authenticate with ElevenLabs...'));
    console.log(chalk.cyan('Run: convai login'));
    console.log(chalk.gray('This will open a browser window for authentication'));
  }

  async createAgent(enrichedAgent) {
    console.log(chalk.cyan(`🎭 Creating ConvAI agent: ${enrichedAgent.name}`));

    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with ElevenLabs. Run "convai login" first.');
    }

    // Generate ConvAI agent configuration
    const agentConfig = await this.generateAgentConfig(enrichedAgent);

    // Save configuration to file
    const configPath = await this.saveAgentConfig(enrichedAgent.id, agentConfig);

    // Create agent using ConvAI CLI
    try {
      const agentName = `${enrichedAgent.name.replace(/\s+/g, '-').toLowerCase()}`;
      const command = `convai add agent "${agentName}" --config "${configPath}"`;

      const { stdout, stderr } = await execAsync(command, { cwd: this.projectPath });

      if (stderr && !stderr.includes('warning')) {
        throw new Error(stderr);
      }

      console.log(chalk.green(`✅ Agent created: ${agentName}`));
      this.deployedAgents.set(enrichedAgent.id, {
        name: agentName,
        config: agentConfig,
        deployedAt: new Date()
      });

      return agentName;

    } catch (error) {
      console.log(chalk.red(`❌ Failed to create agent: ${error.message}`));
      throw error;
    }
  }

  async generateAgentConfig(enrichedAgent) {
    const config = {
      name: enrichedAgent.name,
      prompt: this.generateSystemPrompt(enrichedAgent),
      language: "en",
      llm: {
        model: "gpt-4",
        temperature: this.calculateTemperature(enrichedAgent)
      },
      tts: {
        voice_id: await this.selectVoiceId(enrichedAgent),
        model: enrichedAgent.voiceConfig?.model || "eleven_turbo_v2",
        stability: enrichedAgent.voiceConfig?.stability || 0.8,
        similarity_boost: enrichedAgent.voiceConfig?.clarity || 0.8,
        style: enrichedAgent.voiceConfig?.style || 0.7
      },
      conversation: {
        max_duration: 3600, // 1 hour
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800
        }
      },
      tools: await this.generateTools(enrichedAgent),
      evaluation: {
        criteria: this.generateEvaluationCriteria(enrichedAgent)
      },
      widget: {
        variant: "default",
        styling: this.generateWidgetStyling(enrichedAgent)
      }
    };

    return config;
  }

  generateSystemPrompt(enrichedAgent) {
    const prompt = `You are ${enrichedAgent.name}, a ${enrichedAgent.role} at a restaurant.

PERSONALITY:
${this.formatPersonalityPrompt(enrichedAgent)}

ROLE & RESPONSIBILITIES:
${enrichedAgent.specialties.map(s => `- ${s}`).join('\n')}

KNOWLEDGE AREAS:
${enrichedAgent.domainKnowledge ? Object.keys(enrichedAgent.domainKnowledge).map(k => `- ${k.replace('_', ' ')}`).join('\n') : ''}

COMMUNICATION STYLE:
${this.formatCommunicationStyle(enrichedAgent)}

INDUSTRY TRAITS:
${this.formatIndustryTraits(enrichedAgent)}

WORKING HOURS: ${enrichedAgent.workingHours.start}:00 - ${enrichedAgent.workingHours.end}:00

Always stay in character and respond as ${enrichedAgent.name} would, using your personality traits, communication style, and professional expertise. Provide helpful, accurate information while maintaining the warmth and professionalism expected in a restaurant environment.`;

    return prompt;
  }

  formatPersonalityPrompt(enrichedAgent) {
    const traits = enrichedAgent.personality.traits.join(', ');
    const bigFive = enrichedAgent.personality.bigFive;

    let personalityText = `Core Traits: ${traits}\n`;

    if (bigFive) {
      personalityText += `Big Five Personality Profile:\n`;
      personalityText += `- Openness: ${bigFive.openness}/10 (${this.getTraitLevel(bigFive.openness)})\n`;
      personalityText += `- Conscientiousness: ${bigFive.conscientiousness}/10 (${this.getTraitLevel(bigFive.conscientiousness)})\n`;
      personalityText += `- Extraversion: ${bigFive.extraversion}/10 (${this.getTraitLevel(bigFive.extraversion)})\n`;
      personalityText += `- Agreeableness: ${bigFive.agreeableness}/10 (${this.getTraitLevel(bigFive.agreeableness)})\n`;
      personalityText += `- Neuroticism: ${bigFive.neuroticism}/10 (${this.getTraitLevel(bigFive.neuroticism)})\n`;
    }

    if (enrichedAgent.personality.quirks) {
      personalityText += `Quirks: ${enrichedAgent.personality.quirks.join(', ')}`;
    }

    return personalityText;
  }

  getTraitLevel(score) {
    if (score >= 7) return 'High';
    if (score >= 4) return 'Moderate';
    return 'Low';
  }

  formatCommunicationStyle(enrichedAgent) {
    const style = enrichedAgent.personality.responseStyle;
    let communicationText = '';

    if (style) {
      communicationText += `Response Patterns:\n`;
      communicationText += `- Questions: "${style.question}"\n`;
      communicationText += `- Requests: "${style.request}"\n`;
      communicationText += `- Complaints: "${style.complaint}"\n`;
      communicationText += `- General: "${style.general}"\n`;
    }

    if (enrichedAgent.conversationalPatterns) {
      communicationText += `\nGreeting Styles: ${enrichedAgent.conversationalPatterns.greetingStyles?.join(', ') || 'Professional and warm'}`;
    }

    return communicationText;
  }

  formatIndustryTraits(enrichedAgent) {
    if (!enrichedAgent.industryTraits) return 'Professional excellence and customer service focus';

    return `Service Philosophy: ${enrichedAgent.industryTraits.servicePhilosophy}
Work Ethic: ${enrichedAgent.industryTraits.workEthic?.dedication || 'Dedicated to excellence'}
Customer Approach: ${enrichedAgent.industryTraits.customerApproach?.attentiveness || 'Attentive and proactive'}`;
  }

  calculateTemperature(enrichedAgent) {
    const creativity = enrichedAgent.personality.bigFive?.openness || 5;
    const consistency = enrichedAgent.personality.bigFive?.conscientiousness || 5;

    // Higher creativity = higher temperature, higher consistency = lower temperature
    const temperature = (creativity / 10) * 0.7 - (consistency / 10) * 0.2 + 0.3;
    return Math.max(0.1, Math.min(0.9, temperature));
  }

  async selectVoiceId(enrichedAgent) {
    // Map accents to ElevenLabs voice IDs (these would be actual voice IDs in production)
    const voiceMap = {
      'Italian-American': 'EXAVITQu4vr4xnSDxMaL', // Bella
      'American-Professional': 'pNInz6obpgDQGcFmaJgB', // Adam
      'French': 'ThT5KcBeYPX3keUQqHPh', // Dorothy
      'Mexican-American': 'IKne3meq5aSn9XLyUdCD', // Charlie
      'American-Southern': 'jsCqWAovK2LkecY7zXl4', // Freya
      'Chinese-American': 'N2lVS1w4EtoT3dr4eOWO', // Callum
      'Indian-British': 'oWAxZDx7w5VEj9dCyTzz', // Grace
      'American-Millennial': 'cgSgspJ2msm6clMCkdW9', // Jessica
      'American-Military': 'bVMeCyTHy58xNoL34h3p', // Jeremy
      'Korean-American': 'flq6f7yk4E4fJM5XTYuZ'  // Michael
    };

    const accent = enrichedAgent.voiceConfig?.accent || 'American-Professional';
    return voiceMap[accent] || voiceMap['American-Professional'];
  }

  async generateTools(enrichedAgent) {
    const tools = [];

    // Add role-specific tools
    if (enrichedAgent.role === 'Head Chef') {
      tools.push({
        name: "check_inventory",
        description: "Check current kitchen inventory levels",
        webhook: {
          url: "https://your-api.com/inventory/check",
          method: "GET"
        }
      });

      tools.push({
        name: "modify_menu",
        description: "Modify menu items based on availability",
        webhook: {
          url: "https://your-api.com/menu/modify",
          method: "POST"
        }
      });
    }

    if (enrichedAgent.role === 'Front of House Manager') {
      tools.push({
        name: "check_reservations",
        description: "Check current reservation status",
        webhook: {
          url: "https://your-api.com/reservations/check",
          method: "GET"
        }
      });

      tools.push({
        name: "manage_waitlist",
        description: "Manage restaurant waitlist",
        webhook: {
          url: "https://your-api.com/waitlist/manage",
          method: "POST"
        }
      });
    }

    if (enrichedAgent.role === 'Master Sommelier') {
      tools.push({
        name: "wine_pairing",
        description: "Get wine pairing recommendations",
        webhook: {
          url: "https://your-api.com/wine/pairing",
          method: "POST"
        }
      });
    }

    return tools;
  }

  generateEvaluationCriteria(enrichedAgent) {
    const criteria = [
      "Maintains character consistency",
      "Provides accurate information",
      "Uses appropriate communication style",
      "Demonstrates role-specific expertise"
    ];

    if (enrichedAgent.role.includes('Manager')) {
      criteria.push("Shows leadership and problem-solving skills");
    }

    if (enrichedAgent.role.includes('Chef')) {
      criteria.push("Demonstrates culinary knowledge and passion");
    }

    return criteria;
  }

  generateWidgetStyling(enrichedAgent) {
    // Generate styling based on agent personality
    const colorMap = {
      'Head Chef': { primary: '#D32F2F', secondary: '#FFEB3B' }, // Red & Yellow
      'Master Sommelier': { primary: '#7B1FA2', secondary: '#FFD700' }, // Purple & Gold
      'Guest Relations Host': { primary: '#1976D2', secondary: '#FFC107' }, // Blue & Amber
      'Financial Controller': { primary: '#388E3C', secondary: '#E0E0E0' } // Green & Gray
    };

    const colors = colorMap[enrichedAgent.role] || { primary: '#2196F3', secondary: '#FFF' };

    return {
      colors: colors,
      avatar: {
        type: "initials",
        initials: enrichedAgent.name.split(' ').map(n => n[0]).join('').substring(0, 2)
      }
    };
  }

  async saveAgentConfig(agentId, config) {
    const filename = `${agentId}-config.json`;
    const configPath = path.join(this.projectPath, 'configs', filename);

    // Ensure configs directory exists
    await fs.mkdir(path.join(this.projectPath, 'configs'), { recursive: true });

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    this.agentConfigs.set(agentId, config);

    return configPath;
  }

  async deployAgent(agentId) {
    console.log(chalk.cyan(`🚀 Deploying agent: ${agentId}`));

    try {
      await execAsync('convai sync', { cwd: this.projectPath });
      console.log(chalk.green(`✅ Agent deployed successfully`));

      this.emit('agentDeployed', { agentId, timestamp: new Date() });

    } catch (error) {
      console.log(chalk.red(`❌ Deployment failed: ${error.message}`));
      throw error;
    }
  }

  async listAgents() {
    try {
      const { stdout } = await execAsync('convai list agents', { cwd: this.projectPath });
      return stdout;
    } catch (error) {
      console.log(chalk.red(`❌ Failed to list agents: ${error.message}`));
      return null;
    }
  }

  async deleteAgent(agentId) {
    const deployedAgent = this.deployedAgents.get(agentId);
    if (!deployedAgent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    try {
      await execAsync(`convai remove agent "${deployedAgent.name}"`, { cwd: this.projectPath });
      this.deployedAgents.delete(agentId);
      console.log(chalk.green(`✅ Agent deleted: ${deployedAgent.name}`));
    } catch (error) {
      console.log(chalk.red(`❌ Failed to delete agent: ${error.message}`));
      throw error;
    }
  }

  async testAgent(agentId, testMessage) {
    const deployedAgent = this.deployedAgents.get(agentId);
    if (!deployedAgent) {
      throw new Error(`Agent ${agentId} not deployed`);
    }

    console.log(chalk.blue(`🧪 Testing agent: ${deployedAgent.name}`));
    console.log(chalk.gray(`Test message: "${testMessage}"`));

    // In a real implementation, this would interact with the deployed agent
    console.log(chalk.yellow('⚠️  Agent testing requires deployed ConvAI agents'));
    return { message: 'Test requires live ConvAI deployment' };
  }

  getDeploymentStatus() {
    return {
      authenticated: this.isAuthenticated,
      projectPath: this.projectPath,
      deployedAgents: this.deployedAgents.size,
      agentConfigs: this.agentConfigs.size
    };
  }
}