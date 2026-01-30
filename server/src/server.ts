import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable proxy trust to ensure cookies are secure even behind a reverse proxy (Netlify/Render)
app.set('trust proxy', 1);

// CORS configuration - Allow frontend to access backend
// With Netlify Proxy, the browser sees Same-Origin, but the proxy might forward headers.
// origin: true allows the request origin dynamically.
app.use(cors({
    origin: true,
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
    console.log(`Server is running on port ${PORT}`);
});
