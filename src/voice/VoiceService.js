import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import chalk from 'chalk';

export class VoiceService extends EventEmitter {
  constructor() {
    super();
    this.apiKey = null;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.defaultModel = 'eleven_turbo_v2';
    this.voicesCache = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await this.loadConfig();
      await this.validateApiKey();
      await this.loadVoices();
      this.isInitialized = true;
      console.log(chalk.green('🎤 ElevenLabs voice service initialized successfully'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Voice service initialization failed. Run "restaurant-agents config" to set up ElevenLabs API.'));
      console.log(chalk.gray(`Error: ${error.message}`));
    }
  }

  async loadConfig() {
    try {
      const configPath = path.join(process.cwd(), '.env');
      const config = await fs.readFile(configPath, 'utf8');

      const lines = config.split('\n');
      for (const line of lines) {
        if (line.startsWith('ELEVENLABS_API_KEY=')) {
          this.apiKey = line.split('=')[1].trim();
          break;
        }
      }

      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not found in .env file');
      }
    } catch (error) {
      throw new Error('Configuration not found. Please run "restaurant-agents config" first.');
    }
  }

  async configure(config) {
    this.apiKey = config.elevenLabsApiKey;
    this.defaultModel = config.defaultVoiceModel;

    // Save to .env file
    const envContent = `ELEVENLABS_API_KEY=${this.apiKey}\nDEFAULT_VOICE_MODEL=${this.defaultModel}\n`;
    await fs.writeFile(path.join(process.cwd(), '.env'), envContent);

    await this.initialize();
  }

  async validateApiKey() {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      console.log(chalk.blue(`✅ API key validated for user: ${response.data.subscription.tier}`));
    } catch (error) {
      throw new Error(`Invalid API key: ${error.response?.data?.detail || error.message}`);
    }
  }

  async loadVoices() {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      for (const voice of response.data.voices) {
        this.voicesCache.set(voice.voice_id, voice);
      }

      console.log(chalk.blue(`📚 Loaded ${this.voicesCache.size} available voices`));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not load voices from ElevenLabs'));
    }
  }

  async synthesizeSpeech(text, voiceConfig) {
    if (!this.isInitialized) {
      console.log(chalk.yellow('🔇 Voice service not initialized. Text output only.'));
      console.log(chalk.cyan(`🎤 ${voiceConfig.accent || 'Default'}: "${text}"`));
      return null;
    }

    try {
      const voiceId = await this.getOrCreateVoice(voiceConfig);

      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: voiceConfig.model || this.defaultModel,
          voice_settings: {
            stability: voiceConfig.stability || 0.8,
            similarity_boost: voiceConfig.clarity || 0.8,
            style: voiceConfig.style || 0.5,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      // In a real implementation, you would play this audio
      // For now, we'll save it to a temp file and log success
      const audioBuffer = Buffer.from(response.data);
      const filename = `voice_${Date.now()}.mp3`;
      const audioPath = path.join(process.cwd(), 'temp', filename);

      // Create temp directory if it doesn't exist
      await fs.mkdir(path.join(process.cwd(), 'temp'), { recursive: true });
      await fs.writeFile(audioPath, audioBuffer);

      console.log(chalk.green(`🎵 Audio generated: ${audioPath}`));
      console.log(chalk.cyan(`🎤 ${voiceConfig.accent || 'Default'}: "${text}"`));

      this.emit('speechGenerated', {
        text,
        audioPath,
        voiceConfig
      });

      return audioPath;
    } catch (error) {
      console.log(chalk.red(`❌ Speech synthesis failed: ${error.message}`));
      console.log(chalk.cyan(`🎤 ${voiceConfig.accent || 'Default'}: "${text}"`));
      return null;
    }
  }

  async getOrCreateVoice(voiceConfig) {
    // For demo purposes, we'll use a default voice
    // In production, you could create custom voices for each agent
    const defaultVoices = {
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

    const accent = voiceConfig.accent || 'American-Professional';
    return defaultVoices[accent] || defaultVoices['American-Professional'];
  }

  async createCustomVoice(agentId, voiceConfig) {
    // This would be used to create custom voices for each agent
    // Requires voice samples and is a premium feature
    console.log(chalk.blue(`🎭 Custom voice creation for ${agentId} (premium feature)`));
    return voiceConfig.voiceId;
  }

  async getVoicesList() {
    return Array.from(this.voicesCache.values());
  }

  async testVoice(voiceId, testText = "Hello, this is a voice test for the restaurant management system.") {
    const testConfig = {
      voiceId: voiceId,
      model: this.defaultModel,
      stability: 0.8,
      clarity: 0.8,
      style: 0.5
    };

    return await this.synthesizeSpeech(testText, testConfig);
  }

  isReady() {
    return this.isInitialized && this.apiKey !== null;
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      hasApiKey: this.apiKey !== null,
      voicesLoaded: this.voicesCache.size,
      defaultModel: this.defaultModel
    };
  }
}