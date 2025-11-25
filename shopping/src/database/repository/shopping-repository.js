const {  ProductModel, OrderModel, CartModel } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { APIError, BadRequestError, STATUS_CODES } = require('../../utils/app-errors')


//Dealing with data base operations
class ShoppingRepository {

    // payment

    async Orders(customerId){
        try{
            const orders = await OrderModel.find({customerId }).populate('items.product');        
            return orders;
        }catch(err){
            throw new APIError('API Error', STATUS_CODES.INTERNAL_ERROR, 'Unable to Find Orders')
        }
    }

    async Cart(customerId){
        try {
            const cartItems = await CartModel.find({
                customerId
            });
    
            if (cartItems) {
                return cartItems;
            }
    
            throw new Error('No Cart Items Found');
        } catch (error) {
            throw new APIError('API Error', STATUS_CODES.INTERNAL_ERROR, 'Unable to Find Cart')
        }
    }

    async AddCartItem(customerId, item, qty, isRemove){
        try {
            const cart = await CartModel.findOne({ customerId });

            const {_id} = item;

            if (cart) {
                let isExist = false;
                let cartItems = cart.items;

                if (cartItems.length > 0) {
                    cartItems.map(item => {
                        if (item.product._id.toString() === _id.toString()) {
                            if (isRemove) {
                                cartItems.splice(cartItems.indexOf(item), 1);
                            } else {
                                item.unit = qty;
                            }
                            isExist = true;
                        }
                    })
                }

                if (!isExist && !isRemove) {
                    cartItems.push({
                        product: {...item},
                        unit: qty
                    })
                }

                cart.items = cartItems;
                return await cart.save();
            } else {
                return await CartModel.create({
                    customerId,
                    items: [{
                        product: {...item},
                        unit: qty
                    }]
                })
            }
        } catch (error) {
            throw new APIError('API Error', STATUS_CODES.INTERNAL_ERROR, 'Unable to Add Cart Item')
        }
    }
 
 
    async CreateNewOrder(customerId, txnId){

        //check transaction for payment Status
        
        try{
            const cart = await CartModel.findOne({ customerId });
    
            if(!cart){
                throw new APIError('API Error', STATUS_CODES.BAD_REQUEST, 'Cart not found for customer')
            }
            
            let amount = 0;   
            let cartItems = cart.items;
    
            if(!cartItems || cartItems.length === 0){
                throw new APIError('API Error', STATUS_CODES.BAD_REQUEST, 'Cart is empty')
            }
            
            //process Order
            cartItems.map(item => {
                amount += parseInt(item.product.price) *  parseInt(item.unit);   
            });
    
            const orderId = uuidv4();
    
            const order = new OrderModel({
                orderId,
                customerId,
                amount,
                txnId,
                status: 'received',
                items: cartItems
            })
    
            cart.items = [];
            
            const orderResult = await order.save();
    
            await cart.save();
    
            return orderResult;

        }catch(err){
            if(err instanceof APIError){
                throw err;
            }
            throw new APIError('API Error', STATUS_CODES.INTERNAL_ERROR, 'Unable to Create Order')
        }
        

    }
}

module.exports = ShoppingRepository;