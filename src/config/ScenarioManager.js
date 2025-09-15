import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { EventEmitter } from 'events';

export class ScenarioManager extends EventEmitter {
  constructor() {
    super();
    this.currentScenario = null;
    this.scenarios = new Map();
    this.scenarioPath = path.join(process.cwd(), 'scenarios');
  }

  async initialize() {
    try {
      await this.loadScenarios();
      console.log(chalk.green(`📋 Loaded ${this.scenarios.size} restaurant scenarios`));
    } catch (error) {
      console.log(chalk.yellow('⚠️  No custom scenarios found. Using default scenarios.'));
      await this.createDefaultScenarios();
    }
  }

  async loadScenarios() {
    try {
      const files = await fs.readdir(this.scenarioPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const scenarioData = await fs.readFile(
          path.join(this.scenarioPath, file),
          'utf8'
        );
        const scenario = JSON.parse(scenarioData);
        this.scenarios.set(scenario.id, scenario);
      }
    } catch (error) {
      throw new Error('Failed to load scenarios');
    }
  }

  async createDefaultScenarios() {
    await fs.mkdir(this.scenarioPath, { recursive: true });

    const defaultScenarios = [
      {
        id: 'fine-dining',
        name: 'Fine Dining Restaurant',
        description: 'Upscale restaurant with premium service and cuisine',
        capacity: 80,
        serviceStyle: 'full-service',
        priceRange: '$$$',
        agentConfiguration: {
          required: ['sophia', 'marcus', 'isabella', 'amara', 'chen'],
          optional: ['victor', 'zara'],
          priorities: ['quality', 'service', 'ambiance']
        },
        workflowRules: {
          reservationRequired: true,
          dresscode: 'business-casual',
          averageServiceTime: 90,
          specialFeatures: ['wine-pairing', 'chef-table', 'private-dining']
        }
      },
      {
        id: 'fast-casual',
        name: 'Fast Casual Restaurant',
        description: 'Quick service with quality ingredients and efficient operations',
        capacity: 60,
        serviceStyle: 'counter-service',
        priceRange: '$$',
        agentConfiguration: {
          required: ['sophia', 'marcus', 'diego', 'amara'],
          optional: ['luna', 'oliver'],
          priorities: ['speed', 'efficiency', 'value']
        },
        workflowRules: {
          reservationRequired: false,
          averageServiceTime: 15,
          specialFeatures: ['mobile-ordering', 'loyalty-program', 'quick-pickup']
        }
      },
      {
        id: 'cafe-bakery',
        name: 'Cafe & Bakery',
        description: 'Cozy cafe with fresh baked goods and coffee',
        capacity: 40,
        serviceStyle: 'cafe-style',
        priceRange: '$',
        agentConfiguration: {
          required: ['chen', 'marcus', 'amara'],
          optional: ['luna', 'oliver'],
          priorities: ['freshness', 'comfort', 'community']
        },
        workflowRules: {
          reservationRequired: false,
          averageServiceTime: 20,
          specialFeatures: ['daily-specials', 'coffee-program', 'takeaway']
        }
      },
      {
        id: 'sports-bar',
        name: 'Sports Bar & Grill',
        description: 'Lively atmosphere with games, drinks, and casual dining',
        capacity: 120,
        serviceStyle: 'bar-service',
        priceRange: '$$',
        agentConfiguration: {
          required: ['sophia', 'marcus', 'diego', 'victor'],
          optional: ['isabella', 'luna'],
          priorities: ['entertainment', 'speed', 'atmosphere']
        },
        workflowRules: {
          reservationRequired: false,
          averageServiceTime: 45,
          specialFeatures: ['game-day-specials', 'large-groups', 'bar-seating']
        }
      },
      {
        id: 'food-truck',
        name: 'Mobile Food Truck',
        description: 'Mobile kitchen serving street food and quick bites',
        capacity: 0,
        serviceStyle: 'takeout-only',
        priceRange: '$',
        agentConfiguration: {
          required: ['sophia', 'diego'],
          optional: ['luna', 'oliver'],
          priorities: ['mobility', 'speed', 'innovation']
        },
        workflowRules: {
          reservationRequired: false,
          averageServiceTime: 8,
          specialFeatures: ['location-tracking', 'social-media', 'limited-menu']
        }
      },
      {
        id: 'catering',
        name: 'Catering Service',
        description: 'Off-site catering for events and special occasions',
        capacity: 500,
        serviceStyle: 'catering',
        priceRange: '$$$',
        agentConfiguration: {
          required: ['sophia', 'marcus', 'raj', 'zara'],
          optional: ['isabella', 'chen', 'victor'],
          priorities: ['planning', 'logistics', 'presentation']
        },
        workflowRules: {
          reservationRequired: true,
          averageServiceTime: 240,
          specialFeatures: ['event-planning', 'custom-menus', 'equipment-rental']
        }
      }
    ];

    for (const scenario of defaultScenarios) {
      await this.saveScenario(scenario);
    }

    // Reload scenarios after creating defaults
    await this.loadScenarios();
  }

  async saveScenario(scenario) {
    const filename = `${scenario.id}.json`;
    const filePath = path.join(this.scenarioPath, filename);
    await fs.writeFile(filePath, JSON.stringify(scenario, null, 2));
  }

