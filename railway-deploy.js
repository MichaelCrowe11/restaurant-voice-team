#!/usr/bin/env node

/**
 * Railway deployment script for Restaurant Voice Agents
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function deployToRailway() {
    console.log('🚂 Starting Railway deployment...');

    try {
        // Check if Railway CLI is available
        await execAsync('npx @railway/cli --version');
        console.log('✅ Railway CLI is available');

        // Initialize Railway project
        console.log('📝 Creating Railway project...');
        const { stdout: projectOut } = await execAsync('npx @railway/cli up --detach');
        console.log('Project created:', projectOut);

        // Set environment variables
        console.log('⚙️  Setting environment variables...');
        await execAsync('npx @railway/cli variables set NODE_ENV=production');
        await execAsync('npx @railway/cli variables set ENABLE_INTELLIGENCE=true');

        console.log('📝 Remember to set your ELEVENLABS_API_KEY:');
        console.log('   railway variables set ELEVENLABS_API_KEY=your_key_here');

        // Deploy the application
        console.log('🚀 Deploying application...');
        const { stdout: deployOut } = await execAsync('npx @railway/cli up');
        console.log('Deployment output:', deployOut);

        // Get the deployment URL
        const { stdout: statusOut } = await execAsync('npx @railway/cli status');
        console.log('📍 Deployment status:', statusOut);

        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🎉 Restaurant Voice Agents deployed to Railway!              ║
║                                                                ║
║  Next steps:                                                   ║
║  1. Set your ElevenLabs API key                               ║
║  2. Visit your live app URL                                   ║
║  3. Test the intelligence dashboard                           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `);

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);

        console.log(`
Manual deployment steps:
1. Go to https://railway.app
2. Create new project
3. Connect this GitHub repository
4. Set environment variables
5. Deploy!
        `);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    deployToRailway();
}

export default deployToRailway;