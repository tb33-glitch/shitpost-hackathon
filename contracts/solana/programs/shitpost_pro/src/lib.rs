use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("62gJC6oneEykVGdAq7Lr2x5bw33B3CnmHVHeeCxkZ7yJ");

#[program]
pub mod shitpost_pro {
    use super::*;

    /// Initialize the collection configuration
    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        uri: String,
        treasury: Pubkey,
        premium_fee: u64,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, name, symbol, uri, treasury, premium_fee)
    }

    /// Mint a new NFT
    pub fn mint(ctx: Context<MintNft>, uri: String) -> Result<()> {
        instructions::mint::handler(ctx, uri)
    }

    /// Mint with premium fee
    pub fn mint_with_premium(ctx: Context<MintNftWithPremium>, uri: String) -> Result<()> {
        instructions::mint::handler_with_premium(ctx, uri)
    }

    /// Burn an NFT and record in gallery
    pub fn burn(ctx: Context<BurnNft>) -> Result<()> {
        instructions::burn::handler(ctx)
    }

    /// Burn an NFT to Sacred Waste Pit
    pub fn burn_to_waste(ctx: Context<BurnToWaste>) -> Result<()> {
        instructions::burn::handler_to_waste(ctx)
    }

    /// Initialize the Sacred Waste Pit
    pub fn initialize_pit(ctx: Context<InitializePit>) -> Result<()> {
        instructions::pit::handler_init(ctx)
    }

    /// Deposit a burn record to the pit (called by authorized programs)
    pub fn deposit_burn(ctx: Context<DepositBurn>, burner: Pubkey, metadata: String) -> Result<()> {
        instructions::pit::handler_deposit(ctx, burner, metadata)
    }

    /// Set the Sacred Waste Pit address
    pub fn set_sacred_waste_pit(ctx: Context<SetSacredWastePit>, pit: Pubkey) -> Result<()> {
        instructions::admin::handler_set_pit(ctx, pit)
    }

    /// Update treasury address
    pub fn set_treasury(ctx: Context<SetTreasury>, treasury: Pubkey) -> Result<()> {
        instructions::admin::handler_set_treasury(ctx, treasury)
    }

    /// Update premium fee
    pub fn set_premium_fee(ctx: Context<SetPremiumFee>, fee: u64) -> Result<()> {
        instructions::admin::handler_set_premium_fee(ctx, fee)
    }
}
