#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { AgentManager } from './agents/AgentManager.js';
import { VoiceService } from './voice/VoiceService.js';
import { ScenarioManager } from './config/ScenarioManager.js';
import { displayLogo, displayAgentMenu } from './cli/display.js';

const program = new Command();
const agentManager = new AgentManager();
const voiceService = new VoiceService();
const scenarioManager = new ScenarioManager();

program
  .name('restaurant-agents')
  .description('ElevenLabs voice-first restaurant management team')
  .version('1.0.0');

program
  .command('start')
  .description('Start the restaurant voice agent system')
  .option('-s, --scenario <type>', 'Restaurant scenario type')
  .option('-a, --agent <name>', 'Start specific agent')
  .action(async (options) => {
    displayLogo();

    const spinner = ora('Initializing restaurant management system...').start();

    try {
      await agentManager.initialize();
      await voiceService.initialize();
      spinner.succeed('System initialized successfully!');

      if (options.scenario) {
        await scenarioManager.loadScenario(options.scenario);
      }

      if (options.agent) {
        await agentManager.startAgent(options.agent);
      } else {
        await displayAgentMenu();
      }
    } catch (error) {
      spinner.fail(`Failed to initialize: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available agents')
  .action(() => {
    console.log(chalk.cyan('\n🍽️  Restaurant Management Agents:\n'));
    agentManager.listAgents();
  });

program
  .command('deploy')
  .description('Deploy agents to a restaurant scenario')
  .option('-t, --type <type>', 'Restaurant type (fast-casual, fine-dining, cafe, etc.)')
  .option('-c, --capacity <number>', 'Restaurant capacity')
  .action(async (options) => {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'restaurantType',
        message: 'What type of restaurant?',
        choices: [
          'Fine Dining',
          'Fast Casual',
          'Cafe & Bakery',
          'Sports Bar',
          'Food Truck',
          'Catering Service'
        ],
        when: !options.type
      },
      {
        type: 'number',
        name: 'capacity',
        message: 'Restaurant capacity (number of seats):',
        default: 50,
        when: !options.capacity
      }
    ]);

    const config = {
      type: options.type || answers.restaurantType,
      capacity: options.capacity || answers.capacity
    };

    await scenarioManager.deployAgents(config);
  });

program
  .command('config')
  .description('Configure ElevenLabs API and agent settings')
  .action(async () => {
    await configureSystem();
  });

async function configureSystem() {
  console.log(chalk.yellow('\n⚙️  System Configuration\n'));

  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'elevenLabsApiKey',
      message: 'Enter your ElevenLabs API key:',
      mask: '*'
    },
    {
      type: 'list',
      name: 'defaultVoiceModel',
      message: 'Choose default voice model:',
      choices: [
        'eleven_multilingual_v2',
        'eleven_turbo_v2',
        'eleven_monolingual_v1'
      ]
    }
  ]);

  await voiceService.configure(answers);
  console.log(chalk.green('✅ Configuration saved successfully!'));
}

program.parse();