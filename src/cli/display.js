import chalk from 'chalk';
import inquirer from 'inquirer';

export function displayLogo() {
  console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🍽️  Restaurant Voice Agents - ElevenLabs Powered Team     ║
║                                                              ║
║    Transforming restaurant operations with AI voice agents  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `));
}

export async function displayAgentMenu() {
  console.log(chalk.yellow('\n👥 Select agents to activate:\n'));

  const agents = [
    {
      name: 'Sophia - Head Chef',
      value: 'sophia',
      description: '🍳 Kitchen operations, menu planning, inventory'
    },
    {
      name: 'Marcus - Front Manager',
      value: 'marcus',
      description: '🎯 Customer service, staff coordination, quality control'
    },
    {
      name: 'Isabella - Sommelier',
      value: 'isabella',
      description: '🍷 Wine pairing, beverage management, guest education'
    },
    {
      name: 'Diego - Expediter',
      value: 'diego',
      description: '⚡ Order coordination, timing, kitchen-FOH communication'
    },
    {
      name: 'Amara - Host',
      value: 'amara',
      description: '👋 Guest greeting, reservations, seating optimization'
    },
    {
      name: 'Chen - Pastry Chef',
      value: 'chen',
      description: '🧁 Desserts, baking, special dietary accommodations'
    },
    {
      name: 'Raj - Financial Controller',
      value: 'raj',
      description: '💰 Cost control, pricing, financial analytics'
    },
    {
      name: 'Luna - Marketing Coordinator',
      value: 'luna',
      description: '📱 Social media, promotions, customer engagement'
    },
    {
      name: 'Victor - Security Manager',
      value: 'victor',
      description: '🛡️ Safety protocols, incident management, compliance'
    },
    {
      name: 'Zara - Training Specialist',
      value: 'zara',
      description: '📚 Staff development, onboarding, skill assessment'
    },
    {
      name: 'Oliver - Tech Support',
      value: 'oliver',
      description: '💻 POS systems, tech troubleshooting, digital solutions'
    }
  ];

  const { selectedAgents } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedAgents',
      message: 'Choose agents to activate:',
      choices: agents.map(agent => ({
        name: `${agent.name} - ${agent.description}`,
        value: agent.value,
        short: agent.name
      })),
      validate: (answer) => {
        if (answer.length < 1) {
          return 'You must choose at least one agent.';
        }
        return true;
      }
    }
  ]);

  return selectedAgents;
}

export function displayAgentStatus(agentName, status, message) {
  const statusColor = status === 'active' ? 'green' :
                     status === 'busy' ? 'yellow' :
                     status === 'offline' ? 'red' : 'gray';

  console.log(chalk[statusColor](`${agentName}: ${status.toUpperCase()} - ${message}`));
}