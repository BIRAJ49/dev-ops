import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/node';

const aj = arcjet({
  // Get your site key from https://app.arcjet.com and set it as an environment
  // variable rather than hard coding.
  key: process.env.ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection.
    shield({ mode: 'LIVE' }),
    // Bot detection to block most automated traffic while allowing common bots.
    detectBot({
      mode: 'LIVE', // Use "DRY_RUN" to observe without blocking.
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc.
        'CATEGORY:PREVIEW', // Link previews e.g. Slack, Discord.
      ],
    }),
    // Base rate limit: 100 requests per minute per IP.
    slidingWindow({
      mode: 'LIVE',
      interval: '60s',
      max: 5,
    }),
  ],
});

export default aj;
