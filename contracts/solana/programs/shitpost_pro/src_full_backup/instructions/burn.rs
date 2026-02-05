use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Burn, CloseAccount};

use crate::state::{CollectionConfig, BurnedArt, SacredWastePit, PitBurnRecord, BurnerStats};

#[derive(Accounts)]
pub struct BurnNft<'info> {
    #[account(mut)]
    pub burner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"collection_config"],
        bump = collection_config.bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = burner,
        constraint = token_account.amount == 1 @ BurnError::NotOwner
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = burner,
        space = BurnedArt::LEN,
        seeds = [b"burned_art", mint.key().as_ref()],
        bump
    )]
    pub burned_art: Account<'info, BurnedArt>,

    /// CHECK: Metadata account to read URI from
    pub metadata: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BurnToWaste<'info> {
    #[account(mut)]
    pub burner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"collection_config"],
        bump = collection_config.bump,
        constraint = collection_config.sacred_waste_pit.is_some() @ BurnError::PitNotConfigured
    )]
    pub collection_config: Box<Account<'info, CollectionConfig>>,

    #[account(
        mut,
        seeds = [b"sacred_waste_pit"],
        bump = sacred_waste_pit.bump
    )]
    pub sacred_waste_pit: Box<Account<'info, SacredWastePit>>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = burner,
        constraint = token_account.amount == 1 @ BurnError::NotOwner
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = burner,
        space = BurnedArt::LEN,
        seeds = [b"burned_art", mint.key().as_ref()],
        bump
    )]
    pub burned_art: Box<Account<'info, BurnedArt>>,

    #[account(
        init,
        payer = burner,
        space = PitBurnRecord::LEN,
        seeds = [b"pit_burn", sacred_waste_pit.total_burns.to_le_bytes().as_ref()],
        bump
    )]
    pub pit_burn_record: Box<Account<'info, PitBurnRecord>>,

    #[account(
        init_if_needed,
        payer = burner,
        space = BurnerStats::LEN,
        seeds = [b"burner_stats", burner.key().as_ref()],
        bump
    )]
    pub burner_stats: Box<Account<'info, BurnerStats>>,

    /// CHECK: Metadata account to read URI from
    pub metadata: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<BurnNft>) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;
    let clock = Clock::get()?;

    // Read token URI from metadata (simplified - in production, properly deserialize)
    let token_uri = "ipfs://burned".to_string(); // Placeholder - would extract from metadata

    // Store burned art record
    let burned_art = &mut ctx.accounts.burned_art;
    burned_art.artist = ctx.accounts.burner.key();
    burned_art.token_uri = token_uri.clone();
    burned_art.burned_at = clock.unix_timestamp;
    burned_art.original_mint = ctx.accounts.mint.key();
    burned_art.bump = ctx.bumps.burned_art;

    // Update collection stats (checked arithmetic to prevent overflow)
    config.total_burned = config.total_burned.checked_add(1).ok_or(BurnError::MathOverflow)?;

    // Burn the token
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.burner.to_account_info(),
            },
        ),
        1,
    )?;

    // Close the token account
    token::close_account(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.token_account.to_account_info(),
                destination: ctx.accounts.burner.to_account_info(),
                authority: ctx.accounts.burner.to_account_info(),
            },
        ),
    )?;

    msg!("NFT burned: {}", ctx.accounts.mint.key());
    emit!(ArtBurned {
        artist: ctx.accounts.burner.key(),
        token_uri,
        mint: ctx.accounts.mint.key(),
    });

    Ok(())
}

pub fn handler_to_waste(ctx: Context<BurnToWaste>) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;
    let pit = &mut ctx.accounts.sacred_waste_pit;
    let clock = Clock::get()?;

    // Read token URI from metadata (simplified)
    let token_uri = "ipfs://burned".to_string(); // Placeholder

    // Store burned art record
    let burned_art = &mut ctx.accounts.burned_art;
    burned_art.artist = ctx.accounts.burner.key();
    burned_art.token_uri = token_uri.clone();
    burned_art.burned_at = clock.unix_timestamp;
    burned_art.original_mint = ctx.accounts.mint.key();
    burned_art.bump = ctx.bumps.burned_art;

    // Store pit burn record
    let pit_burn = &mut ctx.accounts.pit_burn_record;
    pit_burn.burner = ctx.accounts.burner.key();
    pit_burn.metadata = token_uri.clone();
    pit_burn.timestamp = clock.unix_timestamp;
    pit_burn.burn_id = pit.total_burns;
    pit_burn.bump = ctx.bumps.pit_burn_record;

    // Update burner stats
    let stats = &mut ctx.accounts.burner_stats;
    if stats.burner == Pubkey::default() {
        stats.burner = ctx.accounts.burner.key();
        stats.bump = ctx.bumps.burner_stats;
    }
    stats.burn_count = stats.burn_count.checked_add(1).ok_or(BurnError::MathOverflow)?;

    // Update counts (checked arithmetic to prevent overflow)
    config.total_burned = config.total_burned.checked_add(1).ok_or(BurnError::MathOverflow)?;
    pit.total_burns = pit.total_burns.checked_add(1).ok_or(BurnError::MathOverflow)?;

    // Burn the token
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.burner.to_account_info(),
            },
        ),
        1,
    )?;

    // Close the token account
    token::close_account(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.token_account.to_account_info(),
                destination: ctx.accounts.burner.to_account_info(),
                authority: ctx.accounts.burner.to_account_info(),
            },
        ),
    )?;

    msg!("NFT burned to Sacred Waste: {}", ctx.accounts.mint.key());
    emit!(BurnedToSacredWaste {
        artist: ctx.accounts.burner.key(),
        burn_id: pit_burn.burn_id,
        mint: ctx.accounts.mint.key(),
    });

    Ok(())
}

#[event]
pub struct ArtBurned {
    pub artist: Pubkey,
    pub token_uri: String,
    pub mint: Pubkey,
}

#[event]
pub struct BurnedToSacredWaste {
    pub artist: Pubkey,
    pub burn_id: u64,
    pub mint: Pubkey,
}

#[error_code]
pub enum BurnError {
    #[msg("You do not own this NFT")]
    NotOwner,
    #[msg("Sacred Waste Pit is not configured")]
    PitNotConfigured,
    #[msg("Math overflow")]
    MathOverflow,
}
