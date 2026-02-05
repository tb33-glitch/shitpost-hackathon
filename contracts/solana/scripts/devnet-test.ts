import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from "@solana/spl-token";
import * as fs from "fs";

// Metaplex Token Metadata Program
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

// Load the IDL
const idl = JSON.parse(fs.readFileSync("./target/idl/shitpost_pro.json", "utf-8"));
const PROGRAM_ID = new PublicKey("7F6SJmYgF8iEF9DQmpDUuboTRs4qYt5hr27TcXCuykDo");

async function main() {
  // Setup connection
  const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");

  // Load wallet from default path
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));

  console.log("=".repeat(60));
  console.log("SHITPOST_PRO DEVNET TEST");
  console.log("=".repeat(60));
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`Program: ${PROGRAM_ID.toBase58()}`);

  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

  // Setup Anchor provider
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = new Program(idl, PROGRAM_ID, provider);

  // Derive PDAs
  const [collectionConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_config")],
    PROGRAM_ID
  );
  console.log(`Collection Config PDA: ${collectionConfig.toBase58()}\n`);

  // Test treasury (use our own wallet for testing)
  const treasury = wallet.publicKey;
  const premiumFee = new anchor.BN(15_000_000); // 0.015 SOL

  // ============================================================
  // STEP 2: Initialize Collection
  // ============================================================
  console.log("=".repeat(60));
  console.log("STEP 2: Initialize Collection");
  console.log("=".repeat(60));

  try {
    // Check if already initialized
    const existingConfig = await connection.getAccountInfo(collectionConfig);
    if (existingConfig) {
      console.log("Collection already initialized. Reading config...");
      const configData = await program.account.collectionConfig.fetch(collectionConfig);
      console.log("  Name:", configData.name);
      console.log("  Symbol:", configData.symbol);
      console.log("  Treasury:", configData.treasury.toBase58());
      console.log("  Premium Fee:", configData.premiumFee.toString(), "lamports");
      console.log("  Total Minted:", configData.totalMinted.toString());
      console.log("  Total Burned:", configData.totalBurned.toString());
    } else {
      console.log("Initializing new collection...");
      const tx = await program.methods
        .initialize(
          "Shitpost Desktop",      // name
          "SHIT",                   // symbol
          "https://shitpost.pro",   // uri
          treasury,                 // treasury
          premiumFee               // premium_fee
        )
        .accounts({
          authority: wallet.publicKey,
          collectionConfig: collectionConfig,
          systemProgram: SystemProgram.programId,
        })
        .signers([wallet])
        .rpc();

      console.log("Initialize TX:", tx);
      console.log("https://solscan.io/tx/" + tx + "?cluster=devnet");

      // Verify
      const configData = await program.account.collectionConfig.fetch(collectionConfig);
      console.log("\nCollection initialized!");
      console.log("  Name:", configData.name);
      console.log("  Symbol:", configData.symbol);
      console.log("  Treasury:", configData.treasury.toBase58());
      console.log("  Premium Fee:", configData.premiumFee.toString(), "lamports");
    }
    console.log("✅ Initialize: SUCCESS\n");
  } catch (e: any) {
    console.log("❌ Initialize: FAILED");
    console.log("Error:", e.message);
    if (e.logs) console.log("Logs:", e.logs.slice(-5));
    console.log("");
  }

  // ============================================================
  // STEP 3: Mint with Premium
  // ============================================================
  console.log("=".repeat(60));
  console.log("STEP 3: Mint NFT with Premium Fee");
  console.log("=".repeat(60));

  try {
    const treasuryBalanceBefore = await connection.getBalance(treasury);
    console.log(`Treasury balance before: ${treasuryBalanceBefore / LAMPORTS_PER_SOL} SOL`);

    // Generate new mint keypair
    const mint = Keypair.generate();
    console.log(`New mint: ${mint.publicKey.toBase58()}`);

    // Derive token account
    const tokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      wallet.publicKey
    );

    // Derive metadata PDA
    const [metadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    // Derive master edition PDA
    const [masterEdition] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    console.log("Minting NFT...");
    const tx = await program.methods
      .mintWithPremium("ipfs://QmTestDevnetUri123")
      .accounts({
        minter: wallet.publicKey,
        collectionConfig: collectionConfig,
        treasury: treasury,
        mint: mint.publicKey,
        tokenAccount: tokenAccount,
        metadata: metadata,
        masterEdition: masterEdition,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([wallet, mint])
      .rpc();

    console.log("Mint TX:", tx);
    console.log("https://solscan.io/tx/" + tx + "?cluster=devnet");

    // Verify fee was paid
    const treasuryBalanceAfter = await connection.getBalance(treasury);
    console.log(`Treasury balance after: ${treasuryBalanceAfter / LAMPORTS_PER_SOL} SOL`);

    // Check token balance
    const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
    console.log(`Token balance: ${tokenBalance.value.uiAmount}`);

    // Read updated config
    const configData = await program.account.collectionConfig.fetch(collectionConfig);
    console.log(`Total minted: ${configData.totalMinted.toString()}`);

    console.log("✅ Mint with Premium: SUCCESS\n");
  } catch (e: any) {
    console.log("❌ Mint with Premium: FAILED");
    console.log("Error:", e.message);
    if (e.logs) console.log("Logs:", e.logs.slice(-10));
    console.log("");
  }

  // ============================================================
  // STEP 4: Test set_treasury
  // ============================================================
  console.log("=".repeat(60));
  console.log("STEP 4: Test set_treasury (Admin)");
  console.log("=".repeat(60));

  try {
    // Generate a new treasury address for testing
    const newTreasury = Keypair.generate().publicKey;
    console.log(`Changing treasury to: ${newTreasury.toBase58()}`);

    const tx = await program.methods
      .setTreasury(newTreasury)
      .accounts({
        authority: wallet.publicKey,
        collectionConfig: collectionConfig,
      })
      .signers([wallet])
      .rpc();

    console.log("Set Treasury TX:", tx);
    console.log("https://solscan.io/tx/" + tx + "?cluster=devnet");

    // Verify
    const configData = await program.account.collectionConfig.fetch(collectionConfig);
    console.log(`New treasury: ${configData.treasury.toBase58()}`);

    // Change it back
    console.log("\nChanging treasury back to original...");
    const tx2 = await program.methods
      .setTreasury(wallet.publicKey)
      .accounts({
        authority: wallet.publicKey,
        collectionConfig: collectionConfig,
      })
      .signers([wallet])
      .rpc();
    console.log("Restore TX:", tx2);

    console.log("✅ set_treasury: SUCCESS\n");
  } catch (e: any) {
    console.log("❌ set_treasury: FAILED");
    console.log("Error:", e.message);
    if (e.logs) console.log("Logs:", e.logs.slice(-5));
    console.log("");
  }

  // ============================================================
  // STEP 5: Test set_premium_fee
  // ============================================================
  console.log("=".repeat(60));
  console.log("STEP 5: Test set_premium_fee (Admin)");
  console.log("=".repeat(60));

  try {
    const newFee = new anchor.BN(20_000_000); // 0.02 SOL
    console.log(`Changing premium fee to: ${newFee.toString()} lamports (0.02 SOL)`);

    const tx = await program.methods
      .setPremiumFee(newFee)
      .accounts({
        authority: wallet.publicKey,
        collectionConfig: collectionConfig,
      })
      .signers([wallet])
      .rpc();

    console.log("Set Fee TX:", tx);
    console.log("https://solscan.io/tx/" + tx + "?cluster=devnet");

    // Verify
    const configData = await program.account.collectionConfig.fetch(collectionConfig);
    console.log(`New premium fee: ${configData.premiumFee.toString()} lamports`);

    // Change it back
    console.log("\nChanging fee back to original...");
    const tx2 = await program.methods
      .setPremiumFee(premiumFee)
      .accounts({
        authority: wallet.publicKey,
        collectionConfig: collectionConfig,
      })
      .signers([wallet])
      .rpc();
    console.log("Restore TX:", tx2);

    console.log("✅ set_premium_fee: SUCCESS\n");
  } catch (e: any) {
    console.log("❌ set_premium_fee: FAILED");
    console.log("Error:", e.message);
    if (e.logs) console.log("Logs:", e.logs.slice(-5));
    console.log("");
  }

  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log("=".repeat(60));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(60));

  const finalBalance = await connection.getBalance(wallet.publicKey);
  console.log(`Final balance: ${finalBalance / LAMPORTS_PER_SOL} SOL`);
  console.log(`SOL spent on tests: ${(balance - finalBalance) / LAMPORTS_PER_SOL} SOL`);

  const configData = await program.account.collectionConfig.fetch(collectionConfig);
  console.log("\nFinal Collection State:");
  console.log(`  Name: ${configData.name}`);
  console.log(`  Symbol: ${configData.symbol}`);
  console.log(`  Authority: ${configData.authority.toBase58()}`);
  console.log(`  Treasury: ${configData.treasury.toBase58()}`);
  console.log(`  Premium Fee: ${configData.premiumFee.toString()} lamports`);
  console.log(`  Total Minted: ${configData.totalMinted.toString()}`);
  console.log(`  Total Burned: ${configData.totalBurned.toString()}`);
}

main().catch(console.error);
