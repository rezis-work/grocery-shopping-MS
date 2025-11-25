const { CUSTOMER_BINDING_KEY, SHOPPING_BINDING_KEY } = require('../config');
const ProductService = require('../services/product-service');
const { PublishMessage } = require('../utils');
const UserAuth = require('./middlewares/auth')

module.exports = (app, channel) => {
    
    const service = new ProductService();


    app.post('/product/create', async(req,res,next) => {
        
        try {
            const { name, desc, type, unit,price, available, suplier, banner } = req.body; 
            // validation
            const { data } =  await service.CreateProduct({ name, desc, type, unit,price, available, suplier, banner });
            return res.json(data);
            
        } catch (err) {
            next(err)    
        }
        
    });

    app.get('/product/category/:type', async(req,res,next) => {
        
        const type = req.params.type;
        
        try {
            const { data } = await service.GetProductsByCategory(type)
            return res.status(200).json(data);

        } catch (err) {
            next(err)
        }

    });

    app.get('/product/:id', async(req,res,next) => {
        
        const productId = req.params.id;

        try {
            const { data } = await service.GetProductDescription(productId);
            return res.status(200).json(data);

        } catch (err) {
            next(err)
        }

    });

    app.post('/ids', async(req,res,next) => {

        try {
            const { ids } = req.body;
            const products = await service.GetSelectedProducts(ids);
            return res.status(200).json(products);
            
        } catch (err) {
            next(err)
        }
       
    });
     
    app.put('/product/wishlist',UserAuth, async (req,res,next) => {

        const { _id } = req.user;

        const {data} = await service.GetProductPayload(_id, {productId: req.body._id}, 'ADD_TO_WISHLIST');
        
        try {
            // PublichCustomerEvent(data);
            PublishMessage(channel, CUSTOMER_BINDING_KEY, JSON.stringify(data))
            return res.status(200).json(data.data.product);
        } catch (err) {
            next(err)
        }
    });
    
    app.delete('/product/wishlist/:id',UserAuth, async (req,res,next) => {

        const { _id } = req.user;
        const productId = req.params.id;

        const {data} = await service.GetProductPayload(_id, {productId}, 'REMOVE_FROM_WISHLIST');

        try {
            // PublichCustomerEvent(data);
            PublishMessage(channel, CUSTOMER_BINDING_KEY, JSON.stringify(data))
            return res.status(200).json(data.data.product);
        } catch (err) {
            next(err)
        }
    });


    app.put('/product/cart',UserAuth, async (req,res,next) => {
        
        const { _id } = req.user;

        const {data} = await service.GetProductPayload(_id, {productId: req.body._id, qty: req.body.qty}, 'ADD_TO_CART');
        try {     
            // PublichCustomerEvent(data);
            PublishMessage(channel, SHOPPING_BINDING_KEY, JSON.stringify(data))
            // PublishShoppingEvents(data);
            PublishMessage(channel, SHOPPING_BINDING_KEY, JSON.stringify(data))
            const response = {
                cart: data.data.product,
                unit: data.data.qty
            }
            return res.status(200).json(response);
        } catch (err) {
            next(err)
        }
    });
    
    app.delete('/product/cart/:id',UserAuth, async (req,res,next) => {

        const { _id } = req.user;
        const productId = req.params.id;

        const {data} = await service.GetProductPayload(_id, {productId}, 'REMOVE_FROM_CART');

        try {
            // PublichCustomerEvent(data);
            PublishMessage(channel, CUSTOMER_BINDING_KEY, JSON.stringify(data))
            // PublishShoppingEvents(data);
            PublishMessage(channel, SHOPPING_BINDING_KEY, JSON.stringify(data))

            const response = {
                cart: data.data.product,
                unit: data.data.qty
            }
            return res.status(200).json(response);
        } catch (err) {
            next(err)
        }
    });

    //get Top products and category
    app.get('/product', async (req,res,next) => {
        //check validation
        try {
            const { data} = await service.GetProducts();        
            return res.status(200).json(data);
        } catch (error) {
            next(err)
        }
        
    });
    
}