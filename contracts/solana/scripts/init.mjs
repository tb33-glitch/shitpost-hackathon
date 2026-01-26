import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import pkg from '@coral-xyz/anchor';
const { AnchorProvider, Program, Wallet, BN } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load wallet
const walletPath = process.env.HOME + '/.config/solana/id.json';
const walletKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
);

// Program ID
const PROGRAM_ID = new PublicKey('62gJC6oneEykVGdAq7Lr2x5bw33B3CnmHVHeeCxkZ7yJ');

// Load IDL
const idlPath = path.join(__dirname, '../target/idl/shitpost_pro.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

// Connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Create provider
const wallet = new Wallet(walletKeypair);
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

// Create program (old anchor 0.29 API)
const program = new Program(idl, PROGRAM_ID, provider);

async function main() {
  console.log('Program ID:', PROGRAM_ID.toString());
  console.log('Wallet:', walletKeypair.publicKey.toString());

  // Check balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log('Balance:', balance / 1e9, 'SOL');

  // Derive PDAs
  const [collectionConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from('collection_config')],
    PROGRAM_ID
  );

  const [sacredWastePit] = PublicKey.findProgramAddressSync(
    [Buffer.from('sacred_waste_pit')],
    PROGRAM_ID
  );

  console.log('\nCollection Config PDA:', collectionConfig.toString());
  console.log('Sacred Waste Pit PDA:', sacredWastePit.toString());

  // Check if already initialized
  try {
    const configAccount = await connection.getAccountInfo(collectionConfig);
    if (configAccount) {
      console.log('\n✅ Program already initialized!');
      console.log('Account data length:', configAccount.data.length);
      return;
    }
  } catch (e) {
    // Not initialized
  }

  console.log('\nInitializing program...\n');

  // Initialize collection
  try {
    const tx = await program.methods
      .initialize(
        'ShitpostPro',                    // name
        'SHIT',                           // symbol
        'https://shitpost.pro',           // uri
        walletKeypair.publicKey,          // treasury
        new BN(0)                         // premium_fee (0 for now)
      )
      .accounts({
        collectionConfig,
        authority: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('✅ Initialize tx:', tx);
  } catch (e) {
    console.error('Initialize error:', e.message);
  }

  // Initialize pit
  try {
    const tx = await program.methods
      .initializePit()
      .accounts({
        sacredWastePit,
        authority: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('✅ Initialize Pit tx:', tx);
  } catch (e) {
    console.error('Initialize Pit error:', e.message);
  }

  console.log('\n🎉 Done!');
}

main().catch(console.error);
