// Centralized logger for ServeX backend
// Structured output with timestamps — works on Render logs

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[LOG_LEVEL] ?? 2;

const fmt = (level, ...args) => {
    const ts = new Date().toISOString();
    const prefix = `[${ts}] [${level.toUpperCase()}]`;
    const parts = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)));
    return `${prefix} ${parts.join(' ')}`;
};

const logger = {
    error: (...args) => { if (currentLevel >= 0) console.error(fmt('error', ...args)); },
    warn:  (...args) => { if (currentLevel >= 1) console.warn(fmt('warn',  ...args)); },
    info:  (...args) => { if (currentLevel >= 2) console.log(fmt('info',  ...args)); },
    debug: (...args) => { if (currentLevel >= 3) console.log(fmt('debug', ...args)); },
};

module.exports = logger;
