/**
 * Wrap SOL to wSOL for the treasury wallet
 * Creates the wSOL ATA if it doesn't exist
 *
 * Usage: npx tsx wrap-sol.ts
 */

import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  NATIVE_MINT,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const KEYPAIR_PATH = process.env.TREASURY_KEYPAIR_PATH || '~/treasury-mainnet.json';
const WRAP_AMOUNT_SOL = 0.001;

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function loadKeypair(path: string): Keypair {
  const resolvedPath = path.replace('~', process.env.HOME || '');
  const secretKey = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function main() {
  log('========================================');
  log('WRAP SOL TO wSOL');
  log('========================================');

  // Load treasury keypair
  const keypairPath = KEYPAIR_PATH.replace('~', process.env.HOME || '');
  log(`Loading keypair from: ${keypairPath}`);

  let treasury: Keypair;
  try {
    treasury = loadKeypair(keypairPath);
  } catch (e) {
    log(`❌ Failed to load keypair: ${e}`);
    process.exit(1);
  }

  log(`📦 Treasury: ${treasury.publicKey.toBase58()}`);

  const connection = new Connection(RPC_URL, 'confirmed');
  log(`🌐 RPC: ${RPC_URL}`);

  // Check SOL balance
  const solBalance = await connection.getBalance(treasury.publicKey);
  log(`💰 SOL balance: ${(solBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

  const wrapLamports = Math.floor(WRAP_AMOUNT_SOL * LAMPORTS_PER_SOL);

  if (solBalance < wrapLamports + 0.01 * LAMPORTS_PER_SOL) {
    log(`❌ Insufficient SOL balance. Need at least ${WRAP_AMOUNT_SOL + 0.01} SOL`);
    process.exit(1);
  }

  // Get wSOL ATA address
  const wsolAta = await getAssociatedTokenAddress(NATIVE_MINT, treasury.publicKey);
  log(`🎯 wSOL ATA: ${wsolAta.toBase58()}`);

  // Check if ATA exists
  let ataExists = false;
  try {
    await getAccount(connection, wsolAta);
    ataExists = true;
    log(`✅ wSOL ATA already exists`);
  } catch {
    log(`📝 wSOL ATA does not exist, will create it`);
  }

  // Build transaction
  const tx = new Transaction();

  // Create ATA if needed
  if (!ataExists) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        treasury.publicKey, // payer
        wsolAta,            // ata
        treasury.publicKey, // owner
        NATIVE_MINT         // mint
      )
    );
  }

  // Transfer SOL to the wSOL ATA
  tx.add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: wsolAta,
      lamports: wrapLamports,
    })
  );

  // Sync native to update the token balance
  tx.add(createSyncNativeInstruction(wsolAta));

  tx.feePayer = treasury.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(treasury);

  log(`🔄 Wrapping ${WRAP_AMOUNT_SOL} SOL to wSOL...`);

  try {
    const txid = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    log(`✅ Transaction sent: ${txid}`);
    log(`   https://solscan.io/tx/${txid}`);

    log('⏳ Waiting for confirmation...');
    await connection.confirmTransaction(txid, 'confirmed');
    log('✅ Confirmed!');

    // Verify final balance
    const account = await getAccount(connection, wsolAta);
    log(`🎯 wSOL balance: ${Number(account.amount) / LAMPORTS_PER_SOL} wSOL`);

  } catch (e) {
    log(`❌ Transaction failed: ${e}`);
    process.exit(1);
  }

  log('========================================');
  log('DONE');
  log('========================================');
  log('');
  log('Next steps:');
  log('1. Uncomment VITE_SOLANA_FEE_ACCOUNT in frontend/.env');
  log('2. Restart the frontend');
  log('3. Swap fees will now collect to this wSOL account');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
