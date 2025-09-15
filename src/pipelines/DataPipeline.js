import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { EventEmitter } from 'events';

export class DataPipeline extends EventEmitter {
  constructor() {
    super();
    this.datasets = new Map();
    this.processors = new Map();
    this.cache = new Map();
    this.dataPath = path.join(process.cwd(), 'data');
  }

  async initialize() {
    console.log(chalk.blue('🔧 Initializing Data Pipeline...'));

    await this.setupDirectories();
    await this.initializeDataSources();
    await this.initializeProcessors();

    console.log(chalk.green('✅ Data Pipeline ready'));
  }

  async setupDirectories() {
    const directories = [
      'data/raw',
      'data/processed',
      'data/personality',
      'data/restaurant',
      'data/knowledge',
      'data/cache'
    ];

    for (const dir of directories) {
      await fs.mkdir(path.join(process.cwd(), dir), { recursive: true });
    }
  }

  async initializeDataSources() {
    // Hugging Face datasets
    this.datasets.set('huggingface', {
      baseUrl: 'https://datasets-server.huggingface.co/rows',
      datasets: {
        'blended_skill_talk': {
          endpoint: 'blended_skill_talk',
          fields: ['personality', 'previous_utterance', 'utterance'],
          purpose: 'conversational_patterns'
        },
        'bitext_customer_support': {
          endpoint: 'bitext/Bitext-customer-support-llm-chatbot-training-dataset',
          fields: ['intent', 'category', 'text'],
          purpose: 'customer_service'
        },
        'personality_prediction': {
          endpoint: 'Fatima0923/Automated-Personality-Prediction',
          fields: ['text', 'personality_traits'],
          purpose: 'personality_analysis'
        }
      }
    });

    // Big Five personality data sources
    this.datasets.set('personality', {
      sources: [
        {
          name: 'big_five_kaggle',
          url: 'https://www.kaggle.com/datasets/tunguz/big-five-personality-test',
          type: 'csv',
          purpose: 'personality_scoring'
        },
        {
          name: 'openpsychometrics',
          url: 'http://openpsychometrics.org/_rawdata/',
          type: 'data_dump',
          purpose: 'personality_norms'
        }
      ]
    });

    // Restaurant industry data
    this.datasets.set('restaurant', {
      sources: [
        {
          name: 'yelp_reviews',
          type: 'api',
          purpose: 'restaurant_reviews'
        },
        {
          name: 'restaurant_satisfaction',
          url: 'https://www.kaggle.com/datasets/rabieelkharoua/predict-restaurant-customer-satisfaction-dataset',
          type: 'csv',
          purpose: 'satisfaction_metrics'
        }
      ]
    });

    console.log(chalk.blue(`📚 Initialized ${this.datasets.size} data source categories`));
  }

  async initializeProcessors() {
    // Text processing for personality extraction
    this.processors.set('personality_extractor', {
      process: this.extractPersonalityTraits.bind(this),
      inputs: ['text', 'conversational_data'],
      outputs: ['personality_scores', 'trait_indicators']
    });

    // Customer service pattern processor
    this.processors.set('service_pattern_analyzer', {
      process: this.analyzeServicePatterns.bind(this),
      inputs: ['customer_interactions', 'support_tickets'],
      outputs: ['response_patterns', 'service_quality_metrics']
    });

    // Restaurant behavior processor
    this.processors.set('restaurant_behavior_processor', {
      process: this.processRestaurantBehavior.bind(this),
      inputs: ['reviews', 'satisfaction_data', 'operational_data'],
      outputs: ['behavior_patterns', 'service_preferences']
    });

    // Conversational enrichment processor
    this.processors.set('conversation_enricher', {
      process: this.enrichConversationalData.bind(this),
      inputs: ['personality_data', 'role_requirements'],
      outputs: ['enriched_responses', 'conversation_templates']
    });

    console.log(chalk.blue(`⚙️  Initialized ${this.processors.size} data processors`));
  }

