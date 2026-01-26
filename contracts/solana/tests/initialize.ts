import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ShitpostPro } from "../target/types/shitpost_pro";

describe("initialize", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShitpostPro as Program<ShitpostPro>;

  it("Initializes the program", async () => {
    console.log("Program ID:", program.programId.toString());
    console.log("Wallet:", provider.wallet.publicKey.toString());

    // Derive PDAs
    const [collectionConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_config")],
      program.programId
    );

    const [sacredWastePit] = PublicKey.findProgramAddressSync(
      [Buffer.from("sacred_waste_pit")],
      program.programId
    );

    console.log("Collection Config PDA:", collectionConfig.toString());
    console.log("Sacred Waste Pit PDA:", sacredWastePit.toString());

    // Check if already initialized
    try {
      const config = await program.account.collectionConfig.fetch(collectionConfig);
      console.log("\n✅ Program already initialized!");
      console.log("Collection Name:", config.name);
      console.log("Symbol:", config.symbol);
      console.log("Total Minted:", config.totalMinted.toString());
      console.log("Total Burned:", config.totalBurned.toString());
      return;
    } catch (e) {
      console.log("\nProgram not yet initialized, initializing now...\n");
    }

    // Initialize the collection
    try {
      const tx = await program.methods
        .initialize(
          "ShitpostPro",
          "SHIT",
          provider.wallet.publicKey
        )
        .accounts({
          collectionConfig,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Initialize transaction:", tx);
    } catch (e) {
      console.error("Initialize error:", e);
    }

    // Initialize the Sacred Waste Pit
    try {
      const tx = await program.methods
        .initializePit()
        .accounts({
          sacredWastePit,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Initialize Pit transaction:", tx);
    } catch (e) {
      console.error("Initialize Pit error:", e);
    }

    // Verify initialization
    try {
      const config = await program.account.collectionConfig.fetch(collectionConfig);
      console.log("\n🎉 Initialization complete!");
      console.log("Collection Name:", config.name);
      console.log("Symbol:", config.symbol);
    } catch (e) {
      console.log("Could not verify:", e);
    }
  });
});
