import * as fs from 'node:fs';
import { Router } from 'express';
import * as path from 'node:path';
import { LogResponse } from '../types/web';

const router = Router();

router.get('/', async (request, response) => {
  response.sendFile(path.join(__dirname, '../web/html/logs.html'));
});

router.get('/currentLogs', async (request, response) => {
  const fileNames = fs.readdirSync(path.join(__dirname, '..', '..', 'logs', 'runtime'));
  const logNames = [];
  for (const fileName of fileNames) {
    if (fileName.endsWith('.log')) {
      logNames.push(fileName);
    }
  }
  const data: LogResponse = {
    logNames: logNames
  };
  response.send(data);
});

router.get('/*', async (request, response) => {
  response.sendFile(path.join(__dirname, '..', '..', 'logs', `runtime${request.path}`));
});

export default router;
