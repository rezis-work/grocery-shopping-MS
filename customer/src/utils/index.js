const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const amqplib = require("amqplib");

const { APP_SECRET, MESSAGE_BROKER_URL, EXCHANGE_NAME, QUEUE_NAME } = require("../config");

//Utility functions
module.exports.GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

module.exports.GeneratePassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

module.exports.ValidatePassword = async (
  enteredPassword,
  savedPassword,
  salt
) => {
  return (await this.GeneratePassword(enteredPassword, salt)) === savedPassword;
};

module.exports.GenerateSignature = async (payload) => {
  try {
    return await jwt.sign(payload, APP_SECRET, { expiresIn: "30d" });
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports.ValidateSignature = async (req) => {
  try {
    const signature = req.get("Authorization");
    console.log(signature);
    const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET);
    req.user = payload;
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports.FormateData = (data) => {
  if (data) {
    return { data };
  } else {
    throw new Error("Data Not found!");
  }
};

// message broker functions

// create a channel

module.exports.CreateChannel = async () => {

  try {
    const connection = await amqplib.connect(MESSAGE_BROKER_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'direct', false);
    console.log("Connected to the message broker");
  return channel;
  } catch (error) {
    throw error;
  }
}


// subscribe messages

module.exports.SubscribeMessage = async (channel, service, binding_key) => {
  if (!channel) {
    console.warn('RabbitMQ channel not available - cannot subscribe to messages');
    return;
  }

  try {
    const appQueue = await channel.assertQueue(QUEUE_NAME);
    console.log(`Customer Service: Subscribed to queue ${QUEUE_NAME} with binding key ${binding_key}`);

    channel.bindQueue(appQueue.queue, EXCHANGE_NAME, binding_key);

    channel.consume(appQueue.queue, async (data) => {
      console.log("Customer Service: Received data");
      console.log(data.content.toString());
      
      try {
        const parsed = JSON.parse(data.content.toString());
        // Check if payload is wrapped in FormateData (has data property with event inside)
        // or if it's already in the correct format (has event property directly)
        let payload;
        if (parsed.event) {
          // Already in correct format: {event: "...", data: {...}}
          payload = parsed;
        } else if (parsed.data && parsed.data.event) {
          // Wrapped in FormateData: {data: {event: "...", data: {...}}}
          payload = parsed.data;
        } else {
          // Fallback: use parsed as-is
          payload = parsed;
        }
        await service.SubscribeEvents(payload);
        channel.ack(data);
      } catch (error) {
        console.error('Error processing message:', error.message);
        channel.ack(data);
      }
    });
  } catch (error) {
    console.error('Error setting up message subscription:', error.message);
  }
}
