const CustomerService = require("../services/customer-service");

module.exports = (app) => {
    const service = new CustomerService();

    app.post('/app-events', async (req, res, next) => {

        const extractPayload = (body) => {
            let current = body;
            let depth = 0;

            while (current && !current.event && depth < 5) {
                if (current.payload) {
                    current = current.payload;
                } else if (current.data) {
                    current = current.data;
                } else {
                    break;
                }
                depth++;
            }

            return current;
        }

        const payload = extractPayload(req.body);

        if (!payload || !payload.event || !payload.data) {
            return res.status(400).json({ message: 'Payload is missing event data' });
        }

        try {
            await service.SubscribeEvents(payload);
            console.log("============== Customer service received Event ==============");
            return res.status(200).json(payload);
        } catch (error) {
            next(error);
        }
    })
}