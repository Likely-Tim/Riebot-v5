import express from 'express';
import http from 'node:http';
import https from 'node:https';
import * as path from 'node:path';
import logger from './utils/logger';
import { readFileSync } from 'node:fs';
import cookieParser from 'cookie-parser';
import { auth, requiresAuth } from 'express-openid-connect';

const app = express();

const SSL_KEY_PATH = process.env.SSL_KEY_PATH!;
const SSL_CERTIFICATE_PATH = process.env.SSL_CERTIFICATE_PATH!;
const BASE_URL = process.env.BASE_URL!;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID!;
const AUTH0_SECRET = process.env.AUTH0_SECRET!;

const sslKey = readFileSync(path.join(__dirname, SSL_KEY_PATH), 'utf8');
const sslCertificate = readFileSync(path.join(__dirname, SSL_CERTIFICATE_PATH), 'utf8');
const credentials = { key: sslKey, cert: sslCertificate };

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: AUTH0_SECRET,
  baseURL: BASE_URL,
  clientID: AUTH0_CLIENT_ID,
  issuerBaseURL: 'https://riebot.us.auth0.com'
};

app.use(auth(authConfig));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web')));
app.use(cookieParser());

// Routing
import authService from './routes/auth';
import logs from './routes/logs';
import anime from './routes/anime';

app.use('/auth', requiresAuth(), authService);
app.use('/logs', requiresAuth(), logs);
app.use('/anime', requiresAuth(), anime);

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/web/html/index.html');
});

app.get('/favicon.ico', (request, response) => {
  response.sendFile(__dirname + '/web/favicon/favicon.ico');
});

app.all('*', (request, response) => {
  response.sendFile(__dirname + '/web/html/404.html');
});

export default function initializeServer() {
  httpServer.listen(3000, () => {
    logger.info('HTTP Server Initialized');
  });
  httpsServer.listen(8443, () => {
    logger.info('HTTPS Server Initialized');
  });
}
