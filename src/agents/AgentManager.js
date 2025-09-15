import { Agent } from './Agent.js';
import { agentDefinitions } from './definitions.js';
import chalk from 'chalk';

export class AgentManager {
  constructor() {
    this.agents = new Map();
    this.activeAgents = new Set();
  }

  async initialize() {
    console.log(chalk.blue('🤖 Loading restaurant management agents...'));

    for (const [agentId, definition] of Object.entries(agentDefinitions)) {
      const agent = new Agent(agentId, definition);
      await agent.initialize();
      this.agents.set(agentId, agent);
    }

    console.log(chalk.green(`✅ Loaded ${this.agents.size} agents successfully`));
  }

  async startAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (this.activeAgents.has(agentId)) {
      console.log(chalk.yellow(`Agent ${agent.name} is already active`));
      return;
    }

    await agent.activate();
    this.activeAgents.add(agentId);
    console.log(chalk.green(`🟢 ${agent.name} is now active and ready to assist`));
  }

  async stopAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    await agent.deactivate();
    this.activeAgents.delete(agentId);
    console.log(chalk.red(`🔴 ${agent.name} has been deactivated`));
  }

  listAgents() {
    for (const [agentId, agent] of this.agents) {
      const isActive = this.activeAgents.has(agentId);
      const status = isActive ? chalk.green('🟢 ACTIVE') : chalk.gray('⚫ INACTIVE');

      console.log(`${status} ${chalk.bold(agent.name)} (${agentId})`);
      console.log(`   ${chalk.gray(agent.description)}`);
      console.log(`   ${chalk.cyan('Specialties:')} ${agent.specialties.join(', ')}`);
      console.log(`   ${chalk.magenta('Personality:')} ${agent.personality.traits.join(', ')}\n`);
    }
  }

  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  getActiveAgents() {
    return Array.from(this.activeAgents).map(id => this.agents.get(id));
  }

  async broadcastMessage(message, excludeAgent = null) {
    const activeAgents = this.getActiveAgents();
    const promises = activeAgents
      .filter(agent => agent.id !== excludeAgent)
      .map(agent => agent.receiveMessage(message));

    await Promise.all(promises);
  }

  async coordinateAgents(task, involvedAgents) {
    console.log(chalk.blue(`🔗 Coordinating agents for task: ${task}`));

    const agents = involvedAgents.map(id => this.agents.get(id)).filter(Boolean);

    for (const agent of agents) {
      await agent.receiveTask(task);
    }
  }
}