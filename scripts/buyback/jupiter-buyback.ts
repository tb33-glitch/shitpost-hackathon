/**
 * SHITPOST.PRO - Jupiter Buyback Service
 *
 * Run once:     npx tsx jupiter-buyback.ts
 * Watch mode:   npx tsx jupiter-buyback.ts --watch
 */

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, VersionedTransaction, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api';
import { getAssociatedTokenAddress, createBurnInstruction, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  RPC_URL: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
  TREASURY_KEYPAIR_PATH: process.env.TREASURY_KEYPAIR_PATH || './treasury-keypair.json',
  TREASURY_WALLET: process.env.TREASURY_WALLET || '',
  SHITPOST_MINT: process.env.SHITPOST_MINT || '',
  BUYBACK_THRESHOLD_SOL: parseFloat(process.env.BUYBACK_THRESHOLD_SOL || '0.5'),
  BUYBACK_RATIO: parseFloat(process.env.BUYBACK_RATIO || '0.70'),
  SLIPPAGE_BPS: parseInt(process.env.SLIPPAGE_BPS || '100'),
  BURN_TOKENS: process.env.BURN_TOKENS === 'true',
  DRY_RUN: process.env.DRY_RUN === 'true',
  // Watch mode settings
  WATCH_INTERVAL_MS: parseInt(process.env.WATCH_INTERVAL_MS || '60000'), // 1 minute
  // Priority fee in microlamports (helps during congestion)
  PRIORITY_FEE: parseInt(process.env.PRIORITY_FEE || '50000'),
};

const NATIVE_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const SHITPOST_DECIMALS = 6;

// =============================================================================
// HELPERS
// =============================================================================

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function loadKeypair(path: string): Keypair {
  const secretKey = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

function formatSol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(6);
}

function formatShitpost(raw: bigint | number): string {
  return (Number(raw) / Math.pow(10, SHITPOST_DECIMALS)).toLocaleString();
}

async function getTokenBalance(connection: Connection, wallet: PublicKey, mint: PublicKey): Promise<bigint> {
  try {
    // $SHITPOST uses Token-2022
    const ata = await getAssociatedTokenAddress(mint, wallet, false, TOKEN_2022_PROGRAM_ID);
    const balance = await connection.getTokenAccountBalance(ata);
    return BigInt(balance.value.amount);
  } catch {
    return BigInt(0);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e as Error;
      const delay = baseDelayMs * Math.pow(2, i);
      log(`⚠️  Retry ${i + 1}/${maxRetries} after ${delay}ms: ${lastError.message}`);
      await sleep(delay);
    }
  }
  throw lastError;
}

// =============================================================================
// MAIN BUYBACK LOGIC
// =============================================================================

