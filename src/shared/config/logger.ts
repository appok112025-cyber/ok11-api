import pino from "pino";
import { pinoHttp } from "pino-http";
import env from "./env.js";

const getEmoji = (level: string, statusCode?: number): string => {
  if (statusCode) {
    if (statusCode >= 500) return "💥";
    if (statusCode >= 400) return "⚠️";
    if (statusCode >= 300) return "↩️";
    return "✅";
  }
  switch (level) {
    case "error":
      return "❌";
    case "warn":
      return "⚠️";
    case "info":
      return "ℹ️";
    case "debug":
      return "🔍";
    default:
      return "📝";
  }
};

const getMethodEmoji = (method: string): string => {
  switch (method.toUpperCase()) {
    case "GET":
      return "📥";
    case "POST":
      return "📤";
    case "PUT":
      return "🔄";
    case "PATCH":
      return "🔧";
    case "DELETE":
      return "🗑️";
    default:
      return "📋";
  }
};

const logger = pino({
  level: env.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
    log: (object: any) => {
      if (object.msg) {
        const level = typeof object.level === "string" ? object.level : "info";
        const emoji = getEmoji(level);
        return { ...object, msg: `${emoji} ${object.msg}` };
      }
      return object;
    },
  },
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss.l",
      ignore: "pid,hostname",
      singleLine: true,
    },
  },
});

const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === "/health",
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || err) {
      return "error";
    }
    return "info";
  },
  customSuccessMessage: (req, res) => {
    const method = req.method || "";
    const url = (req as any).originalUrl || req.url || "";
    const statusCode = res.statusCode || 200;
    const reqAny = req as any;
    const resAny = res as any;
    const responseTime = resAny.responseTime ? `${Math.round(resAny.responseTime)}ms` : "";
    const ip = reqAny.remoteAddress || reqAny.ip || req.socket?.remoteAddress || "0.0.0.0";
    const port = reqAny.remotePort || req.socket?.remotePort || "";
    const methodEmoji = getMethodEmoji(method);
    const statusEmoji = getEmoji("", statusCode);
    return `${statusEmoji} ${methodEmoji} ${ip}:${port} - "${method} ${url} HTTP/1.1" ${statusCode}${responseTime ? ` ${responseTime}` : ""}`;
  },
  customErrorMessage: (req, res, err) => {
    const method = req.method || "";
    const url = (req as any).originalUrl || req.url || "";
    const statusCode = res.statusCode || 500;
    const reqAny = req as any;
    const ip = reqAny.remoteAddress || reqAny.ip || req.socket?.remoteAddress || "0.0.0.0";
    const port = reqAny.remotePort || req.socket?.remotePort || "";
    const methodEmoji = getMethodEmoji(method);
    const statusEmoji = getEmoji("", statusCode);
    return `${statusEmoji} ${methodEmoji} ${ip}:${port} - "${method} ${url} HTTP/1.1" ${statusCode} - ${err.message}`;
  },
  serializers: {
    req: (req) => {
      const reqAny = req as any;
      return {
        method: req.method,
        url: reqAny.originalUrl || req.url,
        remoteAddress: reqAny.remoteAddress || reqAny.ip || req.socket?.remoteAddress,
        remotePort: reqAny.remotePort || req.socket?.remotePort,
      };
    },
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

export { logger, httpLogger };
export default logger;
