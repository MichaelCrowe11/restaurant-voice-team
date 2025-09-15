#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

const execAsync = promisify(exec);

// Load agent configurations
const loadAgentConfigs = async () => {
  const configPath = path.join(process.cwd(), 'convai-configs', 'all-agents.json');
  const data = await fs.readFile(configPath, 'utf8');
  return JSON.parse(data);
};

// Check if ConvAI CLI is available
const checkConvAICLI = async () => {
  try {
    await execAsync('npx convai --version');
    return true;
  } catch (error) {
    console.log(chalk.yellow('⚠️  ConvAI CLI not found. Installing...'));
    await execAsync('npm install -g @elevenlabs/convai-cli');
    return true;
  }
};

// Initialize ConvAI project
const initializeProject = async () => {
  const spinner = ora('Initializing ConvAI project...').start();

  try {
    // Check if already initialized
    await fs.access(path.join(process.cwd(), 'convai.json'));
    spinner.succeed('ConvAI project already initialized');
    return true;
  } catch (error) {
    // Not initialized, create it
    try {
      await execAsync('npx convai init --name restaurant-voice-agents --new');
      spinner.succeed('ConvAI project initialized');
      return true;
    } catch (initError) {
      spinner.fail('Failed to initialize ConvAI project');
      console.log(chalk.gray('Run manually: npx convai init'));
      return false;
    }
  }
};

// Deploy a single agent
const deployAgent = async (agent, settings) => {
  const spinner = ora(`Deploying ${agent.name}...`).start();

  try {
    // Create agent configuration file
    const config = {
      name: agent.name,
      prompt: agent.prompt,
      language: "en",
      llm: settings.llm,
      tts: {
        ...settings.tts,
        voice_id: agent.voice_id
      },
      conversation: settings.conversation
    };

    const configPath = path.join(process.cwd(), 'convai-configs', `${agent.id}.json`);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    // Add agent to ConvAI
    const { stdout } = await execAsync(
      `npx convai add agent "${agent.name}" --config "${configPath}"`
    );

    spinner.succeed(`✅ ${agent.name} deployed`);
    return true;

  } catch (error) {
    spinner.fail(`❌ Failed to deploy ${agent.name}: ${error.message}`);
    return false;
  }
};

// Main deployment function
const main = async () => {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║  🍽️   RESTAURANT VOICE AGENTS - AUTOMATED DEPLOYMENT                         ║
║                                                                               ║
║  Deploying 11 ML-powered agents to ElevenLabs ConvAI...                      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
  `));

  // Step 1: Check prerequisites
  console.log(chalk.yellow('\n📋 Checking prerequisites...\n'));

  const hasAPI = process.env.ELEVENLABS_API_KEY || await checkAPIKey();
  if (!hasAPI) {
    console.log(chalk.red('❌ ElevenLabs API key required'));
    console.log(chalk.gray('Get your key at: https://elevenlabs.io/settings'));
    return;
  }

  await checkConvAICLI();

  // Step 2: Initialize project
  const initialized = await initializeProject();
  if (!initialized) {
    console.log(chalk.yellow('⚠️  Please run: npx convai init'));
    return;
  }

  // Step 3: Load configurations
  const configs = await loadAgentConfigs();
  const { agents, default_settings } = configs;

  // Step 4: Select agents to deploy
  const { selectedAgents } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedAgents',
      message: 'Select agents to deploy:',
      choices: agents.map(a => ({
        name: `${a.name} - ${getPersonalityDescription(a.personality)}`,
        value: a,
        checked: true
      }))
    }
  ]);

  if (selectedAgents.length === 0) {
    console.log(chalk.yellow('No agents selected'));
    return;
  }

  // Step 5: Deploy agents
  console.log(chalk.cyan(`\n🚀 Deploying ${selectedAgents.length} agents...\n`));

  let successCount = 0;
  for (const agent of selectedAgents) {
    const success = await deployAgent(agent, default_settings);
    if (success) successCount++;
  }

  // Step 6: Sync to platform
  if (successCount > 0) {
    const spinner = ora('Syncing to ElevenLabs platform...').start();
    try {
      await execAsync('npx convai sync');
      spinner.succeed('✅ All agents synced to platform');
    } catch (error) {
      spinner.fail('❌ Sync failed - run manually: npx convai sync');
    }
  }

  // Step 7: Summary
  console.log(chalk.green(`\n🎉 Deployment complete!`));
  console.log(chalk.blue(`   Deployed: ${successCount}/${selectedAgents.length} agents`));

  if (successCount > 0) {
    console.log(chalk.yellow('\n📱 Test your agents:'));
    console.log(chalk.gray(`   npx convai test "${selectedAgents[0].name}"`));
    console.log(chalk.gray(`   npx convai widget "${selectedAgents[0].name}"`));

    console.log(chalk.yellow('\n🌐 View dashboard:'));
    console.log(chalk.gray('   https://elevenlabs.io/conversational-ai'));
  }
};

// Helper function to check API key
const checkAPIKey = async () => {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = await fs.readFile(envPath, 'utf8');
    return envContent.includes('ELEVENLABS_API_KEY');
  } catch (error) {
    const { saveKey } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveKey',
        message: 'Would you like to add your ElevenLabs API key now?',
        default: true
      }
    ]);

    if (saveKey) {
      const { apiKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter your ElevenLabs API key:',
          mask: '*'
        }
      ]);

      await fs.writeFile('.env', `ELEVENLABS_API_KEY=${apiKey}\n`);
      process.env.ELEVENLABS_API_KEY = apiKey;
      return true;
    }

    return false;
  }
};

// Get personality description
const getPersonalityDescription = (personality) => {
  const traits = [];
  if (personality.openness >= 8) traits.push('Creative');
  if (personality.conscientiousness >= 8) traits.push('Organized');
  if (personality.extraversion >= 8) traits.push('Outgoing');
  if (personality.agreeableness >= 8) traits.push('Friendly');
  if (personality.neuroticism <= 3) traits.push('Calm');
  return traits.join(', ');
};

// Run the deployment
main().catch(error => {
  console.error(chalk.red('❌ Deployment failed:'), error.message);
  process.exit(1);
});