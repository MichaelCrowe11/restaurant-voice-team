import express from 'express';
import { WebSocketServer } from 'ws';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// Conditional imports for production deployment
let CollectiveIntelligence, PredictiveEngine;

try {
    const intelligenceModule = await import('./src/intelligence/CollectiveIntelligence.js');
    CollectiveIntelligence = intelligenceModule.default;

    const predictiveModule = await import('./src/intelligence/PredictiveEngine.js');
    PredictiveEngine = predictiveModule.default;
} catch (error) {
    console.log('⚠️  Intelligence modules not available, running in basic mode');
    // Create mock classes for basic functionality
    CollectiveIntelligence = class {
        processAgentCommunication() { return null; }
        generateInsights() { return { message: 'Intelligence features disabled' }; }
    };
    PredictiveEngine = class {
        async predictCustomerNeeds() { return { message: 'Prediction features disabled' }; }
        async forecastDemand() { return { message: 'Forecast features disabled' }; }
        async optimizeStaffing() { return { message: 'Optimization features disabled' }; }
        async detectAnomalies() { return { detected: false }; }
    };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ElevenLabs configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Load agent configurations
let agentConfigs = {};

// Initialize Intelligence Systems
const collectiveIntelligence = new CollectiveIntelligence();
const predictiveEngine = new PredictiveEngine();

// Initialize Database
import DatabaseManager from './src/database/db.js';
const db = new DatabaseManager();

async function loadAgentConfigs() {
    try {
        const configPath = path.join(__dirname, 'convai-configs', 'all-agents.json');
        const data = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(data);
        agentConfigs = config.agents.reduce((acc, agent) => {
            acc[agent.id] = agent;
            return acc;
        }, {});
        console.log(`✅ Loaded ${Object.keys(agentConfigs).length} agent configurations`);
    } catch (error) {
        console.error('Failed to load agent configs:', error);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        agents: Object.keys(agentConfigs).length,
        intelligence: CollectiveIntelligence ? 'enabled' : 'disabled',
        prediction: PredictiveEngine ? 'enabled' : 'disabled'
    });
});

// API Routes

// Get all agents
app.get('/api/agents', (req, res) => {
    res.json(Object.values(agentConfigs));
});

// Get specific agent
app.get('/api/agents/:id', (req, res) => {
    const agent = agentConfigs[req.params.id];
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
});

