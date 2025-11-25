const express = require('express');
const { PORT } = require('./config');
const { databaseConnection } = require('./database');
const expressApp = require('./express-app');
const { CreateChannel } = require('./utils');

const StartServer = async() => {

    const app = express();
    
    await databaseConnection();

    // RabbitMQ connection is optional - service can run with HTTP-based events
    let channel = null;
    try {
        channel = await CreateChannel();
        console.log("RabbitMQ connected successfully");
    } catch (error) {
        console.warn("RabbitMQ connection failed - continuing with HTTP-based events only");
        console.warn("To use RabbitMQ, install and start RabbitMQ server");
        console.warn("Error:", error.message);
    }
    
    await expressApp(app, channel);

    app.listen(PORT, () => {
        console.log(`listening to port ${PORT}`);
    })
    .on('error', (err) => {
        console.log(err);
        process.exit();
    })
}

StartServer();