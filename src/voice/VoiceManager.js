/**
 * Voice Manager for Real-time Speech Processing
 * Handles speech-to-text, text-to-speech, and conversation state
 */

import EventEmitter from 'events';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export class VoiceManager extends EventEmitter {
    constructor() {
        super();
        this.conversations = new Map();
        this.activeStreams = new Map();
        this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
        this.voiceSettings = {
            stability: 0.8,
            similarity_boost: 0.85,
            style: 0.7,
            use_speaker_boost: true
        };
    }

    /**
     * Start a new conversation session
     */
    startConversation(sessionId, agentId, userId = 'anonymous') {
        const conversation = {
            sessionId,
            agentId,
            userId,
            startTime: Date.now(),
            messages: [],
            emotionalState: 'welcoming',
            context: {
                lastInteraction: null,
                topicContext: [],
                preferences: {},
                personalityState: 'baseline'
            }
        };

        this.conversations.set(sessionId, conversation);
        this.emit('conversationStarted', conversation);

        return conversation;
    }

    /**
     * Process speech input and generate response
     */
    async processSpeechInput(sessionId, transcript, audioData = null) {
        const conversation = this.conversations.get(sessionId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Add user message to conversation
        const userMessage = {
            type: 'user',
            content: transcript,
            timestamp: Date.now(),
            audioData: audioData ? audioData.length : null
        };

        conversation.messages.push(userMessage);

        // Analyze speech for emotional context
        const emotionalContext = this.analyzeSpeechEmotion(transcript);

        // Generate agent response
        const agentResponse = await this.generateAgentResponse(
            conversation.agentId,
            transcript,
            conversation,
            emotionalContext
        );

        // Add agent message to conversation
        const agentMessage = {
            type: 'agent',
            content: agentResponse.text,
            timestamp: Date.now(),
            emotion: agentResponse.emotion,
            confidence: agentResponse.confidence,
            personalityFactors: agentResponse.personalityFactors
        };

        conversation.messages.push(agentMessage);

        // Update conversation context
        this.updateConversationContext(conversation, transcript, agentResponse);

        // Emit conversation update
        this.emit('conversationUpdated', {
            sessionId,
            userMessage,
            agentMessage,
            context: conversation.context
        });

        return agentResponse;
    }

    /**
     * Generate agent response with personality
     */
    async generateAgentResponse(agentId, userInput, conversation, emotionalContext) {
        const agentProfiles = await this.getAgentProfiles();
        const agent = agentProfiles[agentId];

        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        // Build context for response generation
        const responseContext = {
            userInput,
            conversationHistory: conversation.messages.slice(-5),
            emotionalState: conversation.emotionalState,
            agentPersonality: agent.personality,
            situationalContext: this.extractSituationalContext(userInput),
            emotionalContext
        };

        // Generate response based on agent personality
        const response = await this.generatePersonalizedResponse(agent, responseContext);

        // Update agent's emotional state
        conversation.emotionalState = this.calculateNewEmotionalState(
            conversation.emotionalState,
            emotionalContext,
            agent.personality
        );

        return response;
    }

    /**
     * Generate personalized response based on agent personality
     */
    async generatePersonalizedResponse(agent, context) {
        const personality = agent.personality;
        const responsePatterns = this.getResponsePatterns(agent.id);

        // Select response style based on personality
        let responseStyle = 'professional';
        if (personality.extraversion > 0.7) responseStyle = 'enthusiastic';
        if (personality.agreeableness > 0.8) responseStyle = 'warm';
        if (personality.conscientiousness > 0.8) responseStyle = 'detailed';
        if (personality.openness > 0.8) responseStyle = 'creative';

        // Generate contextual response
        const baseResponse = this.selectBaseResponse(
            context.userInput,
            responsePatterns,
            responseStyle
        );

        // Add personality-specific touches
        const personalizedResponse = this.addPersonalityTouches(
            baseResponse,
            agent,
            context
        );

        // Calculate confidence based on context match
        const confidence = this.calculateResponseConfidence(
            context.userInput,
            personalizedResponse,
            context.conversationHistory
        );

        return {
            text: personalizedResponse,
            emotion: this.mapToEmotion(context.emotionalContext),
            confidence,
            personalityFactors: {
                style: responseStyle,
                traits: this.getActiveTraits(personality),
                adaptations: this.getPersonalityAdaptations(context)
            }
        };
    }

    /**
     * Get agent personality profiles
     */
    async getAgentProfiles() {
        return {
            sophia: {
                id: 'sophia',
                personality: {
                    extraversion: 0.65,
                    agreeableness: 0.45,
                    conscientiousness: 0.95,
                    neuroticism: 0.55,
                    openness: 0.75
                },
                voice: {
                    accent: 'italian',
                    tempo: 'passionate',
                    vocabulary: 'culinary'
                },
                specialties: ['italian_cuisine', 'quality_control', 'kitchen_management']
            },
            marcus: {
                id: 'marcus',
                personality: {
                    extraversion: 0.85,
                    agreeableness: 0.90,
                    conscientiousness: 0.85,
                    neuroticism: 0.25,
                    openness: 0.70
                },
                voice: {
                    accent: 'american',
                    tempo: 'measured',
                    vocabulary: 'hospitality'
                },
                specialties: ['customer_service', 'problem_solving', 'team_coordination']
            },
            isabella: {
                id: 'isabella',
                personality: {
                    extraversion: 0.60,
                    agreeableness: 0.75,
                    conscientiousness: 0.80,
                    neuroticism: 0.30,
                    openness: 0.90
                },
                voice: {
                    accent: 'french',
                    tempo: 'elegant',
                    vocabulary: 'sophisticated'
                },
                specialties: ['wine_knowledge', 'cultural_education', 'refined_service']
            },
            raj: {
                id: 'raj',
                personality: {
                    extraversion: 0.70,
                    agreeableness: 0.80,
                    conscientiousness: 0.75,
                    neuroticism: 0.35,
                    openness: 0.85
                },
                voice: {
                    accent: 'indian',
                    tempo: 'enthusiastic',
                    vocabulary: 'innovative'
                },
                specialties: ['fusion_cuisine', 'spice_knowledge', 'creative_cooking']
            },
            elena: {
                id: 'elena',
                personality: {
                    extraversion: 0.55,
                    agreeableness: 0.70,
                    conscientiousness: 0.90,
                    neuroticism: 0.40,
                    openness: 0.95
                },
                voice: {
                    accent: 'spanish',
                    tempo: 'gentle',
                    vocabulary: 'artistic'
                },
                specialties: ['pastry_arts', 'dessert_design', 'sweet_creations']
            }
        };
    }

    /**
     * Get response patterns for each agent
     */
    getResponsePatterns(agentId) {
        const patterns = {
            sophia: {
                greetings: [
                    "Ciao! Welcome to my kitchen!",
                    "Buongiorno! What brings you to my domain?",
                    "Ah, wonderful! Let me share my passion with you!"
                ],
                compliments: [
                    "Perfetto! You have excellent taste!",
                    "Magnifico! I can see you appreciate quality!",
                    "Bellissimo! That's exactly what I would choose!"
                ],
                suggestions: [
                    "Let me suggest something that will make your heart sing!",
                    "I have the perfect dish that captures the essence of Italy!",
                    "Trust me, this recipe has been in my family for generations!"
                ],
                concerns: [
                    "Madonna mia! That's not how we do things in my kitchen!",
                    "No, no, no! We must respect the ingredients!",
                    "I understand your concern, but let me explain why quality matters!"
                ]
            },
            marcus: {
                greetings: [
                    "Good evening! It's wonderful to have you with us tonight.",
                    "Welcome! I'm here to ensure your experience is nothing short of exceptional.",
                    "Thank you for choosing us. How may I make your evening special?"
                ],
                problem_solving: [
                    "I completely understand your concern, and I'm here to make this right.",
                    "Let me personally take care of this for you immediately.",
                    "I appreciate you bringing this to my attention. Here's what I can do..."
                ],
                coordination: [
                    "I'll coordinate with our team to ensure everything is perfect.",
                    "Let me speak with the kitchen and get back to you shortly.",
                    "I'm going to personally oversee this to meet our standards."
                ]
            },
            isabella: {
                greetings: [
                    "Bonsoir! I'm delighted to guide you through our wine selection.",
                    "Ah, bonjour! What a pleasure to share the art of wine with you.",
                    "Welcome! Let me introduce you to some magnificent terroirs."
                ],
                wine_education: [
                    "This wine tells a beautiful story of its terroir...",
                    "The winemaker's technique here is absolutely exquisite...",
                    "Notice how the tannins dance with the acidity..."
                ],
                pairings: [
                    "This pairing will create a symphony on your palate...",
                    "The wine will elevate the dish while the food awakens the wine...",
                    "Together, they create something greater than the sum of their parts..."
                ]
            },
            raj: {
                greetings: [
                    "Namaste! I'm excited to take you on a flavor journey!",
                    "Welcome! Let me share some incredible fusion creations with you!",
                    "Great to meet you! I've been experimenting with some amazing combinations!"
                ],
                innovation: [
                    "What if we took this traditional spice and paired it with...",
                    "I've been working on a fusion that combines the best of both worlds...",
                    "This technique transforms familiar flavors into something extraordinary..."
                ],
                enthusiasm: [
                    "Oh, you're going to love this! The flavors are absolutely incredible!",
                    "This is one of my favorite creations - it tells a story with every bite!",
                    "I'm so excited to share this with you - it's pure culinary magic!"
                ]
            },
            elena: {
                greetings: [
                    "Hola! I've been dreaming up something sweet just for you!",
                    "Welcome to my world of dessert artistry!",
                    "Buenos días! Let me paint you a picture with flavors!"
                ],
                creativity: [
                    "Each layer tells a story, building to a beautiful crescendo...",
                    "I design desserts like paintings - every element has meaning...",
                    "This creation is inspired by the colors of a sunset..."
                ],
                craftsmanship: [
                    "The technique here requires patience and precise timing...",
                    "Every detail is carefully crafted to create the perfect moment...",
                    "I temper this chocolate seven times to achieve the perfect snap..."
                ]
            }
        };

        return patterns[agentId] || patterns.marcus;
    }

    /**
     * Select appropriate base response
     */
    selectBaseResponse(userInput, patterns, style) {
        const input = userInput.toLowerCase();

        // Detect intent categories
        if (input.includes('hello') || input.includes('hi') || input.includes('good')) {
            return this.randomSelect(patterns.greetings || patterns.greetings || ["Hello! How can I help you?"]);
        }

        if (input.includes('recommend') || input.includes('suggest') || input.includes('what should')) {
            return this.randomSelect(patterns.suggestions || ["Let me suggest something perfect for you!"]);
        }

        if (input.includes('problem') || input.includes('issue') || input.includes('wrong')) {
            return this.randomSelect(patterns.concerns || patterns.problem_solving || ["I understand your concern. Let me help with that."]);
        }

        if (input.includes('wine') || input.includes('drink') || input.includes('beverage')) {
            return this.randomSelect(patterns.wine_education || patterns.pairings || ["I'd be happy to help with beverage selection!"]);
        }

        if (input.includes('dessert') || input.includes('sweet') || input.includes('cake')) {
            return this.randomSelect(patterns.creativity || patterns.craftsmanship || ["I have some delightful sweet creations to share!"]);
        }

        // Default professional response
        return "I'm here to help you have an amazing experience. What can I do for you?";
    }

    /**
     * Add personality-specific touches to response
     */
    addPersonalityTouches(baseResponse, agent, context) {
        let response = baseResponse;

        // Add personality-specific elements based on traits
        if (agent.personality.extraversion > 0.7) {
            response = this.addEnthusiasm(response);
        }

        if (agent.personality.agreeableness > 0.8) {
            response = this.addWarmth(response);
        }

        if (agent.personality.conscientiousness > 0.8) {
            response = this.addDetailOrientation(response);
        }

        if (agent.personality.openness > 0.8) {
            response = this.addCreativity(response);
        }

        // Add cultural/accent markers
        response = this.addCulturalMarkers(response, agent);

        return response;
    }

    /**
     * Synthesize speech using ElevenLabs
     */
    async synthesizeSpeech(text, agentId) {
        if (!this.elevenLabsApiKey) {
            return { error: 'ElevenLabs API key not configured' };
        }

        const voiceIds = {
            sophia: 'EXAVITQu4vr4xnSDxMaL', // Female, warm
            marcus: 'VR6AewLTigWG4xSOukaG', // Male, professional
            isabella: 'oWAxZDx7w5VEj9dCyTzz', // Female, elegant
            raj: 'pqHfZKP75CvOlQylNhV4', // Male, enthusiastic
            elena: 'Xb7hH8MSUJpSbSDYk0k2'  // Female, gentle
        };

        const voiceId = voiceIds[agentId] || voiceIds.marcus;

        try {
            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                    text: text,
                    model_id: "eleven_turbo_v2",
                    voice_settings: this.voiceSettings
                },
                {
                    headers: {
                        'xi-api-key': this.elevenLabsApiKey,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer'
                }
            );

            // Save audio file
            const audioBuffer = Buffer.from(response.data);
            const filename = `voice_${agentId}_${Date.now()}.mp3`;
            const audioPath = path.join(process.cwd(), 'temp', filename);

            await fs.mkdir(path.join(process.cwd(), 'temp'), { recursive: true });
            await fs.writeFile(audioPath, audioBuffer);

            return {
                audioUrl: `/temp/${filename}`,
                duration: this.estimateAudioDuration(text),
                voiceId
            };

        } catch (error) {
            console.error('ElevenLabs synthesis error:', error.message);
            return { error: 'Speech synthesis failed' };
        }
    }

    /**
     * Helper methods
     */
    randomSelect(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    addEnthusiasm(text) {
        const enthusiasmMarkers = ['!', ' - it\'s amazing!', ' I\'m excited about this!'];
        return text + this.randomSelect(enthusiasmMarkers);
    }

    addWarmth(text) {
        const warmthMarkers = [' I\'m so glad you asked!', ' It would be my pleasure!', ' I\'d love to help with that!'];
        return text + this.randomSelect(warmthMarkers);
    }

    addDetailOrientation(text) {
        return text + ' Let me make sure every detail is perfect for you.';
    }

    addCreativity(text) {
        const creativeMarkers = [' - imagine the possibilities!', ' - it\'s like art on a plate!', ' - each element tells a story!'];
        return text + this.randomSelect(creativeMarkers);
    }

    addCulturalMarkers(text, agent) {
        const markers = {
            sophia: ['Fantastico!', 'Perfetto!', 'Madonna mia!'],
            isabella: ['Magnifique!', 'Formidable!', 'C\'est parfait!'],
            raj: ['Wonderful!', 'Absolutely brilliant!', 'What a treat!'],
            elena: ['Qué maravilloso!', '¡Increíble!', 'Muy bien!']
        };

        if (markers[agent.id] && Math.random() < 0.3) {
            return this.randomSelect(markers[agent.id]) + ' ' + text;
        }

        return text;
    }

    analyzeSpeechEmotion(transcript) {
        // Simple emotion analysis - could be enhanced with ML
        const emotions = {
            positive: ['great', 'wonderful', 'amazing', 'love', 'perfect', 'excellent'],
            negative: ['bad', 'terrible', 'awful', 'hate', 'wrong', 'disappointed'],
            curious: ['what', 'how', 'why', 'tell me', 'explain', 'curious'],
            excited: ['excited', 'wow', 'incredible', 'fantastic', 'awesome']
        };

        const text = transcript.toLowerCase();
        for (const [emotion, keywords] of Object.entries(emotions)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return emotion;
            }
        }

        return 'neutral';
    }

    mapToEmotion(emotionalContext) {
        const mapping = {
            positive: 'joyful',
            negative: 'concerned',
            curious: 'engaged',
            excited: 'enthusiastic',
            neutral: 'professional'
        };

        return mapping[emotionalContext] || 'welcoming';
    }

    estimateAudioDuration(text) {
        // Rough estimate: 150 words per minute, average 5 characters per word
        const wordsPerMinute = 150;
        const avgCharsPerWord = 5;
        const words = text.length / avgCharsPerWord;
        return (words / wordsPerMinute) * 60; // Duration in seconds
    }

    calculateResponseConfidence(userInput, response, history) {
        // Simple confidence calculation based on context matching
        let confidence = 0.7; // Base confidence

        // Higher confidence for specific requests
        if (userInput.includes('recommend') || userInput.includes('suggest')) {
            confidence += 0.1;
        }

        // Higher confidence with conversation history
        if (history.length > 2) {
            confidence += 0.1;
        }

        // Lower confidence for very short inputs
        if (userInput.length < 10) {
            confidence -= 0.2;
        }

        return Math.max(0.3, Math.min(0.95, confidence));
    }

    updateConversationContext(conversation, userInput, agentResponse) {
        conversation.context.lastInteraction = Date.now();
        conversation.context.topicContext.push({
            userIntent: this.extractIntent(userInput),
            agentResponse: agentResponse.text,
            timestamp: Date.now()
        });

        // Keep only last 5 topics
        if (conversation.context.topicContext.length > 5) {
            conversation.context.topicContext.shift();
        }
    }

    extractIntent(userInput) {
        const intents = {
            greeting: ['hello', 'hi', 'good morning', 'good evening'],
            recommendation: ['recommend', 'suggest', 'what should'],
            question: ['what', 'how', 'why', 'when', 'where'],
            compliment: ['great', 'wonderful', 'amazing', 'perfect'],
            complaint: ['problem', 'issue', 'wrong', 'bad']
        };

        const text = userInput.toLowerCase();
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return intent;
            }
        }

        return 'general';
    }

    calculateNewEmotionalState(currentState, emotionalContext, personality) {
        // Simple emotional state transition based on input and personality
        const states = ['welcoming', 'enthusiastic', 'professional', 'concerned', 'joyful'];

        if (emotionalContext === 'positive' && personality.extraversion > 0.7) {
            return 'enthusiastic';
        }

        if (emotionalContext === 'negative' && personality.agreeableness > 0.8) {
            return 'concerned';
        }

        if (emotionalContext === 'excited') {
            return 'joyful';
        }

        return currentState;
    }

    getActiveTraits(personality) {
        const traits = [];
        if (personality.extraversion > 0.7) traits.push('outgoing');
        if (personality.agreeableness > 0.8) traits.push('warm');
        if (personality.conscientiousness > 0.8) traits.push('detailed');
        if (personality.openness > 0.8) traits.push('creative');
        if (personality.neuroticism < 0.4) traits.push('stable');

        return traits;
    }

    getPersonalityAdaptations(context) {
        return {
            formality: context.emotionalContext === 'professional' ? 'high' : 'moderate',
            enthusiasm: context.emotionalContext === 'excited' ? 'high' : 'moderate',
            supportiveness: context.emotionalContext === 'negative' ? 'high' : 'moderate'
        };
    }

    extractSituationalContext(userInput) {
        return {
            timeOfDay: new Date().getHours(),
            inputLength: userInput.length,
            questionType: userInput.includes('?') ? 'question' : 'statement',
            urgency: userInput.includes('urgent') || userInput.includes('quick') ? 'high' : 'normal'
        };
    }

    // Clean up old conversations and files
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const [sessionId, conversation] of this.conversations.entries()) {
            if (now - conversation.startTime > maxAge) {
                this.conversations.delete(sessionId);
            }
        }
    }
}

export default VoiceManager;