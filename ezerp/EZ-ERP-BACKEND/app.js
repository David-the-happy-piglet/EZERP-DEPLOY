import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import authRoutes from './EZ-ERP/routes/authRoutes.js';
import orderRoutes from './EZ-ERP/Orders/routes.js';
import customerRoutes from './EZ-ERP/Customers/routes.js';
import messageRoutes from './EZ-ERP/Messages/routes.js';
import taskRoutes from './EZ-ERP/Tasks/routes.js';
import userRoutes from './EZ-ERP/Users/routes.js';
import itemRoutes from './EZ-ERP/Items/routes.js';
import inventoryRecordRoutes from './EZ-ERP/InventoryRecord/routes.js';

dotenv.config();

const app = express();

const startServer = async () => {
    try {
        // ✅ 1. Connect to MongoDB first
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ez-erp');
        console.log('✅ Connected to MongoDB');

        // ✅ 2. Create MongoStore AFTER Mongo is connected
        const mongoStore = MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: 'sessions',
            ttl: 24 * 60 * 60
        });

        // ✅ 3. Set up CORS via environment variable CORS_ORIGINS (comma separated)
        const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
            .split(',')
            .map(v => v.trim())
            .filter(Boolean);
        app.use(cors({
            origin: corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
            exposedHeaders: ['Content-Range', 'X-Content-Range'],
            maxAge: 600,
            preflightContinue: false,
            optionsSuccessStatus: 204
        }));
        app.options('*', cors());

        // ✅ 4. Add security headers
        app.use((req, res, next) => {
            res.header('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
            next();
        });

        app.use(express.json());
        // Respect reverse proxy settings (e.g., load balancer)
        const trustProxy = process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true';
        app.set('trust proxy', trustProxy ? 1 : false);
        console.log(' trust proxy setting ->', app.get('trust proxy'));

        // ✅ 5. Use session AFTER MongoStore is ready
        const cookieSecureEnv = process.env.COOKIE_SECURE;
        const cookieSecure = cookieSecureEnv === 'true' ? true : (cookieSecureEnv === 'false' ? false : 'auto');
        // Default to lax for local/dev HTTP; allow override via env
        const cookieSameSite = process.env.COOKIE_SAMESITE || 'lax';
        console.log(' session cookie settings ->', { secure: cookieSecure, sameSite: cookieSameSite });
        app.use(session({
            secret: process.env.SESSION_SECRET || 'your-secret-key',
            resave: false,
            saveUninitialized: false,
            store: mongoStore,
            cookie: {
                secure: cookieSecure,
                httpOnly: true,
                sameSite: cookieSameSite,
                maxAge: 24 * 60 * 60 * 1000
            }
        }));

        // ✅ 6. Debug middleware
        app.use((req, res, next) => {
            console.log('Session ID:', req.sessionID);
            console.log('Session data:', req.session);
            next();
        });

        // ✅ 7. Mount routes
        app.use('/api/auth', authRoutes);
        app.use('/api/orders', orderRoutes);
        app.use('/api/customers', customerRoutes);
        app.use('/api/messages', messageRoutes);
        app.use('/api/tasks', taskRoutes);
        app.use('/api/users', userRoutes);
        app.use('/api/items', itemRoutes);
        app.use('/api/inventory-records', inventoryRecordRoutes);

        // Debug endpoints (enable by setting DEBUG=true)
        if (process.env.DEBUG === 'true') {
            app.get('/api/debug/session', (req, res) => {
                res.json({
                    sessionID: req.sessionID,
                    hasUser: Boolean(req.session && req.session.user),
                    reqSecure: req.secure,
                    trustProxy: app.get('trust proxy'),
                    headers: {
                        host: req.get('host'),
                        forwardedProto: req.get('x-forwarded-proto')
                    },
                    cookieSettings: {
                        secure: cookieSecure,
                        sameSite: cookieSameSite
                    }
                });
            });
        }

        // ✅ 8. Start server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (err) {
        console.error('❌ Failed to start server:', err);
    }
};

startServer();

export default app;
