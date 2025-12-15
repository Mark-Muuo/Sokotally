export default function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details;
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', status, message, details || '', err.stack);
  }
  res.status(status).json({ error: message, details });
}