  async fetchHuggingFaceData(dataset, limit = 1000) {
    console.log(chalk.cyan(`📥 Fetching data from Hugging Face: ${dataset}`));

    const hfConfig = this.datasets.get('huggingface');
    const datasetConfig = hfConfig.datasets[dataset];

    if (!datasetConfig) {
      throw new Error(`Dataset configuration not found: ${dataset}`);
    }

    try {
      const response = await axios.get(`${hfConfig.baseUrl}`, {
        params: {
          dataset: datasetConfig.endpoint,
          config: 'default',
          split: 'train',
          offset: 0,
          limit: limit
        },
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = response.data.rows.map(row => row.row);
      await this.cacheData(`hf_${dataset}`, data);

      console.log(chalk.green(`✅ Fetched ${data.length} records from ${dataset}`));
      return data;

    } catch (error) {
      console.log(chalk.red(`❌ Failed to fetch ${dataset}: ${error.message}`));
      return [];
    }
  }

  async processPersonalityData() {
    console.log(chalk.cyan('🧠 Processing personality data...'));

    // Fetch conversational personality data
    const blendedSkillData = await this.fetchHuggingFaceData('blended_skill_talk', 5000);

    // Process personality traits from conversations
    const personalityPatterns = await this.extractPersonalityTraits(blendedSkillData);

    // Generate Big Five trait mappings
    const traitMappings = await this.generateTraitMappings(personalityPatterns);

    // Create restaurant-specific personality profiles
    const restaurantProfiles = await this.createRestaurantPersonalities(traitMappings);

    return {
      patterns: personalityPatterns,
      mappings: traitMappings,
      profiles: restaurantProfiles
    };
  }

  async extractPersonalityTraits(conversationalData) {
    const personalityIndicators = {
      openness: {
        high: ['creative', 'imaginative', 'artistic', 'innovative', 'unique', 'original'],
        low: ['traditional', 'conventional', 'practical', 'realistic', 'simple']
      },
      conscientiousness: {
        high: ['organized', 'systematic', 'thorough', 'careful', 'precise', 'punctual'],
        low: ['flexible', 'spontaneous', 'casual', 'relaxed', 'informal']
      },
      extraversion: {
        high: ['outgoing', 'energetic', 'talkative', 'assertive', 'social', 'confident'],
        low: ['quiet', 'reserved', 'thoughtful', 'introspective', 'calm']
      },
      agreeableness: {
        high: ['cooperative', 'trusting', 'helpful', 'sympathetic', 'kind', 'considerate'],
        low: ['competitive', 'skeptical', 'challenging', 'direct', 'frank']
      },
      neuroticism: {
        high: ['anxious', 'worried', 'emotional', 'sensitive', 'stressed'],
        low: ['calm', 'relaxed', 'stable', 'confident', 'secure']
      }
    };

    const extractedTraits = [];

    for (const item of conversationalData) {
      if (!item.utterance) continue;

      const text = item.utterance.toLowerCase();
      const traitScores = {};

      // Score each personality trait based on word indicators
      for (const [trait, indicators] of Object.entries(personalityIndicators)) {
        let score = 5; // Neutral baseline

        // Count high indicators
        const highMatches = indicators.high.filter(word => text.includes(word)).length;
        const lowMatches = indicators.low.filter(word => text.includes(word)).length;

        score += (highMatches * 0.5) - (lowMatches * 0.5);
        score = Math.max(1, Math.min(10, score));

        traitScores[trait] = Math.round(score);
      }

      extractedTraits.push({
        text: item.utterance,
        personality: item.personality || '',
        traits: traitScores,
        context: item.previous_utterance || ''
      });
    }

    console.log(chalk.green(`✅ Extracted personality traits from ${extractedTraits.length} conversations`));
    return extractedTraits;
  }

  async generateTraitMappings(personalityPatterns) {
    const traitMappings = {
      restaurant_roles: {},
      communication_styles: {},
      response_patterns: {}
    };

    // Map traits to restaurant roles
    traitMappings.restaurant_roles = {
      'Head Chef': {
        ideal_traits: { openness: 8, conscientiousness: 9, extraversion: 6, agreeableness: 5, neuroticism: 4 },
        communication: 'passionate_authoritative',
        stress_response: 'focused_intensity'
      },
      'Front Manager': {
        ideal_traits: { openness: 7, conscientiousness: 8, extraversion: 9, agreeableness: 8, neuroticism: 3 },
        communication: 'diplomatic_engaging',
        stress_response: 'calm_leadership'
      },
      'Sommelier': {
        ideal_traits: { openness: 9, conscientiousness: 8, extraversion: 7, agreeableness: 7, neuroticism: 3 },
        communication: 'educational_sophisticated',
        stress_response: 'composed_expertise'
      }
    };

    // Map communication styles
    traitMappings.communication_styles = {
      high_extraversion: {
        greeting: 'enthusiastic_warm',
        explanation: 'detailed_engaging',
        conflict: 'direct_assertive'
      },
      high_agreeableness: {
        greeting: 'warm_welcoming',
        explanation: 'patient_thorough',
        conflict: 'empathetic_solution_focused'
      },
      high_conscientiousness: {
        greeting: 'professional_organized',
        explanation: 'systematic_precise',
        conflict: 'structured_methodical'
      }
    };

    // Generate response patterns based on trait combinations
    for (const pattern of personalityPatterns) {
      const traits = pattern.traits;
      const dominantTrait = Object.entries(traits).reduce((a, b) => traits[a[0]] > traits[b[0]] ? a : b);

      if (!traitMappings.response_patterns[dominantTrait[0]]) {
        traitMappings.response_patterns[dominantTrait[0]] = [];
      }

      traitMappings.response_patterns[dominantTrait[0]].push({
        input: pattern.context,
        response: pattern.text,
        score: dominantTrait[1]
      });
    }

    return traitMappings;
  }

  async createRestaurantPersonalities(traitMappings) {
    const restaurantPersonalities = {};

    for (const [role, config] of Object.entries(traitMappings.restaurant_roles)) {
      restaurantPersonalities[role] = {
        core_traits: config.ideal_traits,
        behavioral_patterns: await this.generateBehavioralPatterns(config),
        communication_preferences: await this.generateCommunicationPreferences(config),
        stress_responses: await this.generateStressResponses(config),
        customer_interaction_style: await this.generateInteractionStyle(config)
      };
    }

    return restaurantPersonalities;
  }

  async generateBehavioralPatterns(roleConfig) {
    return {
      decision_making: roleConfig.ideal_traits.conscientiousness > 7 ? 'systematic_thorough' : 'intuitive_flexible',
      team_interaction: roleConfig.ideal_traits.agreeableness > 7 ? 'collaborative_supportive' : 'direct_efficient',
      problem_solving: roleConfig.ideal_traits.openness > 7 ? 'creative_innovative' : 'practical_proven',
      work_style: roleConfig.ideal_traits.extraversion > 7 ? 'energetic_social' : 'focused_independent'
    };
  }

  async generateCommunicationPreferences(roleConfig) {
    return {
      tone: roleConfig.ideal_traits.agreeableness > 7 ? 'warm_friendly' : 'professional_direct',
      detail_level: roleConfig.ideal_traits.conscientiousness > 7 ? 'comprehensive_detailed' : 'concise_essential',
      interaction_frequency: roleConfig.ideal_traits.extraversion > 7 ? 'frequent_engaging' : 'purposeful_efficient',
      feedback_style: roleConfig.ideal_traits.agreeableness > 6 ? 'constructive_supportive' : 'direct_honest'
    };
  }

  async generateStressResponses(roleConfig) {
    return {
      high_pressure: roleConfig.ideal_traits.neuroticism < 4 ? 'calm_composed' : 'focused_intense',
      criticism: roleConfig.ideal_traits.agreeableness > 7 ? 'receptive_learning' : 'defensive_explanatory',
      change: roleConfig.ideal_traits.openness > 7 ? 'adaptive_excited' : 'cautious_systematic',
      conflict: roleConfig.ideal_traits.extraversion > 7 ? 'direct_engagement' : 'diplomatic_mediation'
    };
  }

  async generateInteractionStyle(roleConfig) {
    return {
      customer_approach: roleConfig.ideal_traits.extraversion > 7 ? 'proactive_engaging' : 'responsive_attentive',
      service_philosophy: roleConfig.ideal_traits.conscientiousness > 8 ? 'perfection_oriented' : 'satisfaction_focused',
      problem_resolution: roleConfig.ideal_traits.agreeableness > 7 ? 'empathy_first' : 'solution_first',
      upselling_style: roleConfig.ideal_traits.extraversion > 6 ? 'enthusiastic_recommendation' : 'informative_suggestion'
    };
  }

  async processCustomerServiceData() {
    console.log(chalk.cyan('📞 Processing customer service data...'));

    // Fetch customer service training data
    const customerServiceData = await this.fetchHuggingFaceData('bitext_customer_support', 3000);

    // Analyze service patterns
    const servicePatterns = await this.analyzeServicePatterns(customerServiceData);

    return servicePatterns;
  }

  async analyzeServicePatterns(serviceData) {
    const patterns = {
      intents: new Map(),
      response_templates: new Map(),
      escalation_triggers: [],
      satisfaction_indicators: []
    };

    for (const item of serviceData) {
      if (!item.intent || !item.text) continue;

      // Categorize intents
      if (!patterns.intents.has(item.intent)) {
        patterns.intents.set(item.intent, []);
      }
      patterns.intents.get(item.intent).push(item.text);

      // Extract response templates
      if (item.category === 'RESTAURANT' || item.category === 'HOSPITALITY') {
        if (!patterns.response_templates.has(item.intent)) {
          patterns.response_templates.set(item.intent, []);
        }
        patterns.response_templates.get(item.intent).push(item.text);
      }
    }

    console.log(chalk.green(`✅ Analyzed ${patterns.intents.size} service intent categories`));
    return patterns;
  }

  async enrichConversationalData(personalityData, roleRequirements) {
    console.log(chalk.cyan('💬 Enriching conversational data...'));

    const enrichedData = {
      response_variations: new Map(),
      context_adaptations: new Map(),
      personality_expressions: new Map()
    };

    // Generate response variations for each personality type
    for (const [role, personality] of Object.entries(personalityData.profiles || {})) {
      const variations = await this.generateResponseVariations(personality, roleRequirements[role]);
      enrichedData.response_variations.set(role, variations);

      const adaptations = await this.generateContextAdaptations(personality);
      enrichedData.context_adaptations.set(role, adaptations);

      const expressions = await this.generatePersonalityExpressions(personality);
      enrichedData.personality_expressions.set(role, expressions);
    }

    return enrichedData;
  }

  async generateResponseVariations(personality, roleRequirements) {
    const variations = {
      greeting: [],
      acknowledgment: [],
      explanation: [],
      apology: [],
      enthusiasm: [],
      concern: []
    };

    // Generate greetings based on personality
    if (personality.core_traits.extraversion > 7) {
      variations.greeting.push("Hello there! Great to see you!", "Welcome! I'm so excited to help you today!");
    } else {
      variations.greeting.push("Hello, how may I assist you?", "Good day, what can I help you with?");
    }

    // Generate acknowledgments
    if (personality.core_traits.agreeableness > 7) {
      variations.acknowledgment.push("I completely understand", "That makes perfect sense", "I hear you");
    } else {
      variations.acknowledgment.push("I see", "Understood", "Got it");
    }

    return variations;
  }

  async generateContextAdaptations(personality) {
    return {
      busy_period: personality.core_traits.conscientiousness > 7 ?
        "I appreciate your patience during our busy time. I'll ensure you receive our full attention." :
        "Thanks for waiting! Let me take great care of you now.",

      special_occasion: personality.core_traits.agreeableness > 7 ?
        "How wonderful! I'd love to help make this celebration extra special." :
        "Congratulations! Let me see what we can do to enhance your experience.",

      complaint: personality.core_traits.neuroticism < 4 ?
        "I'm sorry this happened. Let me fix this right away." :
        "Oh no! I'm so concerned about this. Please let me make it right immediately."
    };
  }

  async generatePersonalityExpressions(personality) {
    const expressions = {
      excitement: [],
      concern: [],
      confidence: [],
      empathy: []
    };

    // High openness expressions
    if (personality.core_traits.openness > 7) {
      expressions.excitement.push("How exciting!", "That's fascinating!", "What an interesting choice!");
    }

    // High agreeableness expressions
    if (personality.core_traits.agreeableness > 7) {
      expressions.empathy.push("I can really understand that", "That must be important to you", "I feel the same way");
    }

    return expressions;
  }

  async cacheData(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: new Date(),
      size: JSON.stringify(data).length
    });

    // Also save to disk
    const cachePath = path.join(this.dataPath, 'cache', `${key}.json`);
    await fs.writeFile(cachePath, JSON.stringify(data, null, 2));
  }

