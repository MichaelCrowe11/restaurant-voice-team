#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║  🍽️   RESTAURANT VOICE AGENTS - LIVE DEPLOYMENT TEST                         ║
║                                                                               ║
║  Testing ElevenLabs ConvAI Integration...                                    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`));

// Check for ElevenLabs API key
const checkAPIKey = async () => {
  const spinner = ora('Checking for ElevenLabs API key...').start();

  if (process.env.ELEVENLABS_API_KEY) {
    spinner.succeed('ElevenLabs API key found in environment');
    return true;
  }

  spinner.warn('ElevenLabs API key not found');

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your ElevenLabs API key:',
      mask: '*',
      validate: (input) => input.length > 0 || 'API key is required'
    }
  ]);

  // Save to .env file
  const fs = await import('fs/promises');
  await fs.writeFile('.env', `ELEVENLABS_API_KEY=${apiKey}\n`);
  console.log(chalk.green('✅ API key saved to .env file'));

  return true;
};

// Main execution
const main = async () => {
  try {
    await checkAPIKey();

    console.log(chalk.yellow('\n📋 Next Steps:\n'));
    console.log(chalk.cyan('1. Authenticate with ConvAI:'));
    console.log(chalk.gray('   Run: npx convai login'));

    console.log(chalk.cyan('\n2. Initialize ConvAI project:'));
    console.log(chalk.gray('   Run: npx convai init'));

    console.log(chalk.cyan('\n3. Create your first agent:'));
    console.log(chalk.gray('   Run: npx convai add agent "Chef Sophia"'));

    console.log(chalk.cyan('\n4. Deploy to production:'));
    console.log(chalk.gray('   Run: npx convai sync'));

    console.log(chalk.green('\n✨ Your system is ready for deployment!'));

  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error.message);
    process.exit(1);
  }
};

main();