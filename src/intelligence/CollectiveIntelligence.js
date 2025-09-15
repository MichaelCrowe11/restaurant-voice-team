/**
 * Collective Intelligence System
 * Agents learn from each other and share knowledge across the network
 */

import EventEmitter from 'events';
import { WebSocket } from 'ws';
import natural from 'natural';

export class CollectiveIntelligence extends EventEmitter {
  constructor() {
    super();
    this.knowledge = new Map();
    this.patterns = new Map();
    this.insights = [];
    this.sharedMemory = new SharedMemory();
    this.learningRate = 0.1;
    this.agents = new Map();

    // Neural network for pattern recognition
    this.brain = {
      customerPatterns: new Map(),
      operationalInsights: new Map(),
      crisisResponses: new Map(),
      successPatterns: new Map()
    };

    this.initializeCollectiveNetwork();
  }

  initializeCollectiveNetwork() {
    // Connect all agents in a mesh network
    this.meshNetwork = new WebSocket.Server({ port: 8765 });

    this.meshNetwork.on('connection', (ws, req) => {
      const agentId = this.extractAgentId(req);
      this.agents.set(agentId, ws);

      ws.on('message', (data) => {
        this.processAgentCommunication(agentId, JSON.parse(data));
      });

      // Share collective knowledge with new agent
      this.syncAgentKnowledge(agentId);
    });
  }

  /**
   * Agents share experiences and learn from each other
   */
  processAgentCommunication(agentId, data) {
    const { type, context, outcome, emotion, learning } = data;

    switch(type) {
      case 'CUSTOMER_INTERACTION':
        this.learnFromCustomerInteraction(agentId, context, outcome);
        break;

      case 'CRISIS_HANDLED':
        this.learnCrisisManagement(agentId, context, outcome);
        break;

      case 'SUCCESS_PATTERN':
        this.recordSuccessPattern(agentId, context, outcome);
        break;

      case 'EMOTIONAL_READ':
        this.updateEmotionalIntelligence(agentId, emotion, outcome);
        break;

      case 'COLLABORATIVE_SOLUTION':
        this.enhanceCollaborationPatterns(data);
        break;
    }

    // Broadcast learnings to all agents
    this.broadcastLearning(agentId, learning);
  }

  /**
   * Learn from customer interactions across all agents
   */
  learnFromCustomerInteraction(agentId, context, outcome) {
    const pattern = {
      situation: context.situation,
      customerMood: context.mood,
      approach: context.approach,
      result: outcome.satisfaction,
      timestamp: Date.now()
    };

    // Store in collective memory
    if (!this.brain.customerPatterns.has(context.situation)) {
      this.brain.customerPatterns.set(context.situation, []);
    }

    this.brain.customerPatterns.get(context.situation).push(pattern);

    // Analyze for best practices
    if (outcome.satisfaction > 0.8) {
      this.extractBestPractice(pattern);
    }

    // Share with relevant agents
    this.notifyRelevantAgents(context.situation, pattern);
  }

  /**
   * Crisis management learning
   */
  learnCrisisManagement(agentId, context, outcome) {
    const crisis = {
      type: context.crisisType,
      severity: context.severity,
      response: context.actions,
      resolution: outcome.resolved,
      timeToResolve: outcome.duration,
      agentsInvolved: context.agentsInvolved
    };

    // Rate the response effectiveness
    const effectiveness = this.calculateEffectiveness(crisis);

    if (effectiveness > 0.7) {
      this.brain.crisisResponses.set(context.crisisType, crisis);

      // Create crisis playbook
      this.updateCrisisPlaybook(context.crisisType, crisis);
    }

    // Train all agents on this scenario
    this.distributeTraining('crisis', crisis);
  }

  /**
   * Record and analyze success patterns
   */
  recordSuccessPattern(agentId, context, outcome) {
    const pattern = {
      id: `success_${Date.now()}`,
      agent: agentId,
      action: context.action,
      conditions: context.conditions,
      result: outcome,
      replicable: true
    };

    // Check if pattern is consistent across agents
    const similarity = this.findSimilarPatterns(pattern);

    if (similarity.length > 3) {
      // This is a proven pattern
      this.brain.successPatterns.set(pattern.action, {
        ...pattern,
        confidence: similarity.length / this.agents.size,
        variations: similarity
      });

      // Create standard operating procedure
      this.createSOP(pattern);
    }
  }

  /**
   * Emotional intelligence updates
   */
  updateEmotionalIntelligence(agentId, emotion, outcome) {
    const emotionalData = {
      detected: emotion.detected,
      response: emotion.response,
      effectiveness: outcome.effectiveness,
      customerFeedback: outcome.feedback
    };

    // Update emotional response matrix
    this.sharedMemory.updateEmotionalMatrix(emotionalData);

    // Share emotional intelligence improvements
    this.broadcastEmotionalLearning(emotionalData);
  }

  /**
   * Enhance collaboration between agents
   */
  enhanceCollaborationPatterns(data) {
    const collaboration = {
      agents: data.agents,
      task: data.task,
      coordination: data.coordination,
      outcome: data.outcome
    };

    // Identify optimal agent combinations
    const teamEffectiveness = this.analyzeTeamDynamics(collaboration);

    if (teamEffectiveness > 0.85) {
      this.updateTeamFormations(collaboration.agents, collaboration.task);
    }
  }

