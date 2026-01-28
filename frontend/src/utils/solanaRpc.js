/**
 * Solana RPC Proxy Utility
 * Makes Solana RPC calls through the backend to keep API keys secure
 */

// Use backend proxy in development, configurable for production
const RPC_PROXY_URL = '/api/solana/rpc'

/**
 * Make a Solana JSON-RPC call through the backend proxy
 * @param {string} method - RPC method name
 * @param {Array} params - RPC method parameters
 * @returns {Promise<any>} - RPC result
 */
export async function rpcCall(method, params = []) {
  const response = await fetch(RPC_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `RPC request failed: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'RPC error')
  }

  return data.result
}

/**
 * Get SOL balance for a public key
 * @param {string} publicKey - Base58 encoded public key
 * @returns {Promise<number>} - Balance in lamports
 */
export async function getBalance(publicKey) {
  return rpcCall('getBalance', [publicKey])
}

/**
 * Get latest blockhash
 * @returns {Promise<{blockhash: string, lastValidBlockHeight: number}>}
 */
export async function getLatestBlockhash() {
  const result = await rpcCall('getLatestBlockhash')
  return result.value
}

/**
 * Send a signed transaction
 * @param {string} signedTransaction - Base64 encoded signed transaction
 * @param {object} options - Send options
 * @returns {Promise<string>} - Transaction signature
 */
export async function sendTransaction(signedTransaction, options = {}) {
  return rpcCall('sendTransaction', [
    signedTransaction,
    {
      encoding: 'base64',
      skipPreflight: options.skipPreflight || false,
      preflightCommitment: options.preflightCommitment || 'confirmed',
      maxRetries: options.maxRetries || 3,
    },
  ])
}

/**
 * Simulate a transaction
 * @param {string} transaction - Base64 encoded transaction
 * @returns {Promise<object>} - Simulation result
 */
export async function simulateTransaction(transaction) {
  return rpcCall('simulateTransaction', [
    transaction,
    { encoding: 'base64', commitment: 'confirmed' },
  ])
}

/**
 * Get signature statuses
 * @param {string[]} signatures - Array of transaction signatures
 * @returns {Promise<object[]>} - Array of statuses
 */
export async function getSignatureStatuses(signatures) {
  const result = await rpcCall('getSignatureStatuses', [signatures])
  return result.value
}

/**
 * Check RPC health
 * @returns {Promise<boolean>} - True if healthy
 */
export async function checkRpcHealth() {
  try {
    const response = await fetch('/api/solana/health')
    const data = await response.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
