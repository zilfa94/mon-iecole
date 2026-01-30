/// <reference path="./types/express.d.ts" />
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { log } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable proxy trust to ensure cookies are secure even behind a reverse proxy (Netlify/Render)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Auth Rate Limiting (Brute Force Protection)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login attempts per hour
    message: 'Too many login attempts, please try again later.'
});
app.use('/api/auth/login', authLimiter);

// CORS configuration - Strict for Production
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
log('CORS Origin Allowed:', clientUrl);

app.use(cors({
    origin: clientUrl,
    credentials: true, // Allow cookies
}));

app.use(express.json());
app.use(cookieParser());

import authRoutes from './routes/auth.routes';
import threadRoutes from './routes/thread.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';

app.use('/api/auth', authRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
    res.send('Mon Ecole API is running');
});

app.listen(PORT, () => {
    log(`Server is running on port ${PORT}`);
});
