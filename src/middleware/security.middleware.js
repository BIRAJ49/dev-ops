import { slidingWindow } from '@arcjet/node';
import aj from '../config/arcjet.js';
import logger from '../config/logger.js';

const ROLE_LIMITS = {
  admin: { max: 20, message: 'Admin rate limit exceeded' },
  user: { max: 10, message: 'User rate limit exceeded' },
  guest: { max: 5, message: 'Guest rate limit exceeded' },
};

const RATE_LIMIT_INTERVAL = '60s';

const respondToDeniedDecision = (decision, res, message) => {
  if (decision.reason.isRateLimit()) {
    logger.warn('Arcjet rate limit triggered', {
      id: decision.id,
      remaining: decision.reason.remaining,
      reset: decision.reason.reset,
    });
    res.status(429).json({ error: message });
    return true;
  }

  if (decision.reason.isBot()) {
    logger.warn('Arcjet bot detection triggered', {
      id: decision.id,
    });
    res.status(403).json({ error: 'Bot request blocked' });
    return true;
  }

  logger.warn('Arcjet denied request', {
    id: decision.id,
    reason: decision.reason.type,
  });
  res.status(403).json({ error: 'Request blocked by security policy' });
  return true;
};

const protectRequest = async (client, req, res, message) => {
  const decision = await client.protect(req);

  if (decision.isDenied()) {
    respondToDeniedDecision(decision, res, message);
    return false;
  }

  if (decision.isErrored()) {
    logger.error('Arcjet returned an error decision', {
      id: decision.id,
      reason: decision.reason.type,
    });
  }

  res.locals.arcjetDecision = decision;
  return true;
};

export const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role ?? 'guest';
    const { max, message } = ROLE_LIMITS[role] ?? ROLE_LIMITS.guest;

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: RATE_LIMIT_INTERVAL,
        max,
      })
    );

    const allowed = await protectRequest(client, req, res, message);

    if (allowed) {
      next();
    }
  } catch (error) {
    logger.error('Security middleware error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const arcjetMiddleware = async (req, res, next) => {
  try {
    const allowed = await protectRequest(aj, req, res, 'Rate limit exceeded');

    if (allowed) {
      next();
    }
  } catch (error) {
    logger.error('Arcjet middleware error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};