  async loadScenario(scenarioId) {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario '${scenarioId}' not found`);
    }

    this.currentScenario = scenario;
    console.log(chalk.blue(`📋 Loaded scenario: ${scenario.name}`));

    this.emit('scenarioLoaded', scenario);
    return scenario;
  }

  async deployAgents(config) {
    console.log(chalk.cyan('\n🚀 Deploying Restaurant Voice Agent Team\n'));

    // Find matching scenario or create custom
    let scenario = this.findBestScenario(config);

    if (!scenario) {
      scenario = await this.createCustomScenario(config);
    }

    await this.loadScenario(scenario.id);

    console.log(chalk.green(`✅ Deployment configuration ready for ${scenario.name}`));
    console.log(chalk.blue(`📊 Capacity: ${scenario.capacity} seats`));
    console.log(chalk.blue(`🍽️  Service Style: ${scenario.serviceStyle}`));
    console.log(chalk.blue(`💰 Price Range: ${scenario.priceRange}`));

    const requiredAgents = scenario.agentConfiguration.required;
    const optionalAgents = scenario.agentConfiguration.optional || [];

    console.log(chalk.yellow('\n👥 Required Agents:'));
    requiredAgents.forEach(agentId => {
      console.log(chalk.green(`  ✓ ${agentId}`));
    });

    if (optionalAgents.length > 0) {
      console.log(chalk.yellow('\n🔧 Optional Agents:'));
      optionalAgents.forEach(agentId => {
        console.log(chalk.gray(`  ○ ${agentId}`));
      });
    }

    console.log(chalk.yellow('\n🎯 Priorities:'));
    scenario.agentConfiguration.priorities.forEach(priority => {
      console.log(chalk.cyan(`  • ${priority}`));
    });

    return scenario;
  }

  findBestScenario(config) {
    for (const [id, scenario] of this.scenarios) {
      if (this.matchesConfig(scenario, config)) {
        return scenario;
      }
    }
    return null;
  }

  matchesConfig(scenario, config) {
    const typeMatches = scenario.name.toLowerCase().includes(config.type.toLowerCase());
    const capacityMatches = Math.abs(scenario.capacity - config.capacity) <= 20;

    return typeMatches || capacityMatches;
  }

  async createCustomScenario(config) {
    const customScenario = {
      id: `custom-${Date.now()}`,
      name: `Custom ${config.type}`,
      description: `Custom configuration for ${config.type}`,
      capacity: config.capacity || 50,
      serviceStyle: this.inferServiceStyle(config.type),
      priceRange: this.inferPriceRange(config.type),
      agentConfiguration: this.generateAgentConfig(config),
      workflowRules: this.generateWorkflowRules(config)
    };

    await this.saveScenario(customScenario);
    this.scenarios.set(customScenario.id, customScenario);

    return customScenario;
  }

  inferServiceStyle(type) {
    const styleMap = {
      'fine dining': 'full-service',
      'fast casual': 'counter-service',
      'cafe': 'cafe-style',
      'sports bar': 'bar-service',
      'food truck': 'takeout-only',
      'catering': 'catering'
    };

    for (const [key, style] of Object.entries(styleMap)) {
      if (type.toLowerCase().includes(key)) {
        return style;
      }
    }

    return 'full-service';
  }

  inferPriceRange(type) {
    const priceMap = {
      'fine dining': '$$$',
      'fast casual': '$$',
      'cafe': '$',
      'sports bar': '$$',
      'food truck': '$',
      'catering': '$$$'
    };

    for (const [key, price] of Object.entries(priceMap)) {
      if (type.toLowerCase().includes(key)) {
        return price;
      }
    }

    return '$$';
  }

  generateAgentConfig(config) {
    // Generate smart agent configuration based on restaurant type
    const baseRequired = ['sophia', 'marcus'];
    const typeSpecific = {
      'fine dining': ['isabella', 'amara', 'chen'],
      'fast casual': ['diego', 'amara'],
      'cafe': ['chen', 'amara'],
      'sports bar': ['diego', 'victor'],
      'food truck': ['diego'],
      'catering': ['raj', 'zara']
    };

    let required = [...baseRequired];
    for (const [key, agents] of Object.entries(typeSpecific)) {
      if (config.type.toLowerCase().includes(key)) {
        required = [...required, ...agents];
        break;
      }
    }

    return {
      required: [...new Set(required)],
      optional: ['luna', 'oliver', 'victor'],
      priorities: ['quality', 'service', 'efficiency']
    };
  }

  generateWorkflowRules(config) {
    return {
      reservationRequired: config.type.toLowerCase().includes('fine') ||
                          config.type.toLowerCase().includes('catering'),
      averageServiceTime: config.type.toLowerCase().includes('fast') ? 15 : 45,
      specialFeatures: ['mobile-ordering', 'loyalty-program']
    };
  }

  listScenarios() {
    console.log(chalk.cyan('\n📋 Available Restaurant Scenarios:\n'));

    for (const [id, scenario] of this.scenarios) {
      console.log(chalk.bold(`${scenario.name} (${id})`));
      console.log(`   ${chalk.gray(scenario.description)}`);
      console.log(`   ${chalk.blue('Capacity:')} ${scenario.capacity} seats`);
      console.log(`   ${chalk.green('Style:')} ${scenario.serviceStyle}`);
      console.log(`   ${chalk.yellow('Price:')} ${scenario.priceRange}\n`);
    }
  }

  getCurrentScenario() {
    return this.currentScenario;
  }

  getScenario(id) {
    return this.scenarios.get(id);
  }

  getAllScenarios() {
    return Array.from(this.scenarios.values());
  }
}