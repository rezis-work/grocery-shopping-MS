const { ShoppingRepository } = require("../database");
const { FormateData } = require("../utils");
const { APIError, STATUS_CODES } = require("../utils/app-errors");

// All Business logic will be here
class ShoppingService {
  constructor() {
    this.repository = new ShoppingRepository();
  }

  async getCart({_id}) {

    try {
      const cartItems = await this.repository.Cart(_id);
      return FormateData(cartItems); 
    } catch (error) {
      throw new APIError("Data Not found", STATUS_CODES.INTERNAL_ERROR, error);
    }
  }

  async GetCart({_id}) {
    try {
      const cartItems = await this.repository.Cart(_id);
      return FormateData(cartItems);
    } catch (error) {
      throw new APIError("Data Not found", STATUS_CODES.INTERNAL_ERROR, error);
    }
  }

  async PlaceOrder(userInput) {
    const { _id, txnNumber } = userInput;

    // Verify the txn number with payment logs

    try {
      const orderResult = await this.repository.CreateNewOrder(_id, txnNumber);
      
      // Check if order was created successfully
      if (!orderResult || Object.keys(orderResult).length === 0 || !orderResult.orderId) {
        throw new Error('Order creation failed - no order returned');
      }
      
      return FormateData(orderResult);
    } catch (err) {
      throw new APIError("Data Not found", STATUS_CODES.INTERNAL_ERROR, err.message || err);
    }
  }

  async GetOrders(customerId) {
    try {
      const orders = await this.repository.Orders(customerId);
      return FormateData(orders);
    } catch (err) {
      throw new APIError("Data Not found", err);
    }
  }

  async ManageCart(customerId, item, qty, isRemove){
    try {
      const cartResult = await this.repository.AddCartItem(customerId, item, qty, isRemove);
      return FormateData(cartResult);
    } catch (error) {
      throw new APIError("Data Not found", STATUS_CODES.INTERNAL_ERROR, error);
    }
  }

  async SubscribeEvents(payload){
    if (!payload) {
        throw new Error('Payload is required');
    }

    const { event, data } = payload;

    if (!data) {
        console.error('SubscribeEvents: payload data is missing');
        return;
    }

    const { userId, product, order, qty } = data;

    try {
        switch(event){
            case 'ADD_TO_CART':
                console.log('Shopping Service: Processing ADD_TO_CART event');
                await this.ManageCart(userId, product, qty, false);
                console.log('Shopping Service: Successfully added to cart');
                break;
            case 'REMOVE_FROM_CART':
                console.log('Shopping Service: Processing REMOVE_FROM_CART event');
                await this.ManageCart(userId, product, qty, true);
                console.log('Shopping Service: Successfully removed from cart');
                break;
            default:
                // Silently ignore events that don't belong to this service
                // (wishlist events are handled by customer service)
                break;
        }
    } catch (error) {
        console.error(`Shopping Service: Error processing event ${event}:`, error.message);
        throw error;
    }
}

async getOrderPayload(userId, order, event) {
  // Check if order is valid (not empty and has required fields)
  if (!order || Object.keys(order).length === 0 || !order.orderId) {
      console.error('Invalid order passed to getOrderPayload:', order);
      throw new Error('Order is invalid or empty');
  }
  
  // order is already the order document from PlaceOrder (after FormateData unwrapping)
  // Convert Mongoose document to plain object if needed
  const orderObj = order.toObject ? order.toObject() : order;
  
  // Map the order fields correctly - orderId is the field name in the model
  const orderData = {
      _id: orderObj.orderId || (orderObj._id ? String(orderObj._id) : undefined),
      amount: orderObj.amount,
      date: orderObj.createdAt || orderObj.date || new Date()
  };
  
  // Validate that we have the required fields
  if (!orderData._id || orderData.amount === undefined) {
      console.error('Order data missing required fields. Order object:', orderObj);
      throw new Error('Order data is incomplete');
  }
  
  const payload = {
      event,
      data: {
          userId,
          order: orderData,
      }
  }
  return FormateData(payload);
}
}

module.exports = ShoppingService;
