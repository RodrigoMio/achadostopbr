import { isBoom } from '@hapi/boom';

export function errorHandler(err, _req, res, _next) {
  console.error('[Erro]', err);

  if (isBoom(err)) {
    return res.status(err.output.statusCode).json({
      error: err.message,
    });
  }

  const status = typeof err.status === 'number' ? err.status : 500;
  return res.status(status).json({
    error: err.message || 'Erro interno do servidor',
  });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Rota não encontrada' });
}
