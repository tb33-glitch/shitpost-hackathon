use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("7F6SJmYgF8iEF9DQmpDUuboTRs4qYt5hr27TcXCuykDo");

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

    /// Mint a new NFT with premium fee
    pub fn mint_with_premium(ctx: Context<MintNftWithPremium>, uri: String) -> Result<()> {
        instructions::mint::handler_with_premium(ctx, uri)
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
