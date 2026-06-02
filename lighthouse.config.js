/**
 * Lighthouse CI Configuration
 *
 * Run: npx lhci collect --config=lighthouse.config.js
 *      npx lhci assert --config=lighthouse.config.js
 *      npx lhci upload --config=lighthouse.config.js
 */

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run dev',
      url: [
        'http://localhost:3458',
        'http://localhost:3458/auth',
        'http://localhost:3458/markets/chickpet',
        'http://localhost:3458/cart',
        'http://localhost:3458/checkout',
      ],
      numberOfRuns: 2,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.6 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.3 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'qa-dashboard/lighthouse-report',
      reportFilenamePattern: 'lighthousereport-%%HOSTNAME%%.%%EXTENSION%%',
    },
  },
};
