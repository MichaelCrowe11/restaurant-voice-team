import { Client, Environment } from 'square';
import chalk from 'chalk';

export class SquarePOSIntegration {
  constructor(accessToken, locationId) {
    this.client = new Client({
      accessToken: accessToken,
      environment: process.env.NODE_ENV === 'production'
        ? Environment.Production
        : Environment.Sandbox
    });

    this.locationId = locationId;
    this.ordersApi = this.client.ordersApi;
    this.paymentsApi = this.client.paymentsApi;
    this.catalogApi = this.client.catalogApi;
    this.customersApi = this.client.customersApi;
    this.inventoryApi = this.client.inventoryApi;
  }

  // Get current menu items from Square Catalog
  async getMenuItems() {
    try {
      const response = await this.catalogApi.listCatalogObjects({
        types: ['ITEM'],
        locationIds: [this.locationId]
      });

      const menuItems = response.result.objects?.map(item => ({
        id: item.id,
        name: item.itemData?.name,
        description: item.itemData?.description,
        price: item.itemData?.variations?.[0]?.itemVariationData?.priceMoney?.amount / 100,
        category: item.itemData?.categoryId,
        available: true,
        modifiers: item.itemData?.modifierListInfo
      })) || [];

      console.log(chalk.green(`✅ Loaded ${menuItems.length} menu items from Square`));
      return menuItems;

    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch menu items:'), error);
      return [];
    }
  }

  // Create order for voice agent interaction
  async createOrder(orderData) {
    try {
      const order = {
        locationId: this.locationId,
        lineItems: orderData.items.map(item => ({
          quantity: item.quantity.toString(),
          catalogObjectId: item.catalogId,
          note: item.specialInstructions,
          modifiers: item.modifiers
        })),
        fulfillments: [{
          type: orderData.orderType || 'PICKUP',
          state: 'PROPOSED',
          pickupDetails: {
            recipient: {
              displayName: orderData.customerName,
              phoneNumber: orderData.customerPhone
            },
            scheduleType: orderData.scheduleType || 'ASAP',
            pickupAt: orderData.pickupTime
          }
        }],
        metadata: {
          voice_agent_id: orderData.agentId,
          conversation_id: orderData.conversationId
        }
      };

      const response = await this.ordersApi.createOrder({
        order: order,
        idempotencyKey: `order-${Date.now()}`
      });

      console.log(chalk.green(`✅ Order created: ${response.result.order.id}`));
      return response.result.order;

    } catch (error) {
      console.error(chalk.red('❌ Failed to create order:'), error);
      throw error;
    }
  }

  // Process payment for voice order
  async processPayment(orderId, paymentData) {
    try {
      const payment = {
        sourceId: paymentData.sourceId, // Card nonce from Square Web Payments SDK
        idempotencyKey: `payment-${Date.now()}`,
        amountMoney: {
          amount: paymentData.amount,
          currency: 'USD'
        },
        orderId: orderId,
        locationId: this.locationId,
        note: `Voice order processed by ${paymentData.agentName}`
      };

      const response = await this.paymentsApi.createPayment(payment);

      console.log(chalk.green(`✅ Payment processed: ${response.result.payment.id}`));
      return response.result.payment;

    } catch (error) {
      console.error(chalk.red('❌ Payment failed:'), error);
      throw error;
    }
  }

