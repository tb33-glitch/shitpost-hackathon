use anchor_lang::prelude::*;
use crate::state::CollectionConfig;

#[derive(Accounts)]
pub struct SetTreasury<'info> {
    #[account(
        mut,
        constraint = authority.key() == collection_config.authority @ AdminError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"collection_config"],
        bump = collection_config.bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,
}

#[derive(Accounts)]
pub struct SetPremiumFee<'info> {
    #[account(
        mut,
        constraint = authority.key() == collection_config.authority @ AdminError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"collection_config"],
        bump = collection_config.bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,
}

pub fn handler_set_treasury(ctx: Context<SetTreasury>, treasury: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;
    let old_treasury = config.treasury;
    config.treasury = treasury;

    msg!("Treasury updated");
    emit!(TreasuryUpdated {
        old_treasury,
        new_treasury: treasury,
    });

    Ok(())
}

pub fn handler_set_premium_fee(ctx: Context<SetPremiumFee>, fee: u64) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;
    let old_fee = config.premium_fee;
    config.premium_fee = fee;

    msg!("Premium fee updated: {} -> {}", old_fee, fee);
    emit!(PremiumFeeUpdated {
        old_fee,
        new_fee: fee,
    });

    Ok(())
}

#[event]
pub struct TreasuryUpdated {
    pub old_treasury: Pubkey,
    pub new_treasury: Pubkey,
}

#[event]
pub struct PremiumFeeUpdated {
    pub old_fee: u64,
    pub new_fee: u64,
}

#[error_code]
pub enum AdminError {
    #[msg("Caller is not the authority")]
    Unauthorized,
}
