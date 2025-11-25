# Shopping Microservices Application

A microservices-based e-commerce application built with Node.js, Express, and MongoDB. This project demonstrates a distributed architecture with event-driven communication between services.

## 🏗️ Architecture

The application consists of four main services:

- **Gateway Service** (Port 8000) - API Gateway that routes requests to appropriate microservices
- **Customer Service** (Port 8001) - Manages customer accounts, authentication, addresses, wishlists, and orders
- **Products Service** (Port 8002) - Handles product catalog, categories, and product management
- **Shopping Service** (Port 8003) - Manages shopping carts and order processing

### Communication Flow

```
Client → Gateway (8000) → Microservices (8001, 8002, 8003)
                              ↓
                    Event-Driven Communication
                    (HTTP-based event bus)
```

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher) - Running locally or MongoDB Atlas connection string
- **npm** or **yarn** package manager

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd shopping-ms
```

### 2. Install Dependencies

Install dependencies for each service:

```bash
# Gateway
cd gateway
npm install

# Customer Service
cd ../customer
npm install

# Products Service
cd ../products
npm install

# Shopping Service
cd ../shopping
npm install
```

### 3. Environment Configuration

Create `.env` files in each service directory with the following variables:

#### Customer Service (`customer/.env`)
```env
PORT=8001
MONGODB_URI=mongodb://localhost:27017/customer
APP_SECRET=your-secret-key-here
```

#### Products Service (`products/.env`)
```env
PORT=8002
MONGODB_URI=mongodb://localhost:27017/products
APP_SECRET=your-secret-key-here
```

#### Shopping Service (`shopping/.env`)
```env
PORT=8003
MONGODB_URI=mongodb://localhost:27017/shopping
APP_SECRET=your-secret-key-here
```

**Note:** All services must use the same `APP_SECRET` for JWT token validation to work correctly.

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if installed as service, it should start automatically)
# Or use MongoDB Compass

# Linux/Mac
mongod
```

### 5. Start the Services

Open separate terminal windows/tabs for each service:

**Terminal 1 - Gateway:**
```bash
cd gateway
npm start
```

**Terminal 2 - Customer Service:**
```bash
cd customer
npm start
```

**Terminal 3 - Products Service:**
```bash
cd products
npm start
```

**Terminal 4 - Shopping Service:**
```bash
cd shopping
npm start
```

All services should start successfully and connect to their respective MongoDB databases.

## 📡 API Endpoints

All requests should be made through the Gateway at `http://localhost:8000`

### Customer Service Endpoints

Base URL: `http://localhost:8000/customer`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Register a new customer | No |
| POST | `/login` | Customer login | No |
| POST | `/address` | Add customer address | Yes |
| GET | `/profile` | Get customer profile | Yes |
| GET | `/shoping-details` | Get shopping details (cart, wishlist, orders) | Yes |
| GET | `/wishlist` | Get customer wishlist | Yes |
| POST | `/app-events` | Internal event endpoint | No |

**Request Examples:**

**Sign Up:**
```bash
POST http://localhost:8000/customer/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

**Login:**
```bash
POST http://localhost:8000/customer/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "data": {
    "id": "customer_id",
    "token": "jwt_token_here"
  }
}
```

### Products Service Endpoints

Base URL: `http://localhost:8000` (root)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/product` | Get all products | No |
| GET | `/product/category/:type` | Get products by category | No |
| GET | `/product/:id` | Get product by ID | No |
| POST | `/product/create` | Create a new product | No |
| POST | `/ids` | Get products by IDs | No |
| PUT | `/product/wishlist` | Add product to wishlist | Yes |
| DELETE | `/product/wishlist/:id` | Remove product from wishlist | Yes |
| PUT | `/product/cart` | Add product to cart | Yes |
| DELETE | `/product/cart/:id` | Remove product from cart | Yes |
| POST | `/app-events` | Internal event endpoint | No |

**Request Examples:**

**Get All Products:**
```bash
GET http://localhost:8000/product
```

**Add to Cart:**
```bash
PUT http://localhost:8000/product/cart
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "_id": "product_id",
  "qty": 2
}
```

