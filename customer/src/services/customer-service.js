const { CustomerRepository } = require("../database");
const { FormateData, GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } = require('../utils');
const { APIError, BadRequestError, STATUS_CODES } = require('../utils/app-errors')


// All Business logic will be here
class CustomerService {

    constructor(){
        this.repository = new CustomerRepository();
    }

    async SignIn(userInputs){

        const { email, password } = userInputs;
        
        try {
            
            const existingCustomer = await this.repository.FindCustomer({ email});

            if(existingCustomer){
            
                const validPassword = await ValidatePassword(password, existingCustomer.password, existingCustomer.salt);
                
                if(validPassword){
                    const token = await GenerateSignature({ email: existingCustomer.email, _id: existingCustomer._id});
                    return FormateData({id: existingCustomer._id, token });
                } 
            }
    
            return FormateData(null);

        } catch (err) {
            throw new APIError('Data Not found', STATUS_CODES.INTERNAL_ERROR, err.message || err)
        }

       
    }

    async SignUp(userInputs){
        
        const { email, password, phone } = userInputs;
        
        try{
            // create salt
            let salt = await GenerateSalt();
            
            let userPassword = await GeneratePassword(password, salt);
            
            const existingCustomer = await this.repository.CreateCustomer({ email, password: userPassword, phone, salt});
            
            const token = await GenerateSignature({ email: email, _id: existingCustomer._id});

            return FormateData({id: existingCustomer._id, token });

        }catch(err){
            throw new APIError('Data Not found', STATUS_CODES.INTERNAL_ERROR, err.message || err)
        }

    }

    async AddNewAddress(_id,userInputs){
        
        const { street, postalCode, city,country} = userInputs;
        
        try {
            const addressResult = await this.repository.CreateAddress({ _id, street, postalCode, city,country})
            return FormateData(addressResult);
            
        } catch (err) {
            throw new APIError('Data Not found', STATUS_CODES.INTERNAL_ERROR, err.message || err)
        }
        
    
    }

    async GetProfile(id){

        try {
            const existingCustomer = await this.repository.FindCustomerById({id});
            return FormateData(existingCustomer);
            
        } catch (err) {
            throw new APIError('Data Not found', STATUS_CODES.INTERNAL_ERROR, err.message || err)
        }
    }

    async GetShopingDetails(id){

        try {
            const existingCustomer = await this.repository.FindCustomerById({id});
    
            if(existingCustomer){
               return FormateData(existingCustomer);
            }       
            return FormateData({ msg: 'Error'});
            
        } catch (err) {
            throw new APIError('Data Not found', STATUS_CODES.INTERNAL_ERROR, err.message || err)
        }
    }

    async GetWishList(customerId){

        try {
            const wishListItems = await this.repository.Wishlist(customerId);
            return FormateData(wishListItems);
        } catch (err) {
            throw new APIError('Data Not found', STATUS_CODES.INTERNAL_ERROR, err.message || err)
        }
    }

    async AddToWishlist(customerId, product){
        try {
            const wishlistResult = await this.repository.AddWishlistItem(customerId, product);        
           return FormateData(wishlistResult);
    
        } catch (err) {
            throw new APIError('Data Not found', STATUS_CODES.INTERNAL_ERROR, err.message || err)
        }
    }

    async ManageCart(customerId, product, qty, isRemove){
        try {
            const cartResult = await this.repository.AddCartItem(customerId, product, qty, isRemove);        
            return FormateData(cartResult);
        } catch (err) {
            throw new APIError('Data Not found', STATUS_CODES.INTERNAL_ERROR, err.message || err)
        }
    }

    async ManageOrder(customerId, order){
        try {
            const orderResult = await this.repository.AddOrderToProfile(customerId, order);
            return FormateData(orderResult);
        } catch (err) {
            throw new APIError('Data Not found', STATUS_CODES.INTERNAL_ERROR, err.message || err)
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
                case 'ADD_TO_WISHLIST':
                    console.log('Customer Service: Processing ADD_TO_WISHLIST event');
                    await this.AddToWishlist(userId, product);
                    console.log('Customer Service: Successfully added to wishlist');
                    break;
                case 'REMOVE_FROM_WISHLIST':
                    console.log('Customer Service: Processing REMOVE_FROM_WISHLIST event');
                    await this.AddToWishlist(userId, product);
                    console.log('Customer Service: Successfully removed from wishlist');
                    break;
                case 'ADD_TO_CART':
                    console.log('Customer Service: Processing ADD_TO_CART event');
                    await this.ManageCart(userId, product, qty, false);
                    console.log('Customer Service: Successfully added to cart');
                    break;
                case 'REMOVE_FROM_CART':
                    console.log('Customer Service: Processing REMOVE_FROM_CART event');
                    await this.ManageCart(userId, product, qty, true);
                    console.log('Customer Service: Successfully removed from cart');
                    break;
                case 'CREATE_ORDER':
                    console.log('Customer Service: Processing CREATE_ORDER event');
                    await this.ManageOrder(userId, order);
                    console.log('Customer Service: Successfully created order');
                    break;
                case 'TEST_EVENT':
                    console.log("============== TEST_EVENT received ==============");
                    break;
                default:
                    console.log(`Customer Service: Unknown event type: ${event}`);
                    break;
            }
        } catch (error) {
            console.error(`Customer Service: Error processing event ${event}:`, error.message);
            throw error;
        }
 
    }

}

module.exports = CustomerService;