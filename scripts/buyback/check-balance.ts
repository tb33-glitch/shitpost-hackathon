/**
 * Quick balance checker for treasury wallet
 * Run: npx tsx check-balance.ts
 */

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const SHITPOST_DECIMALS = 6; // Adjust if different

async function checkBalances() {
  const rpcUrl = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  console.log('\n========================================');
  console.log('TREASURY BALANCE CHECK');
  console.log(`${new Date().toISOString()}`);
  console.log('========================================\n');
  console.log(`RPC: ${rpcUrl}\n`);

  // Load treasury keypair
  const keypairPath = process.env.TREASURY_KEYPAIR_PATH || './treasury-keypair.json';
  let treasury: Keypair;

  try {
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    treasury = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch (e) {
    console.error(`❌ Failed to load keypair from ${keypairPath}`);
    console.error('   Generate one with: solana-keygen new -o treasury-keypair.json');
    process.exit(1);
  }

  // Validate keypair matches expected wallet if TREASURY_WALLET is set
  const expectedWallet = process.env.TREASURY_WALLET;
  if (expectedWallet && treasury.publicKey.toBase58() !== expectedWallet) {
    console.error(`❌ Keypair mismatch!`);
    console.error(`   Loaded:   ${treasury.publicKey.toBase58()}`);
    console.error(`   Expected: ${expectedWallet}`);
    process.exit(1);
  }

  console.log(`Treasury address: ${treasury.publicKey.toBase58()}`);
  console.log(`                  ^ Share this for receiving funds\n`);

  // SOL balance
  const solBalance = await connection.getBalance(treasury.publicKey);
  const solUsd = await fetchSolPrice();
  console.log(`SOL Balance: ${(solBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  if (solUsd) {
    console.log(`             ~$${((solBalance / LAMPORTS_PER_SOL) * solUsd).toFixed(2)} USD`);
  }

  // $SHITPOST balance (if configured) - uses Token-2022
  const shitpostMint = process.env.SHITPOST_MINT;
  if (shitpostMint) {
    try {
      const mint = new PublicKey(shitpostMint);
      const ata = await getAssociatedTokenAddress(mint, treasury.publicKey, false, TOKEN_2022_PROGRAM_ID);
      const balance = await connection.getTokenAccountBalance(ata);
      const uiAmount = Number(balance.value.amount) / Math.pow(10, SHITPOST_DECIMALS);
      console.log(`\n$SHITPOST Balance: ${uiAmount.toLocaleString()}`);
      console.log(`                   (${balance.value.amount} raw)`);
    } catch {
      console.log(`\n$SHITPOST Balance: 0 (no token account)`);
    }
  } else {
    console.log(`\n$SHITPOST: Not configured (set SHITPOST_MINT in .env)`);
  }

  // Buyback calculation
  const threshold = parseFloat(process.env.BUYBACK_THRESHOLD_SOL || '0.5') * LAMPORTS_PER_SOL;
  const ratio = parseFloat(process.env.BUYBACK_RATIO || '0.70');
  const reserveForFees = 0.01 * LAMPORTS_PER_SOL;

  console.log(`\n----------------------------------------`);
  console.log(`Buyback threshold: ${process.env.BUYBACK_THRESHOLD_SOL || '0.5'} SOL`);
  console.log(`Buyback ratio:     ${ratio * 100}%`);
  console.log(`Fee reserve:       0.01 SOL`);

  if (solBalance >= threshold) {
    const availableBalance = solBalance - reserveForFees;
    const buybackAmount = Math.floor(availableBalance * ratio);
    console.log(`\n✅ READY for buyback`);
    console.log(`   Available after reserve: ${(availableBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`   Would swap: ${(buybackAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  } else {
    const needed = (threshold - solBalance) / LAMPORTS_PER_SOL;
    console.log(`\n⏸️  Below threshold`);
    console.log(`   Need ${needed.toFixed(6)} more SOL to trigger buyback`);
  }

  console.log('\n========================================\n');
}

async function fetchSolPrice(): Promise<number | null> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await res.json();
    return data.solana?.usd ?? null;
  } catch {
    return null;
  }
}

checkBalances().catch(console.error);
