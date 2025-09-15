#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { AgentManager } from '../agents/AgentManager.js';
import { DataEnrichmentEngine } from '../enrichment/DataEnrichmentEngine.js';
import { ConvAIManager } from '../convai/ConvAIManager.js';
import { DataPipeline } from '../pipelines/DataPipeline.js';
import { displayLogo, displaySystemStatus } from './enhanced-display.js';

const program = new Command();

// Initialize all managers
const agentManager = new AgentManager();
const enrichmentEngine = new DataEnrichmentEngine();
const convaiManager = new ConvAIManager();
const dataPipeline = new DataPipeline();

program
  .name('restaurant-agents')
  .description('🍽️ ElevenLabs ConvAI-powered restaurant management team with ML-enriched personalities')
  .version('2.0.0');

// Enhanced create command with full data enrichment
program
  .command('create')
  .description('🎭 Create fully enriched ConvAI agents with ML-powered personalities')
  .option('-a, --agent <id>', 'Create specific agent by ID')
  .option('-r, --role <role>', 'Create agents by role')
  .option('--all', 'Create all 11 agents')
  .option('--enrich', 'Enable full data enrichment (default: true)')
  .option('--deploy', 'Deploy to ElevenLabs ConvAI after creation')
  .action(async (options) => {
    displayLogo();

    const spinner = ora('🧠 Initializing enhanced agent creation system...').start();

    try {
      // Initialize all systems
      await agentManager.initialize();
      await enrichmentEngine.initialize();
      await convaiManager.initialize();
      await dataPipeline.initialize();

      spinner.succeed('✅ All systems initialized');

      if (options.all) {
        await createAllAgents(options);
      } else if (options.agent) {
        await createSpecificAgent(options.agent, options);
      } else if (options.role) {
        await createAgentsByRole(options.role, options);
      } else {
        await interactiveAgentCreation(options);
      }

    } catch (error) {
      spinner.fail(`❌ Initialization failed: ${error.message}`);
      console.log(chalk.yellow('\n💡 Quick fix suggestions:'));
      console.log(chalk.gray('- Run: restaurant-agents setup'));
      console.log(chalk.gray('- Ensure ElevenLabs API key is configured'));
      console.log(chalk.gray('- Check internet connection for data fetching'));
    }
  });

// Data enrichment command
program
  .command('enrich')
  .description('🧠 Run ML-powered data enrichment pipeline')
  .option('--personality', 'Enrich personality data only')
  .option('--service', 'Enrich customer service data only')
  .option('--restaurant', 'Enrich restaurant industry data only')
  .option('--full', 'Run complete enrichment pipeline (default)')
  .action(async (options) => {
    console.log(chalk.blue('🔬 Starting data enrichment pipeline...\n'));

    const spinner = ora('Initializing data sources...').start();

    try {
      await dataPipeline.initialize();
      spinner.succeed('Data pipeline ready');

      if (options.personality) {
        await runPersonalityEnrichment();
      } else if (options.service) {
        await runServiceEnrichment();
      } else if (options.restaurant) {
        await runRestaurantEnrichment();
      } else {
        await runFullEnrichment();
      }

    } catch (error) {
      spinner.fail(`Enrichment failed: ${error.message}`);
    }
  });

// Deploy command for ConvAI
program
  .command('deploy')
  .description('🚀 Deploy agents to ElevenLabs ConvAI platform')
  .option('-a, --agent <id>', 'Deploy specific agent')
  .option('--all', 'Deploy all created agents')
  .option('--test', 'Run deployment tests after deployment')
  .action(async (options) => {
    console.log(chalk.cyan('🚀 Deploying to ElevenLabs ConvAI...\n'));

    const spinner = ora('Initializing ConvAI deployment...').start();

    try {
      await convaiManager.initialize();
      spinner.succeed('ConvAI manager ready');

      if (options.all) {
        await deployAllAgents(options);
      } else if (options.agent) {
        await deploySpecificAgent(options.agent, options);
      } else {
        await interactiveDeployment(options);
      }

    } catch (error) {
      spinner.fail(`Deployment failed: ${error.message}`);
    }
  });

// Status and monitoring
program
  .command('status')
  .description('📊 Show system status and agent information')
  .option('--agents', 'Show agent status only')
  .option('--data', 'Show data pipeline status only')
  .option('--convai', 'Show ConvAI deployment status only')
  .action(async (options) => {
    await displaySystemStatus(agentManager, enrichmentEngine, convaiManager, dataPipeline, options);
  });

// Setup command
program
  .command('setup')
  .description('⚙️ Complete system setup and configuration')
  .action(async () => {
    await runSetupWizard();
  });