  /**
   * Predictive capabilities based on collective learning
   */
  predictNextAction(context) {
    const predictions = [];

    // Analyze historical patterns
    const similarSituations = this.findSimilarContext(context);

    similarSituations.forEach(situation => {
      predictions.push({
        action: situation.bestAction,
        probability: situation.successRate,
        confidence: situation.dataPoints / 100
      });
    });

    // Sort by probability and confidence
    return predictions.sort((a, b) =>
      (b.probability * b.confidence) - (a.probability * a.confidence)
    );
  }

  /**
   * Generate insights from collective data
   */
  generateInsights() {
    const insights = {
      peakHours: this.analyzePeakPerformance(),
      customerPreferences: this.analyzePreferences(),
      operationalBottlenecks: this.identifyBottlenecks(),
      teamSynergies: this.analyzeTeamSynergies(),
      growthOpportunities: this.identifyOpportunities()
    };

    return insights;
  }

  /**
   * Distribute learning across all agents
   */
  broadcastLearning(sourceAgent, learning) {
    const message = {
      type: 'COLLECTIVE_LEARNING',
      source: sourceAgent,
      learning: learning,
      timestamp: Date.now()
    };

    this.agents.forEach((ws, agentId) => {
      if (agentId !== sourceAgent && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Create self-improving feedback loop
   */
  selfImprove() {
    setInterval(() => {
      // Analyze all interactions
      const performance = this.analyzePerformance();

      // Identify areas for improvement
      const improvements = this.identifyImprovements(performance);

      // Update agent behaviors
      improvements.forEach(improvement => {
        this.updateAgentBehavior(improvement);
      });

      // Prune ineffective patterns
      this.pruneIneffectivePatterns();

      // Strengthen successful patterns
      this.reinforceSuccessPatterns();

    }, 3600000); // Every hour
  }
}

/**
 * Shared Memory System for persistent knowledge
 */
class SharedMemory {
  constructor() {
    this.customerProfiles = new Map();
    this.operationalData = new Map();
    this.emotionalMatrix = new Map();
    this.relationships = new Graph();
  }

  updateCustomerProfile(customerId, interaction) {
    if (!this.customerProfiles.has(customerId)) {
      this.customerProfiles.set(customerId, {
        id: customerId,
        preferences: [],
        interactions: [],
        sentiment: 0,
        lifetime_value: 0,
        special_dates: [],
        allergies: [],
        favorite_items: []
      });
    }

    const profile = this.customerProfiles.get(customerId);
    profile.interactions.push(interaction);
    profile.sentiment = this.calculateSentiment(profile.interactions);

    // Extract preferences from interactions
    this.extractPreferences(profile, interaction);

    return profile;
  }

  updateEmotionalMatrix(data) {
    const key = `${data.detected}_${data.response}`;

    if (!this.emotionalMatrix.has(key)) {
      this.emotionalMatrix.set(key, {
        effectiveness: [],
        count: 0
      });
    }

    const matrix = this.emotionalMatrix.get(key);
    matrix.effectiveness.push(data.effectiveness);
    matrix.count++;

    // Calculate average effectiveness
    const avg = matrix.effectiveness.reduce((a, b) => a + b, 0) / matrix.effectiveness.length;
    matrix.averageEffectiveness = avg;
  }

  calculateSentiment(interactions) {
    const sentiments = interactions.map(i => i.sentiment || 0);
    const recent = sentiments.slice(-10); // Weight recent interactions more

    const weightedSum = recent.reduce((sum, sentiment, index) => {
      const weight = (index + 1) / recent.length; // More recent = higher weight
      return sum + (sentiment * weight);
    }, 0);

    return weightedSum / recent.length;
  }

  extractPreferences(profile, interaction) {
    // Natural language processing to extract preferences
    const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

    if (interaction.items) {
      interaction.items.forEach(item => {
        const sentiment = analyzer.getSentiment(interaction.feedback || '');

        if (sentiment > 0) {
          if (!profile.favorite_items.includes(item)) {
            profile.favorite_items.push(item);
          }
        }
      });
    }

    // Extract dietary preferences
    if (interaction.notes) {
      const dietary = this.extractDietaryInfo(interaction.notes);
      profile.allergies = [...new Set([...profile.allergies, ...dietary.allergies])];
      profile.preferences = [...new Set([...profile.preferences, ...dietary.preferences])];
    }
  }

  extractDietaryInfo(text) {
    const allergies = [];
    const preferences = [];

    const allergyKeywords = ['allergic', 'allergy', 'intolerant', 'cannot eat'];
    const preferenceKeywords = ['vegetarian', 'vegan', 'kosher', 'halal', 'gluten-free'];

    // Simple extraction - could be enhanced with NLP
    allergyKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        // Extract the food item mentioned after the keyword
        const match = text.match(new RegExp(`${keyword}\\s+to\\s+(\\w+)`, 'i'));
        if (match) allergies.push(match[1]);
      }
    });

    preferenceKeywords.forEach(pref => {
      if (text.toLowerCase().includes(pref)) {
        preferences.push(pref);
      }
    });

    return { allergies, preferences };
  }
}

/**
 * Graph structure for relationship mapping
 */
class Graph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(id, data) {
    this.nodes.set(id, data);
    if (!this.edges.has(id)) {
      this.edges.set(id, new Set());
    }
  }

  addEdge(from, to, weight = 1) {
    this.edges.get(from).add({ to, weight });
  }

  findStrongestConnections(nodeId, limit = 5) {
    const connections = Array.from(this.edges.get(nodeId) || []);
    return connections
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }
}

// Export the system
export default CollectiveIntelligence;