import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShitpostPro } from "../target/types/shitpost_pro";
import { expect } from "chai";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

describe("shitpost_pro", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShitpostPro as Program<ShitpostPro>;

  const authority = provider.wallet;
  const treasury = Keypair.generate();

  // PDAs
  let collectionConfigPda: PublicKey;
  let sacredWastePitPda: PublicKey;

  before(async () => {
    // Derive PDAs
    [collectionConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_config")],
      program.programId
    );

    [sacredWastePitPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("sacred_waste_pit")],
      program.programId
    );
  });

  describe("Initialize", () => {
    it("initializes the collection config", async () => {
      const name = "ShitpostPro";
      const symbol = "SHITPOST";
      const uri = "https://shitpost.pro/metadata/";
      const premiumFee = new anchor.BN(400000); // 0.0004 SOL

      await program.methods
        .initialize(name, symbol, uri, treasury.publicKey, premiumFee)
        .accounts({
          authority: authority.publicKey,
          collectionConfig: collectionConfigPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const config = await program.account.collectionConfig.fetch(
        collectionConfigPda
      );

      expect(config.name).to.equal(name);
      expect(config.symbol).to.equal(symbol);
      expect(config.uri).to.equal(uri);
      expect(config.treasury.toString()).to.equal(treasury.publicKey.toString());
      expect(config.premiumFee.toNumber()).to.equal(premiumFee.toNumber());
      expect(config.totalMinted.toNumber()).to.equal(0);
      expect(config.totalBurned.toNumber()).to.equal(0);
    });
  });

  describe("Sacred Waste Pit", () => {
    it("initializes the Sacred Waste Pit", async () => {
      await program.methods
        .initializePit()
        .accounts({
          authority: authority.publicKey,
          sacredWastePit: sacredWastePitPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const pit = await program.account.sacredWastePit.fetch(sacredWastePitPda);

      expect(pit.authority.toString()).to.equal(authority.publicKey.toString());
      expect(pit.totalBurns.toNumber()).to.equal(0);
    });

    it("sets Sacred Waste Pit on collection config", async () => {
      await program.methods
        .setSacredWastePit(sacredWastePitPda)
        .accounts({
          authority: authority.publicKey,
          collectionConfig: collectionConfigPda,
        })
        .rpc();

      const config = await program.account.collectionConfig.fetch(
        collectionConfigPda
      );

      expect(config.sacredWastePit.toString()).to.equal(
        sacredWastePitPda.toString()
      );
    });
  });

  describe("Admin Functions", () => {
    it("updates the treasury", async () => {
      const newTreasury = Keypair.generate();

      await program.methods
        .setTreasury(newTreasury.publicKey)
        .accounts({
          authority: authority.publicKey,
          collectionConfig: collectionConfigPda,
        })
        .rpc();

      const config = await program.account.collectionConfig.fetch(
        collectionConfigPda
      );

      expect(config.treasury.toString()).to.equal(
        newTreasury.publicKey.toString()
      );
    });

    it("updates the premium fee", async () => {
      const newFee = new anchor.BN(500000);

      await program.methods
        .setPremiumFee(newFee)
        .accounts({
          authority: authority.publicKey,
          collectionConfig: collectionConfigPda,
        })
        .rpc();

      const config = await program.account.collectionConfig.fetch(
        collectionConfigPda
      );

      expect(config.premiumFee.toNumber()).to.equal(newFee.toNumber());
    });
  });

  // Note: Mint and burn tests require additional setup for Metaplex
  // and would be more comprehensive in a production environment
});