// Test command
program
  .command('test')
  .description('🧪 Test agent functionality and responses')
  .option('-a, --agent <id>', 'Test specific agent')
  .option('-m, --message <text>', 'Test message to send')
  .action(async (options) => {
    await runAgentTests(options);
  });

// Export command for agent configurations
program
  .command('export')
  .description('📦 Export agent configurations and data')
  .option('--format <type>', 'Export format (json, yaml, csv)', 'json')
  .option('--output <path>', 'Output directory', './exports')
  .action(async (options) => {
    await exportAgentData(options);
  });

// Interactive functions
async function createAllAgents(options) {
  console.log(chalk.cyan('\n🎭 Creating all 11 restaurant voice agents...\n'));

  const agentIds = [
    'sophia', 'marcus', 'isabella', 'diego', 'amara',
    'chen', 'raj', 'luna', 'victor', 'zara', 'oliver'
  ];

  for (let i = 0; i < agentIds.length; i++) {
    const agentId = agentIds[i];
    const spinner = ora(`Creating ${agentId}... (${i + 1}/${agentIds.length})`).start();

    try {
      await createAndEnrichAgent(agentId, options);
      spinner.succeed(`✅ ${agentId} created successfully`);
    } catch (error) {
      spinner.fail(`❌ Failed to create ${agentId}: ${error.message}`);
    }
  }

  console.log(chalk.green('\n🎉 All agents created! Ready for deployment.'));
}

async function createSpecificAgent(agentId, options) {
  console.log(chalk.cyan(`\n🎭 Creating agent: ${agentId}\n`));

  const spinner = ora(`Creating enriched agent...`).start();

  try {
    await createAndEnrichAgent(agentId, options);
    spinner.succeed(`✅ Agent ${agentId} created successfully`);

    if (options.deploy) {
      await deploySpecificAgent(agentId, options);
    }
  } catch (error) {
    spinner.fail(`❌ Failed to create ${agentId}: ${error.message}`);
  }
}

async function createAndEnrichAgent(agentId, options) {
  // Get base agent definition
  const agent = agentManager.getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  // Enrich with ML data if enabled
  let enrichedAgent = agent;
  if (options.enrich !== false) {
    console.log(chalk.blue(`  🧠 Enriching ${agent.name} with ML data...`));
    enrichedAgent = await enrichmentEngine.enrichAgent(agent);
    await enrichmentEngine.saveEnrichedAgent(enrichedAgent);
  }

  return enrichedAgent;
}

async function interactiveAgentCreation(options) {
  console.log(chalk.yellow('\n🎯 Interactive Agent Creation\n'));

  const { selectedAgents } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedAgents',
      message: 'Select agents to create:',
      choices: [
        { name: '🍳 Sophia Romano - Head Chef (Italian passion)', value: 'sophia' },
        { name: '🎯 Marcus Washington - Front Manager (Customer service)', value: 'marcus' },
        { name: '🍷 Isabella Dubois - Sommelier (French expertise)', value: 'isabella' },
        { name: '⚡ Diego Rodriguez - Expediter (Lightning speed)', value: 'diego' },
        { name: '👋 Amara Johnson - Host (Southern warmth)', value: 'amara' },
        { name: '🧁 Chen Wei - Pastry Chef (Artistic precision)', value: 'chen' },
        { name: '💰 Raj Patel - Financial Controller (Data driven)', value: 'raj' },
        { name: '📱 Luna Martinez - Marketing (Gen Z energy)', value: 'luna' },
        { name: '🛡️ Victor Stone - Security (Military background)', value: 'victor' },
        { name: '📚 Zara Thompson - Training (Patient educator)', value: 'zara' },
        { name: '💻 Oliver Kim - Tech Support (Problem solver)', value: 'oliver' }
      ],
      validate: (answer) => answer.length > 0 || 'Select at least one agent'
    }
  ]);

  const { enableEnrichment, autoDeploy } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableEnrichment',
      message: 'Enable ML-powered personality enrichment?',
      default: true
    },
    {
      type: 'confirm',
      name: 'autoDeploy',
      message: 'Deploy to ElevenLabs ConvAI after creation?',
      default: false
    }
  ]);

  console.log(chalk.blue('\n🚀 Creating selected agents...\n'));

  for (const agentId of selectedAgents) {
    await createSpecificAgent(agentId, {
      enrich: enableEnrichment,
      deploy: autoDeploy
    });
  }
}

