import * as winston from 'winston';
import 'winston-daily-rotate-file';

const generalTransport = new winston.transports.DailyRotateFile({
  filename: '%DATE%.log',
  datePattern: 'MM-DD-YYYY',
  maxFiles: '14',
  dirname: './logs/runtime',
  handleExceptions: true,
  handleRejections: true
});

const generalLogConfiguration = {
  transports: [new winston.transports.Console({ handleExceptions: true }), generalTransport],
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({
      format: 'MM-DD-YYYY HH:mm:ss'
    }),
    winston.format.printf((info) => `${[info.timestamp]}: ${info.level}: ${info.message}`)
  )
};

const logger = winston.createLogger(generalLogConfiguration);

export default logger;
