const mongoose = require('mongoose');
const { DB_URL } = require('../config');

module.exports = async() => {

    if (!DB_URL) {
        console.error('Error: MONGODB_URI is not set in environment variables');
        console.error('Please create a .env file with MONGODB_URI=mongodb://localhost:27017/shopping');
        process.exit(1);
    }

    try {
        await mongoose.connect(DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
        console.log('Db Connected');
        
    } catch (error) {
        console.log('Error connecting to database ============')
        console.log('DB_URL:', DB_URL);
        console.log('Error:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.error('MongoDB connection refused. Please ensure MongoDB is running.');
        }
        process.exit(1);
    }
 
};

 