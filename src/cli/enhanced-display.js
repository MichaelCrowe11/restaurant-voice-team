import chalk from 'chalk';
import fs from 'fs/promises';

export function displayLogo() {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║  🍽️   RESTAURANT VOICE AGENTS v2.0 - ML-POWERED CONVAI EDITION              ║
║                                                                               ║
║  🧠 Enhanced with Machine Learning personality data from:                     ║
║     • Hugging Face personality datasets                                       ║
║     • Big Five trait analysis                                                 ║
║     • Restaurant industry behavioral patterns                                 ║
║                                                                               ║
║  🎤 Powered by ElevenLabs ConvAI for production-ready voice agents            ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
  `));
}

export async function displaySystemStatus(agentManager, enrichmentEngine, convaiManager, dataPipeline, options = {}) {
  console.log(chalk.blue('\n📊 Restaurant Voice Agents System Status\n'));

  if (!options.data && !options.convai) {
    await displayAgentStatus(agentManager);
  }

  if (!options.agents && !options.convai) {
    await displayDataStatus(enrichmentEngine, dataPipeline);
  }

  if (!options.agents && !options.data) {
    await displayConvAIStatus(convaiManager);
  }

  console.log(chalk.gray('\n' + '═'.repeat(80)));
}

async function displayAgentStatus(agentManager) {
  console.log(chalk.yellow('👥 AGENT STATUS'));
  console.log('─'.repeat(50));

  const agents = [
    { id: 'sophia', name: 'Chef Sophia Romano', emoji: '🍳' },
    { id: 'marcus', name: 'Marcus Washington', emoji: '🎯' },
    { id: 'isabella', name: 'Isabella Dubois', emoji: '🍷' },
    { id: 'diego', name: 'Diego Rodriguez', emoji: '⚡' },
    { id: 'amara', name: 'Amara Johnson', emoji: '👋' },
    { id: 'chen', name: 'Chen Wei', emoji: '🧁' },
    { id: 'raj', name: 'Raj Patel', emoji: '💰' },
    { id: 'luna', name: 'Luna Martinez', emoji: '📱' },
    { id: 'victor', name: 'Victor Stone', emoji: '🛡️' },
    { id: 'zara', name: 'Zara Thompson', emoji: '📚' },
    { id: 'oliver', name: 'Oliver Kim', emoji: '💻' }
  ];

  for (const agent of agents) {
    const status = await getAgentStatus(agent.id);
    const statusColor = status.enriched ? 'green' : status.created ? 'yellow' : 'gray';
    const statusText = status.enriched ? 'ENRICHED' : status.created ? 'CREATED' : 'NOT CREATED';
    const deployStatus = status.deployed ? chalk.blue(' [DEPLOYED]') : '';

    console.log(`${agent.emoji} ${chalk.bold(agent.name)}`);
    console.log(`   Status: ${chalk[statusColor](statusText)}${deployStatus}`);

    if (status.enriched) {
      console.log(`   ${chalk.gray('Confidence:')} ${status.confidence}%`);
      console.log(`   ${chalk.gray('Personality:')} Big Five traits mapped`);
    }
    console.log('');
  }
}

async function getAgentStatus(agentId) {
  try {
    // Check if enriched agent exists
    const enrichedPath = `./cache/enrichment/${agentId}_enriched.json`;
    await fs.access(enrichedPath);

    const data = await fs.readFile(enrichedPath, 'utf8');
    const enrichedAgent = JSON.parse(data);

    return {
      created: true,
      enriched: true,
      deployed: false, // Would check ConvAI deployment status
      confidence: enrichedAgent.enrichment?.confidence || 0
    };
  } catch (error) {
    return {
      created: false,
      enriched: false,
      deployed: false,
      confidence: 0
    };
  }
}

async function displayDataStatus(enrichmentEngine, dataPipeline) {
  console.log(chalk.yellow('🧠 DATA ENRICHMENT STATUS'));
  console.log('─'.repeat(50));

  const enrichmentStatus = enrichmentEngine.getEnrichmentSummary();
  const pipelineStatus = dataPipeline.getStatus();

  console.log(`${chalk.cyan('Data Sources:')} ${enrichmentStatus.dataSources.length} configured`);
  enrichmentStatus.dataSources.forEach(source => {
    console.log(`  • ${source}`);
  });

  console.log(`\n${chalk.cyan('Personality Models:')} ${enrichmentStatus.personalityModels.length} loaded`);
  enrichmentStatus.personalityModels.forEach(model => {
    console.log(`  • ${model}`);
  });

  console.log(`\n${chalk.cyan('Pipeline Status:')}`);
  console.log(`  • Datasets: ${pipelineStatus.datasets} categories`);
  console.log(`  • Processors: ${pipelineStatus.processors} active`);
  console.log(`  • Cache: ${pipelineStatus.cacheSize} items`);
  console.log(`  • Total cached items: ${pipelineStatus.totalCachedItems}`);

  // Check for cached enrichment data
  try {
    await fs.access('./cache/enrichment/');
    const files = await fs.readdir('./cache/enrichment/');
    const enrichedCount = files.filter(f => f.endsWith('_enriched.json')).length;
    console.log(`  • Enriched agents: ${chalk.green(enrichedCount)}`);
  } catch (error) {
    console.log(`  • Enriched agents: ${chalk.gray('0')}`);
  }

  console.log('');
}

async function displayConvAIStatus(convaiManager) {
  console.log(chalk.yellow('🎤 ELEVENLABS CONVAI STATUS'));
  console.log('─'.repeat(50));

  const status = convaiManager.getDeploymentStatus();

  console.log(`${chalk.cyan('Authentication:')} ${status.authenticated ? chalk.green('✓ Connected') : chalk.red('✗ Not authenticated')}`);
  console.log(`${chalk.cyan('Project Path:')} ${status.projectPath}`);
  console.log(`${chalk.cyan('Deployed Agents:')} ${status.deployedAgents}`);
  console.log(`${chalk.cyan('Agent Configs:')} ${status.agentConfigs}`);

  if (!status.authenticated) {
    console.log(chalk.yellow('\n💡 To authenticate: restaurant-agents setup'));
  }

  if (status.deployedAgents > 0) {
    console.log(chalk.green('\n🚀 Agents ready for voice interactions!'));
  }

  console.log('');
}

export function displayQuickStart() {
  console.log(chalk.cyan('\n🚀 QUICK START GUIDE\n'));

  const steps = [
    {
      number: '1',
      title: 'Setup System',
      command: 'restaurant-agents setup',
      description: 'Configure ElevenLabs API and install ConvAI CLI'
    },
    {
      number: '2',
      title: 'Enrich Data',
      command: 'restaurant-agents enrich --full',
      description: 'Download and process ML personality datasets'
    },
    {
      number: '3',
      title: 'Create Agents',
      command: 'restaurant-agents create --all --enrich',
      description: 'Generate all 11 agents with ML-powered personalities'
    },
    {
      number: '4',
      title: 'Deploy to ConvAI',
      command: 'restaurant-agents deploy --all',
      description: 'Deploy agents to ElevenLabs for voice interactions'
    },
    {
      number: '5',
      title: 'Test Agents',
      command: 'restaurant-agents test --agent sophia',
      description: 'Test voice interactions with your agents'
    }
  ];

  steps.forEach(step => {
    console.log(`${chalk.bold.blue(step.number + '.')} ${chalk.bold(step.title)}`);
    console.log(`   ${chalk.green('$')} ${chalk.cyan(step.command)}`);
    console.log(`   ${chalk.gray(step.description)}\n`);
  });
}

export function displayAgentShowcase() {
  console.log(chalk.cyan('\n🎭 AGENT SHOWCASE - ML-ENHANCED PERSONALITIES\n'));

  const showcase = [
    {
      name: 'Chef Sophia Romano',
      emoji: '🍳',
      personality: 'Passionate Italian-American | High Openness & Conscientiousness',
      mlFeatures: [
        'Culinary terminology from restaurant datasets',
        'Personality traits: Creative (9/10), Perfectionist (9/10)',
        'Response patterns: Passionate, Detail-oriented, Uses Italian expressions'
      ]
    },
    {
      name: 'Marcus Washington',
      emoji: '🎯',
      personality: 'Charismatic Leader | High Extraversion & Agreeableness',
      mlFeatures: [
        'Customer service patterns from 3000+ interactions',
        'Personality traits: Sociable (9/10), Diplomatic (8/10)',
        'Response patterns: Solutions-focused, Motivational, Empathetic'
      ]
    },
    {
      name: 'Isabella Dubois',
      emoji: '🍷',
      personality: 'Sophisticated Sommelier | High Openness & Knowledge',
      mlFeatures: [
        'Wine knowledge base with 500+ varietals',
        'Personality traits: Cultured (9/10), Elegant (8/10)',
        'Response patterns: Educational, French expressions, Refined vocabulary'
      ]
    }
  ];

  showcase.forEach(agent => {
    console.log(`${agent.emoji} ${chalk.bold.yellow(agent.name)}`);
    console.log(`   ${chalk.blue('Profile:')} ${agent.personality}`);
    console.log(`   ${chalk.green('ML Enhancements:')}`);
    agent.mlFeatures.forEach(feature => {
      console.log(`     • ${chalk.gray(feature)}`);
    });
    console.log('');
  });

  console.log(chalk.cyan('✨ All agents feature:'));
  console.log(chalk.gray('  • Big Five personality trait mapping'));
  console.log(chalk.gray('  • Industry-specific behavioral patterns'));
  console.log(chalk.gray('  • Contextual response variations'));
  console.log(chalk.gray('  • Real-time voice synthesis via ElevenLabs'));
  console.log(chalk.gray('  • Production-ready ConvAI deployment\n'));
}

export function displayDataSources() {
  console.log(chalk.cyan('\n📊 ML DATA SOURCES\n'));

  const sources = [
    {
      platform: 'Hugging Face',
      datasets: [
        'blended_skill_talk - Conversational personality patterns',
        'bitext/customer-support - Restaurant service interactions',
        'personality-prediction - Big Five trait analysis'
      ]
    },
    {
      platform: 'Kaggle',
      datasets: [
        'big-five-personality-test - 1M personality assessments',
        'restaurant-satisfaction - Customer behavior analysis',
        'hotel-customers - Hospitality industry patterns'
      ]
    },
    {
      platform: 'OpenPsychometrics',
      datasets: [
        'Big Five trait norms - Cross-cultural personality data',
        'Character descriptions - Personality-behavior mappings'
      ]
    },
    {
      platform: 'Yelp Open Dataset',
      datasets: [
        'Restaurant reviews - Real customer feedback analysis',
        'Business attributes - Service quality indicators'
      ]
    }
  ];

  sources.forEach(source => {
    console.log(`${chalk.bold.blue(source.platform)}`);
    source.datasets.forEach(dataset => {
      console.log(`  • ${chalk.gray(dataset)}`);
    });
    console.log('');
  });

  console.log(chalk.green('🔬 Processing Pipeline:'));
  console.log(chalk.gray('  1. Data ingestion from multiple ML platforms'));
  console.log(chalk.gray('  2. Personality trait extraction and mapping'));
  console.log(chalk.gray('  3. Restaurant industry behavior analysis'));
  console.log(chalk.gray('  4. Conversational pattern generation'));
  console.log(chalk.gray('  5. Agent-specific enrichment and optimization\n'));
}