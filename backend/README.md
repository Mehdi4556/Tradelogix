# TradeLogix Backend

A robust and scalable backend for the Trading Journal App built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**: JWT-based secure authentication
- **Trade Management**: Complete CRUD operations for trading records
- **Image Upload**: Cloudinary integration for screenshots and profile images
- **Advanced Filtering**: Filter trades by date, symbol, strategy, and more
- **Reports & Analytics**: Comprehensive trading performance reports
- **Data Export**: Export trades to CSV format
- **Real-time Statistics**: Dashboard with trading metrics and insights

## 📦 Tech Stack

- **Backend Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Password Hashing**: bcryptjs
- **Date Handling**: Day.js
- **Validation**: express-validator
- **CORS**: Cross-Origin Resource Sharing enabled

## 🛠️ Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tradelogix/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Copy `config.example.js` to `config.js` or create a `.env` file:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/tradelogix
   JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
   JWT_EXPIRE=7d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CLIENT_URL=http://localhost:3000
   ```

   **⚠️ CRITICAL for Vercel Deployment:**
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - A long, secure secret key for JWT tokens

   **For Vercel Environment Variables:**
   1. Go to your Vercel dashboard
   2. Select your backend project
   3. Go to Settings → Environment Variables
   4. Add the required variables listed above

   **Troubleshooting 500 Errors:**
   If you get 500 errors on `/api/auth/register`, check:
   1. Environment variables are properly set in Vercel
   2. MongoDB Atlas connection string is correct
   3. Your IP is whitelisted in MongoDB Atlas
   4. JWT_SECRET is set and not empty

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_trader",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "tradingExperience": "intermediate",
  "preferredCurrency": "USD"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Trade Endpoints

#### Create Trade
```http
POST /api/trades
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "symbol": "AAPL",
  "type": "BUY",
  "strategy": "Breakout Strategy",
  "entryDate": "2024-01-15T10:30:00Z",
  "entryPrice": 150.50,
  "quantity": 100,
  "timeframe": "1D",
  "stopLoss": 145.00,
  "takeProfit": 160.00,
  "notes": "Strong bullish pattern"
}
```

#### Get All Trades
```http
GET /api/trades?page=1&limit=10&sort=-entryDate&symbol=AAPL
Authorization: Bearer <jwt_token>
```

#### Close Trade
```http
PATCH /api/trades/:id/close
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "exitPrice": 158.75,
  "exitDate": "2024-01-20T15:45:00Z",
  "notes": "Target reached"
}
```

### Report Endpoints

#### Generate Report
```http
GET /api/reports/generate?period=month
Authorization: Bearer <jwt_token>
```

#### Export Trades
```http
GET /api/reports/export?format=csv&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <jwt_token>
```

### Upload Endpoints

#### Upload Trade Screenshots
```http
POST /api/upload/trade/:tradeId/screenshots
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

FormData:
- screenshots: [file1, file2, ...]
- descriptions: ["Entry signal", "Exit confirmation"]
```

## 📊 Data Models

### User Model
```javascript
{
  username: String,
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  profileImage: String,
  tradingExperience: String,
  preferredCurrency: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Trade Model
```javascript
{
  user: ObjectId,
  symbol: String,
  type: String, // 'BUY' | 'SELL'
  strategy: String,
  entryDate: Date,
  entryPrice: Number,
  quantity: Number,
  exitDate: Date,
  exitPrice: Number,
  status: String, // 'OPEN' | 'CLOSED' | 'CANCELLED'
  commission: Number,
  fees: Number,
  stopLoss: Number,
  takeProfit: Number,
  marketCondition: String,
  timeframe: String,
  notes: String,
  tags: [String],
  screenshots: [{ url: String, description: String, uploadDate: Date }],
  emotionalState: String,
  profit: Number,
  profitPercentage: Number,
  tradingAccount: String,
  currency: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Input Validation**: express-validator for request validation
- **Error Handling**: Comprehensive error handling middleware
- **CORS Protection**: Configurable CORS settings
- **File Upload Security**: Type and size validation for uploads

## 📈 Performance Features

- **Database Indexing**: Optimized queries with MongoDB indexes
- **Pagination**: Efficient data pagination for large datasets
- **Query Optimization**: Advanced filtering and sorting
- **Caching**: Response caching for frequently accessed data

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Development

### Folder Structure
```
backend/
├── controllers/        # Business logic
├── models/            # Database models
├── routes/            # API routes
├── middlewares/       # Custom middleware
├── utils/             # Utility functions
├── config.example.js  # Configuration template
├── server.js          # Application entry point
└── package.json       # Dependencies and scripts
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## 🌐 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tradelogix
JWT_SECRET=your_super_secure_jwt_secret_for_production
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=https://your-frontend-domain.com
```

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 📄 License

This project is licensed under the ISC License.

---

**Happy Trading! 📈** 