### Shopping Service Endpoints

Base URL: `http://localhost:8000/shopping`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get customer cart | Yes |
| GET | `/orders` | Get customer orders | Yes |
| POST | `/order` | Place a new order | Yes |
| POST | `/app-events` | Internal event endpoint | No |

**Request Examples:**

**Get Cart:**
```bash
GET http://localhost:8000/shopping/cart
Authorization: Bearer <jwt_token>
```

**Place Order:**
```bash
POST http://localhost:8000/shopping/order
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "txnNumber": "transaction_123"
}
```

## 🔄 Event-Driven Communication

The services communicate asynchronously using HTTP-based events. Events are published when certain actions occur:

### Event Types

1. **ADD_TO_CART** - Published when a product is added to cart
   - Publisher: Products Service
   - Subscribers: Customer Service, Shopping Service

2. **REMOVE_FROM_CART** - Published when a product is removed from cart
   - Publisher: Products Service
   - Subscribers: Customer Service, Shopping Service

3. **ADD_TO_WISHLIST** - Published when a product is added to wishlist
   - Publisher: Products Service
   - Subscriber: Customer Service

4. **REMOVE_FROM_WISHLIST** - Published when a product is removed from wishlist
   - Publisher: Products Service
   - Subscriber: Customer Service

5. **CREATE_ORDER** - Published when an order is placed
   - Publisher: Shopping Service
   - Subscriber: Customer Service

### Event Flow Example

```
User adds product to cart
    ↓
Products Service → Publishes ADD_TO_CART event
    ↓
Customer Service ← Receives event → Updates customer cart
Shopping Service ← Receives event → Updates shopping cart
```

## 🗄️ Database Models

### Customer Service
- **Customer** - User accounts with email, password, addresses, cart, wishlist, orders
- **Address** - Customer shipping addresses

### Products Service
- **Product** - Product catalog with name, description, price, category, availability

### Shopping Service
- **Cart** - Shopping cart items per customer
- **Order** - Order records with items, amounts, transaction IDs

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained from the `/customer/login` endpoint and are valid for 30 days.

## 🛠️ Project Structure

```
shopping-ms/
├── gateway/              # API Gateway Service
│   ├── index.js
│   └── package.json
├── customer/             # Customer Service
│   ├── src/
│   │   ├── api/          # API routes
│   │   ├── config/       # Configuration
│   │   ├── database/     # Database models & repositories
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities & helpers
│   └── package.json
├── products/             # Products Service
│   └── src/              # Same structure as customer
├── shopping/             # Shopping Service
│   └── src/              # Same structure as customer
└── README.md
```

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Error (ECONNREFUSED)**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` files
- Verify MongoDB is accessible on the specified host/port

**2. Port Already in Use**
- Check if another process is using ports 8000, 8001, 8002, or 8003
- Kill the process or change ports in `.env` files

**3. JWT Token Errors**
- Ensure all services use the same `APP_SECRET`
- Check token expiration (tokens are valid for 30 days)
- Verify Authorization header format: `Bearer <token>`

**4. "Cart not found" Error**
- Ensure items are added to cart before placing order
- Check that cart exists in the shopping service database

**5. Event Publishing Errors**
- Ensure all services are running
- Check gateway is running on port 8000
- Verify event endpoints are accessible

### Service Health Checks

Check if services are running:
```bash
# Gateway
curl http://localhost:8000

# Customer Service (through gateway)
curl http://localhost:8000/customer/profile
```

## 📝 Development Notes

### Error Handling
- All services use centralized error handlers
- Errors are logged using Winston
- API errors return proper HTTP status codes

### Code Style
- Services follow a consistent structure
- Repository pattern for database operations
- Service layer for business logic
- API layer for HTTP endpoints

### Environment Variables
- Never commit `.env` files to version control
- Use `.env.example` files as templates
- All sensitive data should be in environment variables

## 🔧 Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **HTTP Client:** axios
- **Logging:** winston
- **API Gateway:** express-http-proxy
- **Development:** nodemon

## 📄 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Happy Shopping! 🛒**