async function executeBuyback(): Promise<boolean> {
  log('========================================');
  log('SHITPOST.PRO BUYBACK SERVICE');
  log('========================================');

  if (!CONFIG.SHITPOST_MINT) {
    log('❌ SHITPOST_MINT not set in .env');
    return false;
  }

  const shitpostMint = new PublicKey(CONFIG.SHITPOST_MINT);

  let treasury: Keypair;
  try {
    treasury = loadKeypair(CONFIG.TREASURY_KEYPAIR_PATH);
  } catch (e) {
    log(`❌ Failed to load treasury keypair: ${e}`);
    return false;
  }

  // Validate keypair matches expected wallet
  if (CONFIG.TREASURY_WALLET && treasury.publicKey.toBase58() !== CONFIG.TREASURY_WALLET) {
    log(`❌ Keypair mismatch!`);
    log(`   Loaded:   ${treasury.publicKey.toBase58()}`);
    log(`   Expected: ${CONFIG.TREASURY_WALLET}`);
    return false;
  }

  log(`📦 Treasury: ${treasury.publicKey.toBase58()}`);

  const connection = new Connection(CONFIG.RPC_URL, 'confirmed');
  log(`🌐 RPC: ${CONFIG.RPC_URL}`);
  log(`🎯 $SHITPOST: ${CONFIG.SHITPOST_MINT}`);

  if (CONFIG.DRY_RUN) {
    log(`⚠️  DRY RUN MODE`);
  }

  const solBalance = await connection.getBalance(treasury.publicKey);
  log(`💰 SOL balance: ${formatSol(solBalance)} SOL`);

  const thresholdLamports = CONFIG.BUYBACK_THRESHOLD_SOL * LAMPORTS_PER_SOL;

  if (solBalance < thresholdLamports) {
    log(`⏸️  Below threshold (${CONFIG.BUYBACK_THRESHOLD_SOL} SOL). Skipping.`);
    return false;
  }

  // Reserve SOL for fees
  const reserveForFees = 0.01 * LAMPORTS_PER_SOL;
  const availableBalance = solBalance - reserveForFees;
  const buybackLamports = Math.floor(availableBalance * CONFIG.BUYBACK_RATIO);

  log(`📊 Buyback calculation:`);
  log(`   Available: ${formatSol(availableBalance)} SOL`);
  log(`   Buyback:   ${formatSol(buybackLamports)} SOL (${CONFIG.BUYBACK_RATIO * 100}%)`);
  log(`   Reserved:  ${formatSol(reserveForFees)} SOL (fees)`);

  // Initialize Jupiter
  log('🪐 Getting Jupiter quote...');
  const jupiter = createJupiterApiClient();

  let quote: QuoteResponse;
  try {
    quote = await retryWithBackoff(async () => {
      const q = await jupiter.quoteGet({
        inputMint: NATIVE_SOL_MINT.toBase58(),
        outputMint: shitpostMint.toBase58(),
        amount: buybackLamports,
        slippageBps: CONFIG.SLIPPAGE_BPS,
      });
      if (!q) throw new Error('No quote returned');
      return q;
    });
  } catch (e) {
    log(`❌ Failed to get quote: ${e}`);
    return false;
  }

  const outputAmount = BigInt(quote.outAmount);
  const priceImpactPct = parseFloat(quote.priceImpactPct || '0');

  log(`💱 Quote:`);
  log(`   Input:  ${formatSol(buybackLamports)} SOL`);
  log(`   Output: ${formatShitpost(outputAmount)} $SHITPOST`);
  log(`   Price impact: ${priceImpactPct.toFixed(4)}%`);
  log(`   Slippage: ${CONFIG.SLIPPAGE_BPS / 100}%`);

  // Warn on high price impact
  if (priceImpactPct > 1) {
    log(`⚠️  HIGH PRICE IMPACT (>${priceImpactPct.toFixed(2)}%)`);
  }

  if (CONFIG.DRY_RUN) {
    log('🔍 DRY RUN - Would execute swap here');
    log('   Set DRY_RUN=false in .env to execute');
    return true;
  }

  // Execute swap
  log('🔄 Executing swap...');

  let swapResult;
  try {
    swapResult = await retryWithBackoff(async () => {
      return await jupiter.swapPost({
        swapRequest: {
          quoteResponse: quote,
          userPublicKey: treasury.publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: CONFIG.PRIORITY_FEE,
              priorityLevel: "high"
            }
          },
        },
      });
    });
  } catch (e) {
    log(`❌ Failed to create swap transaction: ${e}`);
    return false;
  }

  const swapTxBuf = Buffer.from(swapResult.swapTransaction, 'base64');
  const tx = VersionedTransaction.deserialize(swapTxBuf);
  tx.sign([treasury]);

  let txid: string;
  try {
    txid = await connection.sendTransaction(tx, {
      skipPreflight: false,
      maxRetries: 3,
    });
  } catch (e) {
    log(`❌ Failed to send transaction: ${e}`);
    return false;
  }

  log(`✅ Swap sent: ${txid}`);
  log(`   https://solscan.io/tx/${txid}`);

  // Wait for confirmation
  log('⏳ Waiting for confirmation...');
  try {
    const confirmation = await connection.confirmTransaction(txid, 'confirmed');
    if (confirmation.value.err) {
      log(`❌ Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      return false;
    }
  } catch (e) {
    log(`❌ Confirmation error: ${e}`);
    return false;
  }

  log('✅ Swap confirmed!');

  // Check new balance
  const shitpostBalance = await getTokenBalance(connection, treasury.publicKey, shitpostMint);
  log(`🎯 $SHITPOST balance: ${formatShitpost(shitpostBalance)}`);

  // Optionally burn
  if (CONFIG.BURN_TOKENS && shitpostBalance > 0) {
    log('🔥 Burning $SHITPOST tokens...');

    // $SHITPOST uses Token-2022
    const ata = await getAssociatedTokenAddress(shitpostMint, treasury.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const burnTx = new Transaction();

    // Add priority fee for burn tx too
    burnTx.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: CONFIG.PRIORITY_FEE })
    );
    burnTx.add(
      createBurnInstruction(ata, shitpostMint, treasury.publicKey, shitpostBalance, [], TOKEN_2022_PROGRAM_ID)
    );

    burnTx.feePayer = treasury.publicKey;
    burnTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    burnTx.sign(treasury);

    try {
      const burnTxid = await connection.sendRawTransaction(burnTx.serialize());
      log(`✅ Burn tx: ${burnTxid}`);
      log(`   https://solscan.io/tx/${burnTxid}`);

      await connection.confirmTransaction(burnTxid, 'confirmed');
      log('🔥 Tokens burned!');
    } catch (e) {
      log(`❌ Burn failed: ${e}`);
    }
  }

  log('========================================');
  log('BUYBACK COMPLETE');
  log('========================================');

  return true;
}

// =============================================================================
// WATCH MODE
// =============================================================================

async function watchMode() {
  log('👀 Starting watch mode...');
  log(`   Interval: ${CONFIG.WATCH_INTERVAL_MS / 1000}s`);
  log(`   Press Ctrl+C to stop\n`);

  while (true) {
    try {
      await executeBuyback();
    } catch (e) {
      log(`❌ Error in buyback cycle: ${e}`);
    }

    log(`💤 Sleeping ${CONFIG.WATCH_INTERVAL_MS / 1000}s...\n`);
    await sleep(CONFIG.WATCH_INTERVAL_MS);
  }
}

// =============================================================================
// ENTRY POINT
// =============================================================================

const args = process.argv.slice(2);
const isWatchMode = args.includes('--watch') || args.includes('-w');

if (isWatchMode) {
  watchMode().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
} else {
  executeBuyback().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}
