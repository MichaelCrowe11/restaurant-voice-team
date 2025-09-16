/**
 * Database configuration for production deployment
 */

import fs from 'fs/promises';
import path from 'path';

export class DatabaseManager {
    constructor() {
        this.dataPath = process.env.DATA_PATH || path.join(process.cwd(), 'data');
        this.isProduction = process.env.NODE_ENV === 'production';

        // In-memory storage for development/demo
        this.memory = {
            customers: new Map(),
            interactions: [],
            insights: new Map(),
            agentStates: new Map()
        };
    }

    async initialize() {
        if (this.isProduction && process.env.DATABASE_URL) {
            // Initialize PostgreSQL connection
            console.log('🗄️  Connecting to production database...');
            // Add PostgreSQL client here when needed
        } else {
            // Create local data directory
            await fs.mkdir(this.dataPath, { recursive: true });
            console.log('📁 Using file-based storage');
        }
    }

    // Customer management
    async saveCustomer(customerId, data) {
        if (this.isProduction) {
            // Save to PostgreSQL
            return this.saveToDatabase('customers', customerId, data);
        } else {
            // Save to memory and file
            this.memory.customers.set(customerId, data);
            await this.saveToFile('customers.json', Object.fromEntries(this.memory.customers));
            return data;
        }
    }

    async getCustomer(customerId) {
        if (this.isProduction) {
            return this.getFromDatabase('customers', customerId);
        } else {
            return this.memory.customers.get(customerId);
        }
    }

    // Interaction logging
    async logInteraction(interaction) {
        if (this.isProduction) {
            return this.saveToDatabase('interactions', null, interaction);
        } else {
            this.memory.interactions.push({
                ...interaction,
                timestamp: new Date().toISOString(),
                id: Date.now().toString()
            });
            await this.saveToFile('interactions.json', this.memory.interactions);
            return interaction;
        }
    }

    async getInteractions(filters = {}) {
        if (this.isProduction) {
            return this.queryDatabase('interactions', filters);
        } else {
            let interactions = [...this.memory.interactions];

            if (filters.agentId) {
                interactions = interactions.filter(i => i.agentId === filters.agentId);
            }

            if (filters.customerId) {
                interactions = interactions.filter(i => i.customerId === filters.customerId);
            }

            if (filters.limit) {
                interactions = interactions.slice(-filters.limit);
            }

            return interactions;
        }
    }

    // Agent state management
    async saveAgentState(agentId, state) {
        if (this.isProduction) {
            return this.saveToDatabase('agent_states', agentId, state);
        } else {
            this.memory.agentStates.set(agentId, {
                ...state,
                lastUpdated: new Date().toISOString()
            });
            await this.saveToFile('agent-states.json', Object.fromEntries(this.memory.agentStates));
            return state;
        }
    }

    async getAgentState(agentId) {
        if (this.isProduction) {
            return this.getFromDatabase('agent_states', agentId);
        } else {
            return this.memory.agentStates.get(agentId);
        }
    }

    // Insights storage
    async saveInsight(type, data) {
        if (this.isProduction) {
            return this.saveToDatabase('insights', type, data);
        } else {
            this.memory.insights.set(type, {
                ...data,
                timestamp: new Date().toISOString()
            });
            await this.saveToFile('insights.json', Object.fromEntries(this.memory.insights));
            return data;
        }
    }

    async getInsights(type = null) {
        if (this.isProduction) {
            return this.queryDatabase('insights', { type });
        } else {
            if (type) {
                return this.memory.insights.get(type);
            }
            return Object.fromEntries(this.memory.insights);
        }
    }

    // File operations for development
    async saveToFile(filename, data) {
        try {
            const filepath = path.join(this.dataPath, filename);
            await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Failed to save ${filename}:`, error);
        }
    }

    async loadFromFile(filename) {
        try {
            const filepath = path.join(this.dataPath, filename);
            const data = await fs.readFile(filepath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    // Database operations for production (placeholder)
    async saveToDatabase(table, id, data) {
        // TODO: Implement PostgreSQL operations
        console.log(`Would save to ${table}:`, { id, data });
        return data;
    }

    async getFromDatabase(table, id) {
        // TODO: Implement PostgreSQL operations
        console.log(`Would get from ${table}:`, id);
        return null;
    }

    async queryDatabase(table, filters) {
        // TODO: Implement PostgreSQL operations
        console.log(`Would query ${table}:`, filters);
        return [];
    }

    // Load existing data on startup
    async loadExistingData() {
        if (!this.isProduction) {
            try {
                const customers = await this.loadFromFile('customers.json');
                if (customers) {
                    this.memory.customers = new Map(Object.entries(customers));
                }

                const interactions = await this.loadFromFile('interactions.json');
                if (interactions) {
                    this.memory.interactions = interactions;
                }

                const agentStates = await this.loadFromFile('agent-states.json');
                if (agentStates) {
                    this.memory.agentStates = new Map(Object.entries(agentStates));
                }

                const insights = await this.loadFromFile('insights.json');
                if (insights) {
                    this.memory.insights = new Map(Object.entries(insights));
                }

                console.log(`📊 Loaded ${this.memory.customers.size} customers, ${this.memory.interactions.length} interactions`);
            } catch (error) {
                console.error('Failed to load existing data:', error);
            }
        }
    }

    // Analytics helpers
    async getAnalytics() {
        const interactions = await this.getInteractions();
        const customers = this.isProduction ?
            await this.queryDatabase('customers', {}) :
            Array.from(this.memory.customers.values());

        return {
            totalCustomers: customers.length,
            totalInteractions: interactions.length,
            averageSentiment: this.calculateAverageSentiment(interactions),
            topAgents: this.getTopPerformingAgents(interactions),
            recentActivity: interactions.slice(-10)
        };
    }

    calculateAverageSentiment(interactions) {
        if (interactions.length === 0) return 0;

        const sentiments = interactions
            .filter(i => i.sentiment !== undefined)
            .map(i => i.sentiment);

        return sentiments.length > 0 ?
            sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0;
    }

    getTopPerformingAgents(interactions) {
        const agentStats = {};

        interactions.forEach(interaction => {
            if (!agentStats[interaction.agentId]) {
                agentStats[interaction.agentId] = {
                    interactions: 0,
                    totalSentiment: 0,
                    positiveInteractions: 0
                };
            }

            const stats = agentStats[interaction.agentId];
            stats.interactions++;

            if (interaction.sentiment !== undefined) {
                stats.totalSentiment += interaction.sentiment;
                if (interaction.sentiment > 0.5) {
                    stats.positiveInteractions++;
                }
            }
        });

        return Object.entries(agentStats)
            .map(([agentId, stats]) => ({
                agentId,
                interactions: stats.interactions,
                averageSentiment: stats.totalSentiment / stats.interactions,
                successRate: stats.positiveInteractions / stats.interactions
            }))
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5);
    }
}

export default DatabaseManager;