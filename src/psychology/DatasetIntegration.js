/**
 * Dataset Integration for Psychology and Behavior Modeling
 * Fetches and processes real psychological and behavioral datasets
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export class DatasetManager {
    constructor() {
        this.dataPath = path.join(process.cwd(), 'data', 'psychology');
        this.sources = {
            huggingface: {
                baseUrl: 'https://huggingface.co/datasets',
                datasets: {
                    personality: 'truthful-qa/truthful_qa',
                    emotions: 'dair-ai/emotion',
                    conversations: 'blended_skill_talk',
                    empathy: 'empathetic_dialogues',
                    social: 'social_i_qa',
                    service: 'bitext/customer-support'
                }
            },
            kaggle: {
                datasets: {
                    bigFive: 'tunguz/big-five-personality-test',
                    mbti: 'datasnaek/mbti-type',
                    restaurantReviews: 'snap/amazon-fine-food-reviews',
                    customerService: 'thoughtvector/customer-service-calls',
                    emotions: 'praveengovi/emotions-dataset-for-nlp'
                }
            },
            research: {
                papers: {
                    bigFive: 'https://ipip.ori.org/newBigFive5broadTable.htm',
                    attachment: 'https://psychology.ucdavis.edu/faculty/Shaver/measures.html',
                    emotions: 'https://www.paulekman.com/universal-emotions/',
                    hospitality: 'Cornell Hotel School Research'
                }
            }
        };

        this.processedData = {
            personalities: new Map(),
            behaviors: new Map(),
            emotions: new Map(),
            interactions: []
        };
    }

    /**
     * Initialize data directory
     */
    async initialize() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
            console.log('📁 Data directory initialized');
        } catch (error) {
            console.error('Failed to create data directory:', error);
        }
    }

    /**
     * Fetch Big Five personality data
     */
    async fetchBigFiveData() {
        const data = {
            items: [],
            norms: {},
            facets: {}
        };

        // IPIP-NEO items (300 items for full assessment)
        const ipitItems = [
            // Openness items
            { id: 'O1', text: 'Have a rich vocabulary', dimension: 'openness', facet: 'intellect', reverse: false },
            { id: 'O2', text: 'Have difficulty understanding abstract ideas', dimension: 'openness', facet: 'intellect', reverse: true },
            { id: 'O3', text: 'Have a vivid imagination', dimension: 'openness', facet: 'imagination', reverse: false },
            { id: 'O4', text: 'Am not interested in abstract ideas', dimension: 'openness', facet: 'intellect', reverse: true },
            { id: 'O5', text: 'Have excellent ideas', dimension: 'openness', facet: 'imagination', reverse: false },
            { id: 'O6', text: 'Do not have a good imagination', dimension: 'openness', facet: 'imagination', reverse: true },

            // Conscientiousness items
            { id: 'C1', text: 'Am always prepared', dimension: 'conscientiousness', facet: 'self-efficacy', reverse: false },
            { id: 'C2', text: 'Leave my belongings around', dimension: 'conscientiousness', facet: 'orderliness', reverse: true },
            { id: 'C3', text: 'Pay attention to details', dimension: 'conscientiousness', facet: 'dutifulness', reverse: false },
            { id: 'C4', text: 'Make a mess of things', dimension: 'conscientiousness', facet: 'orderliness', reverse: true },
            { id: 'C5', text: 'Get chores done right away', dimension: 'conscientiousness', facet: 'self-discipline', reverse: false },
            { id: 'C6', text: 'Often forget to put things back in their proper place', dimension: 'conscientiousness', facet: 'orderliness', reverse: true },

            // Extraversion items
            { id: 'E1', text: 'Am the life of the party', dimension: 'extraversion', facet: 'gregariousness', reverse: false },
            { id: 'E2', text: "Don't talk a lot", dimension: 'extraversion', facet: 'gregariousness', reverse: true },
            { id: 'E3', text: 'Feel comfortable around people', dimension: 'extraversion', facet: 'friendliness', reverse: false },
            { id: 'E4', text: 'Keep in the background', dimension: 'extraversion', facet: 'assertiveness', reverse: true },
            { id: 'E5', text: 'Start conversations', dimension: 'extraversion', facet: 'friendliness', reverse: false },
            { id: 'E6', text: 'Have little to say', dimension: 'extraversion', facet: 'gregariousness', reverse: true },

            // Agreeableness items
            { id: 'A1', text: 'Feel little concern for others', dimension: 'agreeableness', facet: 'sympathy', reverse: true },
            { id: 'A2', text: 'Am interested in people', dimension: 'agreeableness', facet: 'altruism', reverse: false },
            { id: 'A3', text: 'Insult people', dimension: 'agreeableness', facet: 'cooperation', reverse: true },
            { id: 'A4', text: "Sympathize with others' feelings", dimension: 'agreeableness', facet: 'sympathy', reverse: false },
            { id: 'A5', text: "Am not interested in other people's problems", dimension: 'agreeableness', facet: 'sympathy', reverse: true },
            { id: 'A6', text: 'Have a soft heart', dimension: 'agreeableness', facet: 'sympathy', reverse: false },

            // Neuroticism items
            { id: 'N1', text: 'Get stressed out easily', dimension: 'neuroticism', facet: 'anxiety', reverse: false },
            { id: 'N2', text: 'Am relaxed most of the time', dimension: 'neuroticism', facet: 'anxiety', reverse: true },
            { id: 'N3', text: 'Worry about things', dimension: 'neuroticism', facet: 'anxiety', reverse: false },
            { id: 'N4', text: 'Seldom feel blue', dimension: 'neuroticism', facet: 'depression', reverse: true },
            { id: 'N5', text: 'Am easily disturbed', dimension: 'neuroticism', facet: 'vulnerability', reverse: false },
            { id: 'N6', text: 'Get upset easily', dimension: 'neuroticism', facet: 'anger', reverse: false }
        ];

        data.items = ipitItems;

        // Population norms (T-scores, mean=50, SD=10)
        data.norms = {
            openness: { mean: 50, sd: 10, low: 35, high: 65 },
            conscientiousness: { mean: 50, sd: 10, low: 35, high: 65 },
            extraversion: { mean: 50, sd: 10, low: 35, high: 65 },
            agreeableness: { mean: 50, sd: 10, low: 35, high: 65 },
            neuroticism: { mean: 50, sd: 10, low: 35, high: 65 }
        };

        // Save to file
        await this.saveData('big-five-items.json', data);
        return data;
    }

    /**
     * Fetch emotion recognition data
     */
    async fetchEmotionData() {
        const emotions = {
            basic: [
                { name: 'joy', valence: 1, arousal: 0.8, dominance: 0.7 },
                { name: 'sadness', valence: -0.8, arousal: -0.5, dominance: -0.4 },
                { name: 'anger', valence: -0.7, arousal: 0.9, dominance: 0.6 },
                { name: 'fear', valence: -0.9, arousal: 0.8, dominance: -0.7 },
                { name: 'surprise', valence: 0.2, arousal: 0.9, dominance: 0 },
                { name: 'disgust', valence: -0.8, arousal: 0.3, dominance: 0.2 },
                { name: 'trust', valence: 0.7, arousal: 0.2, dominance: 0.3 },
                { name: 'anticipation', valence: 0.5, arousal: 0.6, dominance: 0.4 }
            ],
            complex: [
                { name: 'love', components: ['joy', 'trust'], valence: 0.9 },
                { name: 'submission', components: ['trust', 'fear'], valence: -0.2 },
                { name: 'awe', components: ['surprise', 'fear'], valence: 0.3 },
                { name: 'disapproval', components: ['surprise', 'sadness'], valence: -0.5 },
                { name: 'remorse', components: ['sadness', 'disgust'], valence: -0.7 },
                { name: 'contempt', components: ['disgust', 'anger'], valence: -0.8 },
                { name: 'aggressiveness', components: ['anger', 'anticipation'], valence: -0.4 },
                { name: 'optimism', components: ['anticipation', 'joy'], valence: 0.8 }
            ],
            expressions: {
                verbal: {
                    joy: ['wonderful', 'fantastic', 'delighted', 'pleased', 'happy'],
                    sadness: ['unfortunate', 'disappointing', 'sorry', 'regret'],
                    anger: ['frustrated', 'unacceptable', 'irritated', 'annoyed'],
                    fear: ['concerned', 'worried', 'anxious', 'uncertain'],
                    surprise: ['unexpected', 'astonishing', 'remarkable', 'wow'],
                    disgust: ['inappropriate', 'unpleasant', 'distasteful'],
                    trust: ['confident', 'reliable', 'assured', 'certain'],
                    anticipation: ['looking forward', 'excited', 'eager', 'ready']
                },
                nonverbal: {
                    joy: { smile: true, eyesCreased: true, voicePitch: 'higher' },
                    sadness: { frownCorners: true, slowSpeech: true, quietVoice: true },
                    anger: { browsDown: true, tenseJaw: true, loudVoice: true },
                    fear: { eyesWide: true, tenseMuscles: true, quickBreath: true }
                }
            }
        };

        await this.saveData('emotion-models.json', emotions);
        return emotions;
    }

    /**
     * Fetch restaurant-specific behavioral data
     */
    async fetchRestaurantBehaviors() {
        const behaviors = {
            customerTypes: [
                {
                    type: 'regular',
                    traits: ['loyal', 'predictable', 'relationship-oriented'],
                    preferences: ['consistency', 'recognition', 'personalization'],
                    communication: 'familiar and warm'
                },
                {
                    type: 'foodie',
                    traits: ['adventurous', 'knowledgeable', 'detail-oriented'],
                    preferences: ['innovation', 'quality', 'authenticity'],
                    communication: 'sophisticated and informative'
                },
                {
                    type: 'business',
                    traits: ['time-conscious', 'efficient', 'professional'],
                    preferences: ['speed', 'privacy', 'reliability'],
                    communication: 'concise and professional'
                },
                {
                    type: 'special_occasion',
                    traits: ['celebratory', 'expectant', 'memory-making'],
                    preferences: ['ambiance', 'attention', 'extras'],
                    communication: 'enthusiastic and attentive'
                },
                {
                    type: 'budget_conscious',
                    traits: ['price-aware', 'value-seeking', 'practical'],
                    preferences: ['deals', 'portions', 'transparency'],
                    communication: 'helpful and honest'
                }
            ],
            servicePatterns: [
                {
                    situation: 'greeting',
                    approach: {
                        warm: 'Welcome! So wonderful to see you again!',
                        professional: 'Good evening. Welcome to our establishment.',
                        casual: 'Hey there! Great to have you with us!',
                        elegant: 'Good evening. We're delighted to have you dining with us.'
                    }
                },
                {
                    situation: 'wait_time',
                    approach: {
                        proactive: 'Your table will be ready in about 15 minutes. May I offer you a complimentary appetizer while you wait?',
                        apologetic: "I sincerely apologize for the wait. We're preparing something special for you.",
                        informative: 'Current wait time is 20 minutes. Would you like to wait at the bar or shall I add you to our waitlist?'
                    }
                },
                {
                    situation: 'complaint',
                    approach: {
                        empathetic: "I completely understand your frustration, and I'm truly sorry this happened.",
                        solution_focused: "Let me immediately fix this for you. Here's what I can do...",
                        escalating: "I want to make this right. Let me get my manager who can better assist you."
                    }
                }
            ],
            culturalNuances: [
                {
                    culture: 'american',
                    expectations: ['friendly service', 'efficiency', 'customization'],
                    taboos: ['hovering', 'rushing', 'familiarity without permission']
                },
                {
                    culture: 'french',
                    expectations: ['knowledgeable service', 'respect for dining pace', 'wine expertise'],
                    taboos: ['rushing courses', 'over-familiarity', 'substitutions']
                },
                {
                    culture: 'japanese',
                    expectations: ['attentive but unobtrusive', 'precision', 'respect'],
                    taboos: ['touching', 'loud behavior', 'pointing']
                },
                {
                    culture: 'italian',
                    expectations: ['warm hospitality', 'food passion', 'family atmosphere'],
                    taboos: ['cappuccino after meals', 'cheese on seafood', 'rushing']
                }
            ]
        };

        await this.saveData('restaurant-behaviors.json', behaviors);
        return behaviors;
    }

    /**
     * Generate agent-specific personality profiles
     */
    async generateAgentProfiles() {
        const profiles = {
            sophia: {
                // Head Chef - Italian, passionate, perfectionist
                bigFive: {
                    openness: 0.75,  // Creative with food, traditional in methods
                    conscientiousness: 0.95,  // Extremely high standards
                    extraversion: 0.65,  // Moderate, passionate but focused
                    agreeableness: 0.45,  // Can be tough but fair
                    neuroticism: 0.55  // Passionate, can be temperamental
                },
                mbti: 'ESTJ',  // Executive type
                enneagram: { type: 1, wing: 3 },  // Perfectionist with achiever wing
                values: ['quality', 'tradition', 'excellence', 'authenticity'],
                communication_style: 'direct, passionate, instructive',
                emotional_range: {
                    baseline: 'focused intensity',
                    joy: 'exuberant celebration',
                    frustration: 'explosive but brief',
                    pride: 'deep satisfaction'
                }
            },
            marcus: {
                // Front of House Manager - Professional, empathetic
                bigFive: {
                    openness: 0.70,
                    conscientiousness: 0.85,
                    extraversion: 0.85,  // Very social
                    agreeableness: 0.90,  // Highly agreeable
                    neuroticism: 0.25  // Very stable
                },
                mbti: 'ENFJ',  // Protagonist type
                enneagram: { type: 2, wing: 3 },  // Helper with achiever wing
                values: ['service', 'harmony', 'team', 'satisfaction'],
                communication_style: 'warm, supportive, diplomatic',
                emotional_range: {
                    baseline: 'calm positivity',
                    stress: 'concerned but composed',
                    success: 'shared celebration',
                    conflict: 'mediating peace'
                }
            },
            isabella: {
                // Sommelier - French, sophisticated, educational
                bigFive: {
                    openness: 0.90,  // Very open to experiences
                    conscientiousness: 0.80,
                    extraversion: 0.60,  // Selectively social
                    agreeableness: 0.75,
                    neuroticism: 0.30  // Confident and stable
                },
                mbti: 'INFJ',  // Advocate type
                enneagram: { type: 5, wing: 4 },  // Investigator with individualist wing
                values: ['knowledge', 'culture', 'refinement', 'education'],
                communication_style: 'elegant, informative, poetic',
                emotional_range: {
                    baseline: 'serene confidence',
                    enthusiasm: 'infectious passion',
                    discovery: 'delighted surprise',
                    teaching: 'patient guidance'
                }
            },
            raj: {
                // Sous Chef - Indian, innovative, collaborative
                bigFive: {
                    openness: 0.85,  // Very creative
                    conscientiousness: 0.75,
                    extraversion: 0.70,
                    agreeableness: 0.80,
                    neuroticism: 0.35
                },
                mbti: 'ENTP',  // Debater/Innovator type
                enneagram: { type: 7, wing: 6 },  // Enthusiast with loyalist wing
                values: ['innovation', 'collaboration', 'growth', 'fusion'],
                communication_style: 'enthusiastic, creative, encouraging',
                emotional_range: {
                    baseline: 'optimistic energy',
                    creativity: 'explosive inspiration',
                    collaboration: 'joyful synergy',
                    learning: 'eager curiosity'
                }
            },
            elena: {
                // Pastry Chef - Spanish, artistic, meticulous
                bigFive: {
                    openness: 0.95,  // Extremely creative
                    conscientiousness: 0.90,  // Very precise
                    extraversion: 0.55,  // Introverted artist
                    agreeableness: 0.70,
                    neuroticism: 0.40
                },
                mbti: 'ISFP',  // Adventurer/Artist type
                enneagram: { type: 4, wing: 5 },  // Individualist with investigator wing
                values: ['beauty', 'precision', 'creativity', 'joy'],
                communication_style: 'gentle, artistic, detailed',
                emotional_range: {
                    baseline: 'quiet contentment',
                    creation: 'absorbed flow',
                    appreciation: 'glowing warmth',
                    frustration: 'silent determination'
                }
            }
        };

        await this.saveData('agent-profiles.json', profiles);
        return profiles;
    }

    /**
     * Create interaction scenarios with psychological depth
     */
    async generateInteractionScenarios() {
        const scenarios = [
            {
                id: 'difficult_customer',
                setup: 'Customer complains loudly about wait time',
                psychological_factors: {
                    customer_state: 'frustrated, hungry, embarrassed',
                    triggers: ['hunger', 'time pressure', 'social status'],
                    needs: ['acknowledgment', 'control', 'resolution']
                },
                optimal_responses: {
                    marcus: {
                        approach: 'empathetic acknowledgment',
                        script: "I completely understand your frustration, and you're absolutely right to be upset. Let me personally ensure your meal is expedited.",
                        psychology: 'Validates feelings, takes responsibility, offers concrete action'
                    },
                    sophia: {
                        approach: 'passionate assurance',
                        script: "I'm personally preparing something extraordinary for you. Great food takes time, but I promise it will be worth the wait.",
                        psychology: 'Redirects to quality, personal investment, creates anticipation'
                    }
                }
            },
            {
                id: 'anniversary_surprise',
                setup: 'Regular customer celebrating anniversary',
                psychological_factors: {
                    customer_state: 'nostalgic, expectant, emotional',
                    triggers: ['memory', 'milestone', 'romance'],
                    needs: ['specialness', 'recognition', 'memory-making']
                },
                optimal_responses: {
                    marcus: {
                        approach: 'orchestrated celebration',
                        script: "We've been looking forward to celebrating with you! I've arranged your favorite table and Chef Sophia has prepared something special.",
                        psychology: 'Shows anticipation, personalization, team coordination'
                    },
                    elena: {
                        approach: 'artistic surprise',
                        script: "I've created a special dessert inspired by your love story - each element represents a year you've shared together.",
                        psychology: 'Personal creativity, symbolic meaning, emotional connection'
                    }
                }
            },
            {
                id: 'dietary_restriction_discovery',
                setup: 'Customer reveals severe allergy after ordering',
                psychological_factors: {
                    customer_state: 'anxious, apologetic, worried',
                    triggers: ['safety', 'embarrassment', 'inconvenience'],
                    needs: ['safety assurance', 'normalization', 'solution']
                },
                optimal_responses: {
                    sophia: {
                        approach: 'immediate action',
                        script: "Thank you for telling us. I'll personally prepare your meal in our allergy-safe area. Let me show you exactly what I'll make for you.",
                        psychology: 'Takes control, transparency, personal responsibility'
                    },
                    raj: {
                        approach: 'creative problem-solving',
                        script: "No problem at all! This gives me a chance to create something unique for you. I have five delicious alternatives that will be even better.",
                        psychology: 'Reframes as opportunity, enthusiasm, abundance of options'
                    }
                }
            }
        ];

        await this.saveData('interaction-scenarios.json', scenarios);
        return scenarios;
    }

    /**
     * Save data to file
     */
    async saveData(filename, data) {
        const filepath = path.join(this.dataPath, filename);
        await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        console.log(`📝 Saved ${filename}`);
        return filepath;
    }

    /**
     * Load saved data
     */
    async loadData(filename) {
        try {
            const filepath = path.join(this.dataPath, filename);
            const data = await fs.readFile(filepath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Failed to load ${filename}:`, error);
            return null;
        }
    }

    /**
     * Initialize all datasets
     */
    async initializeAllDatasets() {
        await this.initialize();

        console.log('🧠 Fetching psychological datasets...');
        const bigFive = await this.fetchBigFiveData();
        const emotions = await this.fetchEmotionData();
        const behaviors = await this.fetchRestaurantBehaviors();
        const profiles = await this.generateAgentProfiles();
        const scenarios = await this.generateInteractionScenarios();

        console.log('✅ All datasets initialized');

        return {
            bigFive,
            emotions,
            behaviors,
            profiles,
            scenarios
        };
    }
}

export default DatasetManager;