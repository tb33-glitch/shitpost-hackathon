use anchor_lang::prelude::*;
use crate::state::CollectionConfig;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = CollectionConfig::LEN,
        seeds = [b"collection_config"],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Initialize>,
    name: String,
    symbol: String,
    uri: String,
    treasury: Pubkey,
    premium_fee: u64,
) -> Result<()> {
    require!(
        name.len() <= CollectionConfig::MAX_NAME_LEN,
        ErrorCode::NameTooLong
    );
    require!(
        symbol.len() <= CollectionConfig::MAX_SYMBOL_LEN,
        ErrorCode::SymbolTooLong
    );
    require!(
        uri.len() <= CollectionConfig::MAX_URI_LEN,
        ErrorCode::UriTooLong
    );

    let config = &mut ctx.accounts.collection_config;
    config.authority = ctx.accounts.authority.key();
    config.name = name;
    config.symbol = symbol;
    config.uri = uri;
    config.treasury = treasury;
    config.premium_fee = premium_fee;
    config.total_minted = 0;
    config.total_burned = 0;
    config.sacred_waste_pit = None;
    config.bump = ctx.bumps.collection_config;

    msg!("Collection initialized: {}", config.name);

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Collection name is too long")]
    NameTooLong,
    #[msg("Collection symbol is too long")]
    SymbolTooLong,
    #[msg("URI is too long")]
    UriTooLong,
}
