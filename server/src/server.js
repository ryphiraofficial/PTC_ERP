import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { seedData } from './seed/seedData.js';

import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Production CORS configuration suitable for Render (Backend) and Vercel (Frontend)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow if matches CLIENT_URL or localhost
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow any Vercel preview or production deployment domain
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      // Permissive fallback so user can host freely on custom domains
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-role'],
  })
);

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Root endpoint for Render health and service ping
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Ledgerly GST Billing & Compliance Suite API',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Ledgerly GST Billing Suite API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Global Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB and start Express server
const startServer = async () => {
  try {
    await connectDB();
    // Auto-seed if running on empty production database (e.g., first deployment to Render)
    await seedData(false).catch((e) =>
      console.warn('Auto-seed check note:', e.message)
    );

    app.listen(PORT, () => {
      console.log(`Ledgerly Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
