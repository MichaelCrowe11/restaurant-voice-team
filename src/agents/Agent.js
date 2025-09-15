import { EventEmitter } from 'events';
import chalk from 'chalk';

export class Agent extends EventEmitter {
  constructor(id, definition) {
    super();
    this.id = id;
    this.name = definition.name;
    this.role = definition.role;
    this.description = definition.description;
    this.specialties = definition.specialties;
    this.personality = definition.personality;
    this.voiceConfig = definition.voiceConfig;
    this.skills = definition.skills;
    this.workingHours = definition.workingHours;

    this.isActive = false;
    this.currentTasks = [];
    this.conversationHistory = [];
    this.status = 'offline';
  }

  async initialize() {
    console.log(chalk.gray(`Initializing ${this.name}...`));
    // Initialize agent-specific configurations
    this.status = 'initialized';
  }

  async activate() {
    this.isActive = true;
    this.status = 'active';
    this.emit('activated', this.id);

    // Start agent's introduction
    await this.introduce();
  }

  async deactivate() {
    this.isActive = false;
    this.status = 'offline';
    this.emit('deactivated', this.id);
  }

  async introduce() {
    const introduction = this.generateIntroduction();
    console.log(chalk.cyan(`\n🎤 ${this.name}: ${introduction}\n`));

    // This would trigger voice synthesis in a real implementation
    this.emit('speak', {
      agentId: this.id,
      text: introduction,
      voiceConfig: this.voiceConfig
    });
  }

  generateIntroduction() {
    const greetings = [
      `Hello! I'm ${this.name}, your ${this.role}.`,
      `Hi there! ${this.name} here, ready to help with ${this.specialties[0]}.`,
      `Greetings! I'm ${this.name}, and I specialize in ${this.role.toLowerCase()}.`
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    return `${greeting} ${this.personality.introPhrase}`;
  }

  async receiveMessage(message) {
    this.conversationHistory.push({
      timestamp: new Date(),
      type: 'received',
      content: message
    });

    const response = await this.processMessage(message);
    return response;
  }

  async processMessage(message) {
    // Process incoming message based on agent's personality and role
    const response = this.generateResponse(message);

    this.conversationHistory.push({
      timestamp: new Date(),
      type: 'sent',
      content: response
    });

    this.emit('respond', {
      agentId: this.id,
      message: response,
      voiceConfig: this.voiceConfig
    });

    return response;
  }

  generateResponse(message) {
    // Generate contextual response based on agent's personality
    const messageType = this.analyzeMessageType(message);

    switch (messageType) {
      case 'question':
        return this.generateQuestionResponse(message);
      case 'request':
        return this.generateRequestResponse(message);
      case 'complaint':
        return this.generateComplaintResponse(message);
      default:
        return this.generateDefaultResponse(message);
    }
  }

  analyzeMessageType(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('?') || lowerMessage.startsWith('what') ||
        lowerMessage.startsWith('how') || lowerMessage.startsWith('when')) {
      return 'question';
    }

    if (lowerMessage.includes('can you') || lowerMessage.includes('please') ||
        lowerMessage.includes('need')) {
      return 'request';
    }

    if (lowerMessage.includes('problem') || lowerMessage.includes('issue') ||
        lowerMessage.includes('wrong') || lowerMessage.includes('unhappy')) {
      return 'complaint';
    }

    return 'general';
  }

  generateQuestionResponse(message) {
    return `${this.personality.responseStyle.question} Let me help you with that. Based on my experience in ${this.role.toLowerCase()}, I'd say...`;
  }

  generateRequestResponse(message) {
    return `${this.personality.responseStyle.request} I'll take care of that right away!`;
  }

  generateComplaintResponse(message) {
    return `${this.personality.responseStyle.complaint} I understand your concern and I'm here to help resolve this.`;
  }

  generateDefaultResponse(message) {
    return `${this.personality.responseStyle.general} How can I assist you today?`;
  }

  async receiveTask(task) {
    this.currentTasks.push({
      id: Date.now(),
      description: task,
      status: 'pending',
      assignedAt: new Date()
    });

    console.log(chalk.yellow(`📋 ${this.name} received task: ${task}`));

    // Process the task based on agent's skills
    await this.processTask(task);
  }

  async processTask(task) {
    // Simulate task processing
    const processingTime = Math.random() * 3000 + 1000; // 1-4 seconds

    setTimeout(() => {
      console.log(chalk.green(`✅ ${this.name} completed task: ${task}`));
      this.emit('taskCompleted', {
        agentId: this.id,
        task: task,
        completedAt: new Date()
      });
    }, processingTime);
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      status: this.status,
      isActive: this.isActive,
      currentTasks: this.currentTasks.length,
      conversationHistory: this.conversationHistory.length
    };
  }

  isAvailable() {
    const now = new Date();
    const currentHour = now.getHours();

    return this.isActive &&
           currentHour >= this.workingHours.start &&
           currentHour < this.workingHours.end;
  }
}