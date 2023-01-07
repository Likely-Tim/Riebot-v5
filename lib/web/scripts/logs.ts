import { LogResponse } from '../../types/web';

sendGetRequest('/logs/currentLogs').then((response: LogResponse) => {
  generateLogButtons(response);
});

async function sendGetRequest(url: string) {
  const response = await fetch(url, { method: 'GET' });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error(`Fetch failed for ${url}`);
  }
}

async function sendGetFile(url: string) {
  const response = await fetch(url, { method: 'GET' });
  if (response.ok) {
    return await response.text();
  } else {
    throw new Error(`Fetch failed for ${url}`);
  }
}

function generateLogButtons(response: LogResponse) {
  let container = document.getElementById('buttonContainer');
  if (!container) {
    throw new Error(`Button container does not exist`);
  }
  for (const logName of response.logNames) {
    const button = document.createElement('button');
    button.setAttribute('id', logName);
    button.setAttribute('class', 'logs');
    const text = document.createTextNode(logName);
    button.appendChild(text);
    button.addEventListener('click', (event) => logDisplay(event));
    container.appendChild(button);
  }
}

async function logDisplay(event: MouseEvent) {
  if (event.target instanceof Element) {
    const text = await sendGetFile(`/logs/${event.target.id}`);
    const container = document.getElementById('logContainer');
    if (container instanceof Element) {
      container.textContent = text;
    } else {
      throw new Error(`Log container does not exist`);
    }
  }
}