  // Get real-time inventory for agent responses
  async checkInventory(itemId) {
    try {
      const response = await this.inventoryApi.retrieveInventoryCount(
        itemId,
        this.locationId
      );

      const count = response.result.counts?.[0]?.quantity || '0';

      return {
        itemId: itemId,
        available: parseInt(count) > 0,
        quantity: parseInt(count),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error(chalk.red('❌ Inventory check failed:'), error);
      return { available: true, quantity: null }; // Default to available
    }
  }

  // Create or update customer from voice interaction
  async createCustomer(customerData) {
    try {
      const customer = {
        givenName: customerData.firstName,
        familyName: customerData.lastName,
        phoneNumber: customerData.phone,
        emailAddress: customerData.email,
        note: `Created by voice agent: ${customerData.agentName}`,
        preferences: {
          emailUnsubscribed: false
        }
      };

      const response = await this.customersApi.createCustomer({
        customer: customer,
        idempotencyKey: `customer-${Date.now()}`
      });

      console.log(chalk.green(`✅ Customer created: ${response.result.customer.id}`));
      return response.result.customer;

    } catch (error) {
      console.error(chalk.red('❌ Failed to create customer:'), error);
      throw error;
    }
  }

  // Get order status for agent updates
  async getOrderStatus(orderId) {
    try {
      const response = await this.ordersApi.retrieveOrder(orderId);
      const order = response.result.order;

      return {
        id: order.id,
        status: order.state,
        total: order.totalMoney?.amount / 100,
        items: order.lineItems?.length || 0,
        fulfillmentStatus: order.fulfillments?.[0]?.state,
        estimatedPickupTime: order.fulfillments?.[0]?.pickupDetails?.pickupAt,
        lastUpdated: order.updatedAt
      };

    } catch (error) {
      console.error(chalk.red('❌ Failed to get order status:'), error);
      throw error;
    }
  }

  // Update order (for modifications via voice)
  async updateOrder(orderId, updates) {
    try {
      const response = await this.ordersApi.updateOrder(orderId, {
        order: {
          locationId: this.locationId,
          version: updates.version,
          lineItems: updates.lineItems
        },
        fieldsToClear: updates.fieldsToClear,
        idempotencyKey: `update-${Date.now()}`
      });

      console.log(chalk.green(`✅ Order updated: ${orderId}`));
      return response.result.order;

    } catch (error) {
      console.error(chalk.red('❌ Failed to update order:'), error);
      throw error;
    }
  }

  // Cancel order via voice command
  async cancelOrder(orderId, reason) {
    try {
      const response = await this.ordersApi.updateOrder(orderId, {
        order: {
          locationId: this.locationId,
          state: 'CANCELED',
          version: 1
        },
        idempotencyKey: `cancel-${Date.now()}`
      });

      console.log(chalk.green(`✅ Order canceled: ${orderId}`));
      return {
        success: true,
        orderId: orderId,
        reason: reason,
        canceledAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(chalk.red('❌ Failed to cancel order:'), error);
      throw error;
    }
  }

  // Get daily sales for agent reporting
  async getDailySales(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const response = await this.ordersApi.searchOrders({
        locationIds: [this.locationId],
        query: {
          filter: {
            dateTimeFilter: {
              createdAt: {
                startAt: startOfDay.toISOString(),
                endAt: endOfDay.toISOString()
              }
            },
            stateFilter: {
              states: ['COMPLETED']
            }
          }
        }
      });

      const orders = response.result.orders || [];
      const totalSales = orders.reduce((sum, order) =>
        sum + (order.totalMoney?.amount || 0), 0
      ) / 100;

      return {
        date: date,
        orderCount: orders.length,
        totalSales: totalSales,
        averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
        topItems: this.getTopItems(orders)
      };

    } catch (error) {
      console.error(chalk.red('❌ Failed to get daily sales:'), error);
      return null;
    }
  }

  // Helper to get top selling items
  getTopItems(orders) {
    const itemCounts = {};

    orders.forEach(order => {
      order.lineItems?.forEach(item => {
        const name = item.name || 'Unknown Item';
        itemCounts[name] = (itemCounts[name] || 0) + parseInt(item.quantity);
      });
    });

    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  // Webhook handler for real-time updates
  handleWebhook(eventType, data) {
    console.log(chalk.blue(`📨 Square webhook received: ${eventType}`));

    switch (eventType) {
      case 'order.created':
        this.onOrderCreated(data.order);
        break;
      case 'order.updated':
        this.onOrderUpdated(data.order);
        break;
      case 'payment.created':
        this.onPaymentCreated(data.payment);
        break;
      case 'inventory.count.updated':
        this.onInventoryUpdated(data);
        break;
      default:
        console.log(chalk.gray(`Unhandled event type: ${eventType}`));
    }
  }

  // Event handlers for webhooks
  onOrderCreated(order) {
    console.log(chalk.green(`New order: ${order.id}`));
    // Notify relevant agents about new order
  }

  onOrderUpdated(order) {
    console.log(chalk.blue(`Order updated: ${order.id}`));
    // Update agent knowledge about order status
  }

  onPaymentCreated(payment) {
    console.log(chalk.green(`Payment received: $${payment.amountMoney.amount / 100}`));
    // Confirm payment to customer via agent
  }

  onInventoryUpdated(data) {
    console.log(chalk.yellow(`Inventory updated for item: ${data.catalogObjectId}`));
    // Update agent knowledge about availability
  }
}

// Agent-specific Square integrations
export class AgentSquareHandlers {
  constructor(squareClient) {
    this.square = squareClient;
  }

  // Chef Sophia - Check ingredient availability
  async handleChefInventoryCheck(ingredients) {
    const availability = await Promise.all(
      ingredients.map(ing => this.square.checkInventory(ing.id))
    );

    const unavailable = availability.filter(item => !item.available);

    if (unavailable.length > 0) {
      return {
        available: false,
        message: `Madonna mia! We're out of ${unavailable.map(i => i.itemId).join(', ')}. Let me suggest alternatives.`,
        alternatives: await this.suggestAlternatives(unavailable)
      };
    }

    return {
      available: true,
      message: "Perfetto! All ingredients are available for this dish!"
    };
  }

  // Marcus - Handle customer order
  async handleManagerOrder(orderRequest) {
    try {
      const order = await this.square.createOrder({
        items: orderRequest.items,
        customerName: orderRequest.customerName,
        customerPhone: orderRequest.customerPhone,
        orderType: orderRequest.orderType,
        agentId: 'marcus',
        conversationId: orderRequest.conversationId
      });

      return {
        success: true,
        orderId: order.id,
        message: `Excellent! Your order ${order.id} has been placed. It will be ready in approximately ${this.estimateTime(order)} minutes.`,
        estimatedTime: this.estimateTime(order)
      };

    } catch (error) {
      return {
        success: false,
        message: "I apologize, but there was an issue placing your order. Let me get this sorted out for you immediately."
      };
    }
  }

  // Raj - Financial reporting
  async handleFinancialReport(date) {
    const sales = await this.square.getDailySales(date);

    if (!sales) {
      return {
        success: false,
        message: "I'm unable to retrieve the sales data at this moment."
      };
    }

    return {
      success: true,
      message: `Today's financial summary: ${sales.orderCount} orders totaling $${sales.totalSales.toFixed(2)}. Average order value is $${sales.averageOrderValue.toFixed(2)}. Top seller: ${sales.topItems[0]?.name || 'N/A'}.`,
      data: sales
    };
  }

  // Helper functions
  async suggestAlternatives(unavailableItems) {
    // Logic to suggest alternative items based on similarity
    return [];
  }

  estimateTime(order) {
    // Calculate estimated preparation time based on items
    const baseTime = 15;
    const itemTime = (order.lineItems?.length || 0) * 3;
    return baseTime + itemTime;
  }
}

// Export integration setup
export function setupSquareIntegration(accessToken, locationId) {
  const square = new SquarePOSIntegration(accessToken, locationId);
  const handlers = new AgentSquareHandlers(square);

  return {
    square,
    handlers,

    // Connect to voice agents
    connectToAgents: (agentManager) => {
      // Chef Sophia integration
      agentManager.on('sophia:inventory_check', async (data) => {
        const result = await handlers.handleChefInventoryCheck(data.ingredients);
        agentManager.respondToAgent('sophia', result);
      });

      // Marcus integration
      agentManager.on('marcus:create_order', async (data) => {
        const result = await handlers.handleManagerOrder(data);
        agentManager.respondToAgent('marcus', result);
      });

      // Raj integration
      agentManager.on('raj:financial_report', async (data) => {
        const result = await handlers.handleFinancialReport(data.date || new Date());
        agentManager.respondToAgent('raj', result);
      });

      console.log(chalk.green('✅ Square POS integrated with voice agents'));
    }
  };
}