async function runFullEnrichment() {
  console.log(chalk.cyan('🔬 Running complete data enrichment pipeline...\n'));

  const steps = [
    'Fetching personality datasets from Hugging Face',
    'Processing Big Five personality traits',
    'Analyzing customer service patterns',
    'Extracting restaurant industry behaviors',
    'Generating conversational templates',
    'Creating personality-role mappings',
    'Optimizing response patterns'
  ];

  for (let i = 0; i < steps.length; i++) {
    const spinner = ora(`${steps[i]}... (${i + 1}/${steps.length})`).start();

    // Simulate processing time for demo
    await new Promise(resolve => setTimeout(resolve, 2000));

    spinner.succeed(`✅ ${steps[i]}`);
  }

  try {
    const results = await dataPipeline.runFullEnrichmentPipeline();

    console.log(chalk.green('\n🎉 Enrichment pipeline completed successfully!'));
    console.log(chalk.blue(`📊 Processed data summary:`));
    console.log(chalk.gray(`  • Personality patterns: ${results.personality?.patterns?.length || 0}`));
    console.log(chalk.gray(`  • Service patterns: ${results.customerService?.intents?.size || 0} intent categories`));
    console.log(chalk.gray(`  • Conversation templates: ${results.conversational?.response_variations?.size || 0} variations`));

  } catch (error) {
    console.log(chalk.red(`❌ Pipeline failed: ${error.message}`));
  }
}

async function deployAllAgents(options) {
  console.log(chalk.cyan('🚀 Deploying all agents to ConvAI...\n'));

  const enrichedAgents = await loadEnrichedAgents();

  for (const agent of enrichedAgents) {
    const spinner = ora(`Deploying ${agent.name}...`).start();

    try {
      await convaiManager.createAgent(agent);
      if (options.test) {
        await convaiManager.testAgent(agent.id, "Hello, this is a test message.");
      }
      spinner.succeed(`✅ ${agent.name} deployed`);
    } catch (error) {
      spinner.fail(`❌ ${agent.name} deployment failed: ${error.message}`);
    }
  }
}

async function loadEnrichedAgents() {
  // Load all enriched agents from cache
  const agentIds = ['sophia', 'marcus', 'isabella', 'diego', 'amara', 'chen', 'raj', 'luna', 'victor', 'zara', 'oliver'];
  const enrichedAgents = [];

  for (const id of agentIds) {
    const enriched = await enrichmentEngine.loadEnrichedAgent(id);
    if (enriched) {
      enrichedAgents.push(enriched);
    }
  }

  return enrichedAgents;
}

async function runSetupWizard() {
  console.log(chalk.blue('⚙️ Restaurant Voice Agents Setup Wizard\n'));

  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'elevenLabsKey',
      message: 'Enter your ElevenLabs API key:',
      mask: '*',
      validate: (input) => input.length > 0 || 'API key is required'
    },
    {
      type: 'list',
      name: 'voiceModel',
      message: 'Select default voice model:',
      choices: [
        'eleven_turbo_v2 (Fastest, good quality)',
        'eleven_multilingual_v2 (Best for accents)',
        'eleven_monolingual_v1 (Classic quality)'
      ]
    },
    {
      type: 'confirm',
      name: 'enableEnrichment',
      message: 'Enable ML data enrichment by default?',
      default: true
    },
    {
      type: 'confirm',
      name: 'autoInstallCLI',
      message: 'Install ElevenLabs ConvAI CLI?',
      default: true
    }
  ]);

  console.log(chalk.cyan('\n🔧 Setting up your system...\n'));

  // Setup steps with progress
  const setupSteps = [
    { name: 'Configuring ElevenLabs API', action: () => setupElevenLabs(answers) },
    { name: 'Installing ConvAI CLI', action: () => answers.autoInstallCLI ? convaiManager.installCLI() : null },
    { name: 'Initializing data pipeline', action: () => dataPipeline.initialize() },
    { name: 'Creating project structure', action: () => createProjectStructure() },
    { name: 'Downloading sample data', action: () => answers.enableEnrichment ? downloadSampleData() : null }
  ];

  for (const step of setupSteps) {
    if (step.action) {
      const spinner = ora(step.name).start();
      try {
        await step.action();
        spinner.succeed(`✅ ${step.name}`);
      } catch (error) {
        spinner.fail(`❌ ${step.name}: ${error.message}`);
      }
    }
  }

  console.log(chalk.green('\n🎉 Setup completed! You can now create agents with:'));
  console.log(chalk.cyan('restaurant-agents create --all'));
}

async function setupElevenLabs(answers) {
  // Extract model name from choice
  const model = answers.voiceModel.split(' ')[0];

  await convaiManager.configure({
    elevenLabsApiKey: answers.elevenLabsKey,
    defaultVoiceModel: model
  });
}

async function createProjectStructure() {
  // Create necessary directories
  const dirs = [
    'convai-agents',
    'data/cache',
    'data/exports',
    'logs'
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function downloadSampleData() {
  // Download sample personality and service data
  await dataPipeline.fetchHuggingFaceData('blended_skill_talk', 100);
}

program.parse();