import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { agentRouter } from './routes/agentRoutes.js';
dotenv.config();
const app = express();
const port = Number(process.env.PORT ?? 4000);
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));
app.get('/health', (_request, response) => {
    response.json({ status: 'ok', service: 'ai-energy-optimization-agent' });
});
app.use('/api', agentRouter);
app.use((request, response) => {
    response.status(404).json({
        error: 'Not found',
        path: request.path,
    });
});
app.listen(port, () => {
    console.log(`AI Energy Optimization Agent API running on http://localhost:${port}`);
});
