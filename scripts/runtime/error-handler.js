// Global error handler to prevent server crashes from unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error('========================================');
  console.error('[UNCAUGHT EXCEPTION]', err.message);
  console.error(err.stack);
  console.error('========================================');
});

process.on('unhandledRejection', (reason) => {
  console.error('========================================');
  console.error('[UNHANDLED REJECTION]', reason);
  console.error('========================================');
});