// Test agent voice
app.post('/api/agents/:id/test', async (req, res) => {
    const agentId = req.params.id;
    const { message } = req.body;
    const agent = agentConfigs[agentId];

    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    try {
        // Generate response using agent's personality
        const response = await generateAgentResponse(agent, message);

        // Synthesize speech using ElevenLabs
        const audioUrl = await synthesizeSpeech(response.text, agent.voice_id);

        res.json({
            agent: agent.name,
            message: message,
            response: response.text,
            audioUrl: audioUrl,
            personality: agent.personality,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error testing agent:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Deploy agent to ConvAI
app.post('/api/agents/:id/deploy', async (req, res) => {
    const agentId = req.params.id;
    const agent = agentConfigs[agentId];

    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    try {
        const execAsync = promisify(exec);

        // Create agent configuration
        const configPath = path.join(__dirname, 'convai-configs', `${agentId}-deploy.json`);
        await fs.writeFile(configPath, JSON.stringify({
            name: agent.name,
            prompt: agent.prompt,
            language: "en",
            llm: {
                model: "gpt-4",
                temperature: 0.7
            },
            tts: {
                voice_id: agent.voice_id,
                model: "eleven_turbo_v2",
                stability: 0.8,
                similarity_boost: 0.85,
                style: 0.7
            }
        }, null, 2));

        // Deploy using ConvAI CLI
        const { stdout, stderr } = await execAsync(
            `npx convai add agent "${agent.name}" --config "${configPath}"`
        );

        res.json({
            success: true,
            agent: agent.name,
            output: stdout,
            message: `Agent ${agent.name} deployed successfully`
        });

    } catch (error) {
        console.error('Deployment error:', error);
        res.status(500).json({ error: 'Deployment failed', details: error.message });
    }
});

// Get conversation history
app.get('/api/conversations', async (req, res) => {
    // In production, this would fetch from a database
    res.json({
        conversations: [
            {
                id: 1,
                agent: 'Chef Sophia Romano',
                timestamp: new Date().toISOString(),
                messages: [
                    { role: 'user', content: "What's your signature dish?" },
                    { role: 'agent', content: "Bellissimo! My signature dish is osso buco!" }
                ]
            }
        ]
    });
});

// Test scenario
app.post('/api/scenarios/:type', async (req, res) => {
    const scenarioType = req.params.type;
    const scenarios = {
        dinner_rush: {
            agents: ['sophia', 'marcus', 'diego'],
            messages: [
                { agent: 'sophia', message: "We have 20 orders backed up!" },
                { agent: 'marcus', message: "I'll help coordinate with front of house" },
                { agent: 'diego', message: "¡Vámonos! Let's expedite these orders!" }
            ]
        },
        wine_pairing: {
            agents: ['isabella', 'sophia'],
            messages: [
                { agent: 'isabella', message: "For tonight's special, I suggest a Burgundian Pinot Noir" },
                { agent: 'sophia', message: "Perfetto! It pairs beautifully with my duck confit" }
            ]
        }
    };

    const scenario = scenarios[scenarioType];
    if (!scenario) {
        return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json(scenario);
});

// Intelligence API Endpoints

// Predict customer needs
app.post('/api/intelligence/predict', async (req, res) => {
    const { customerId, context } = req.body;

    try {
        const predictions = await predictiveEngine.predictCustomerNeeds(customerId, context);

        // Share with collective intelligence
        collectiveIntelligence.processAgentCommunication('api', {
            type: 'CUSTOMER_INTERACTION',
            context: context,
            outcome: { predictions }
        });

        res.json(predictions);
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Failed to generate predictions' });
    }
});

// Get collective insights
app.get('/api/intelligence/insights', async (req, res) => {
    try {
        const insights = collectiveIntelligence.generateInsights();
        res.json(insights);
    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

// Forecast demand
app.post('/api/intelligence/forecast', async (req, res) => {
    const { timeframe = 'week' } = req.body;

    try {
        const forecast = await predictiveEngine.forecastDemand(timeframe);
        res.json(forecast);
    } catch (error) {
        console.error('Forecast error:', error);
        res.status(500).json({ error: 'Failed to generate forecast' });
    }
});

// Optimize staffing
app.post('/api/intelligence/optimize-staff', async (req, res) => {
    const { constraints } = req.body;

    try {
        const optimization = await predictiveEngine.optimizeStaffing(constraints);
        res.json(optimization);
    } catch (error) {
        console.error('Optimization error:', error);
        res.status(500).json({ error: 'Failed to optimize staffing' });
    }
});

// Detect anomalies
app.post('/api/intelligence/anomaly', async (req, res) => {
    const { metrics } = req.body;

    try {
        const anomaly = await predictiveEngine.detectAnomalies(metrics);
        res.json(anomaly);
    } catch (error) {
        console.error('Anomaly detection error:', error);
        res.status(500).json({ error: 'Failed to detect anomalies' });
    }
});

// Agent learning endpoint
app.post('/api/intelligence/learn', async (req, res) => {
    const { agentId, interaction } = req.body;

    try {
        collectiveIntelligence.processAgentCommunication(agentId, interaction);
        res.json({ success: true, message: 'Learning recorded' });
    } catch (error) {
        console.error('Learning error:', error);
        res.status(500).json({ error: 'Failed to record learning' });
    }
});

// Generate agent response based on personality
async function generateAgentResponse(agent, message) {
    // In production, this would use GPT-4 or Claude with the agent's prompt
    // For now, we'll use predefined responses based on personality

    const responses = {
        sophia: [
            "Bellissimo! Let me share my passion for Italian cuisine with you.",
            "Perfetto! Every dish must meet my high standards.",
            "Madonna mia! Quality ingredients are everything in my kitchen."
        ],
        marcus: [
            "I'm here to ensure every guest has an exceptional experience.",
            "Let's work together to solve this challenge.",
            "Every guest leaves as a friend - that's our motto!"
        ],
        isabella: [
            "Ah, formidable question! Let me guide you through our wine selection.",
            "The terroir speaks through every glass.",
            "Mais oui! I have the perfect pairing for you."
        ]
    };

    const agentResponses = responses[agent.id] || ["I'm here to help with restaurant operations."];
    const responseText = agentResponses[Math.floor(Math.random() * agentResponses.length)];

    return {
        text: responseText,
        emotion: detectEmotion(message),
        confidence: 0.85 + Math.random() * 0.15
    };
}

// Synthesize speech using ElevenLabs
async function synthesizeSpeech(text, voiceId) {
    if (!ELEVENLABS_API_KEY) {
        console.log('ElevenLabs API key not configured');
        return null;
    }

    try {
        const response = await axios.post(
            `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
            {
                text: text,
                model_id: "eleven_turbo_v2",
                voice_settings: {
                    stability: 0.8,
                    similarity_boost: 0.85,
                    style: 0.7,
                    use_speaker_boost: true
                }
            },
            {
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            }
        );

        // Save audio file
        const audioBuffer = Buffer.from(response.data);
        const filename = `audio_${Date.now()}.mp3`;
        const audioPath = path.join(__dirname, 'temp', filename);

        await fs.mkdir(path.join(__dirname, 'temp'), { recursive: true });
        await fs.writeFile(audioPath, audioBuffer);

        return `/temp/${filename}`;

    } catch (error) {
        console.error('Speech synthesis error:', error.response?.data || error.message);
        return null;
    }
}

// Detect emotion from message
function detectEmotion(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('angry') || lowerMessage.includes('upset') || lowerMessage.includes('terrible')) {
        return 'negative';
    }

    if (lowerMessage.includes('happy') || lowerMessage.includes('great') || lowerMessage.includes('excellent')) {
        return 'positive';
    }

    if (lowerMessage.includes('?')) {
        return 'curious';
    }

    return 'neutral';
}

// WebSocket for real-time communication
const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
        const message = JSON.parse(data);

        if (message.type === 'agent_message') {
            const agent = agentConfigs[message.agentId];
            if (agent) {
                const response = await generateAgentResponse(agent, message.content);
                ws.send(JSON.stringify({
                    type: 'agent_response',
                    agentId: message.agentId,
                    response: response
                }));
            }
        }
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        agents: Object.keys(agentConfigs).length,
        elevenLabsConnected: !!ELEVENLABS_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// Start server
async function startServer() {
    await loadAgentConfigs();
    await db.initialize();
    await db.loadExistingData();

    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║  🍽️   Restaurant Voice Agents API Server                                     ║
║                                                                               ║
║  Server running at: http://localhost:${PORT}                                    ║
║  WebSocket running at: ws://localhost:3001                                   ║
║                                                                               ║
║  Endpoints:                                                                   ║
║  GET  /api/agents           - List all agents                                ║
║  POST /api/agents/:id/test  - Test agent voice                               ║
║  POST /api/agents/:id/deploy - Deploy to ConvAI                              ║
║                                                                               ║
║  Intelligence Features:                                                       ║
║  POST /api/intelligence/predict - Predict customer needs                      ║
║  GET  /api/intelligence/insights - Get collective insights                    ║
║  POST /api/intelligence/forecast - Forecast demand                            ║
║  POST /api/intelligence/optimize-staff - Optimize staffing                    ║
║  POST /api/intelligence/anomaly - Detect anomalies                            ║
║  POST /api/intelligence/learn - Record agent learning                         ║
║                                                                               ║
║  Web Interface: http://localhost:${PORT}/test-voice-agents.html                 ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
        `);
    });
}

startServer();