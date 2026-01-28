/**
 * Solana RPC Proxy Routes
 * Proxies Solana JSON-RPC requests through the backend to keep API keys secure
 */

export default async function solanaRoutes(fastify, options) {
  const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL

  if (!SOLANA_RPC_URL) {
    fastify.log.warn('SOLANA_RPC_URL not configured - Solana RPC proxy will fail')
  }

  // Allowed RPC methods (whitelist for security)
  const ALLOWED_METHODS = [
    'getBalance',
    'getAccountInfo',
    'getLatestBlockhash',
    'getSignatureStatuses',
    'getTransaction',
    'getTokenAccountsByOwner',
    'getTokenAccountBalance',
    'getProgramAccounts',
    'getMultipleAccounts',
    'getSlot',
    'getBlockHeight',
    'getHealth',
    'simulateTransaction',
    'sendTransaction',
  ]

  /**
   * POST /api/solana/rpc
   * Proxy JSON-RPC requests to Solana
   */
  fastify.post('/rpc', {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: {
        type: 'object',
        required: ['method'],
        properties: {
          jsonrpc: { type: 'string', default: '2.0' },
          id: { type: ['string', 'number'], default: 1 },
          method: { type: 'string' },
          params: { type: 'array', default: [] },
        },
      },
    },
  }, async (request, reply) => {
    if (!SOLANA_RPC_URL) {
      return reply.status(503).send({
        error: 'Service unavailable',
        message: 'Solana RPC not configured',
      })
    }

    const { method, params, id, jsonrpc } = request.body

    // Validate method is allowed
    if (!ALLOWED_METHODS.includes(method)) {
      return reply.status(400).send({
        error: 'Method not allowed',
        message: `RPC method '${method}' is not in the allowed list`,
      })
    }

    try {
      const response = await fetch(SOLANA_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: jsonrpc || '2.0',
          id: id || 1,
          method,
          params: params || [],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        request.log.error(`Solana RPC error: ${response.status} - ${errorText}`)
        return reply.status(response.status).send({
          error: 'RPC error',
          message: 'Failed to execute Solana RPC request',
        })
      }

      const data = await response.json()
      return reply.send(data)
    } catch (error) {
      request.log.error(`Solana RPC proxy error: ${error.message}`)
      return reply.status(500).send({
        error: 'Proxy error',
        message: 'Failed to proxy Solana RPC request',
      })
    }
  })

  /**
   * GET /api/solana/health
   * Check if Solana RPC is configured and working
   */
  fastify.get('/health', async (request, reply) => {
    if (!SOLANA_RPC_URL) {
      return reply.status(503).send({
        status: 'error',
        message: 'Solana RPC not configured',
      })
    }

    try {
      const response = await fetch(SOLANA_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
        }),
      })

      const data = await response.json()

      return reply.send({
        status: 'ok',
        rpcHealth: data.result || 'unknown',
      })
    } catch (error) {
      return reply.status(503).send({
        status: 'error',
        message: 'Failed to connect to Solana RPC',
      })
    }
  })
}