  async getCachedData(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key).data;
    }

    // Try to load from disk
    const cachePath = path.join(this.dataPath, 'cache', `${key}.json`);
    try {
      const data = await fs.readFile(cachePath, 'utf8');
      const parsedData = JSON.parse(data);
      this.cache.set(key, {
        data: parsedData,
        timestamp: new Date(),
        size: data.length
      });
      return parsedData;
    } catch (error) {
      return null;
    }
  }

  async runFullEnrichmentPipeline() {
    console.log(chalk.blue('🚀 Running full enrichment pipeline...'));

    const results = {};

    try {
      // Process personality data
      results.personality = await this.processPersonalityData();

      // Process customer service data
      results.customerService = await this.processCustomerServiceData();

      // Enrich conversational data
      results.conversational = await this.enrichConversationalData(
        results.personality,
        { /* role requirements would be passed here */ }
      );

      // Cache the complete results
      await this.cacheData('full_enrichment_results', results);

      console.log(chalk.green('✅ Full enrichment pipeline completed'));
      return results;

    } catch (error) {
      console.log(chalk.red(`❌ Pipeline failed: ${error.message}`));
      throw error;
    }
  }

  getStatus() {
    return {
      datasets: this.datasets.size,
      processors: this.processors.size,
      cacheSize: this.cache.size,
      totalCachedItems: Array.from(this.cache.values()).reduce((sum, item) => sum + (item.data?.length || 0), 0)
    };
  }
}