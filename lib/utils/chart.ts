import path from 'node:path';
import logger from './logger';
import { writeFile } from 'node:fs';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

export async function generateAnimeShowScore(labels: string[], data: number[]) {
  const width = 1500;
  const height = 600;
  const backgroundColour = '#2e3035';
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });
  const configuration: any = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          fill: true,
          backgroundColor: '#255a7c',
          borderColor: '#3eb4f0'
        }
      ]
    },
    options: {
      scales: {
        yAxis: {
          grace: 5,
          display: true,
          ticks: {
            color: 'white',
            padding: 10
          }
        },
        xAxis: {
          display: true,
          ticks: {
            color: 'white',
            padding: 8
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: `Airing Score`,
          color: 'white'
        }
      }
    }
  };
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  writeFile(path.join(__dirname, `../../media/animeShowScore.png`), buffer, 'base64', genericCallback);
}

function genericCallback(err: any) {
  if (err) {
    logger.error(`[Chart] Error generating chart: ${err}`);
  } else {
    logger.info('[Chart] Chart Created');
  }
}
