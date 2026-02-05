use anchor_lang::prelude::*;
use crate::state::{SacredWastePit, PitBurnRecord, BurnerStats, AuthorizedProgram};

#[derive(Accounts)]
pub struct InitializePit<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = SacredWastePit::LEN,
        seeds = [b"sacred_waste_pit"],
        bump
    )]
    pub sacred_waste_pit: Account<'info, SacredWastePit>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(burner: Pubkey, metadata: String)]
pub struct DepositBurn<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sacred_waste_pit"],
        bump = sacred_waste_pit.bump
    )]
    pub sacred_waste_pit: Account<'info, SacredWastePit>,

    #[account(
        seeds = [b"authorized_program", caller.key().as_ref()],
        bump = authorized_program.bump,
        constraint = authorized_program.is_authorized @ PitError::Unauthorized
    )]
    pub authorized_program: Account<'info, AuthorizedProgram>,

    #[account(
        init,
        payer = caller,
        space = PitBurnRecord::LEN,
        seeds = [b"pit_burn", sacred_waste_pit.total_burns.to_le_bytes().as_ref()],
        bump
    )]
    pub pit_burn_record: Account<'info, PitBurnRecord>,

    #[account(
        init_if_needed,
        payer = caller,
        space = BurnerStats::LEN,
        seeds = [b"burner_stats", burner.as_ref()],
        bump
    )]
    pub burner_stats: Account<'info, BurnerStats>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AuthorizeProgram<'info> {
    #[account(
        mut,
        constraint = authority.key() == sacred_waste_pit.authority @ PitError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"sacred_waste_pit"],
        bump = sacred_waste_pit.bump
    )]
    pub sacred_waste_pit: Account<'info, SacredWastePit>,

    /// CHECK: The program to authorize
    pub program_to_authorize: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = AuthorizedProgram::LEN,
        seeds = [b"authorized_program", program_to_authorize.key().as_ref()],
        bump
    )]
    pub authorized_program: Account<'info, AuthorizedProgram>,

    pub system_program: Program<'info, System>,
}

pub fn handler_init(ctx: Context<InitializePit>) -> Result<()> {
    let pit = &mut ctx.accounts.sacred_waste_pit;
    pit.authority = ctx.accounts.authority.key();
    pit.total_burns = 0;
    pit.bump = ctx.bumps.sacred_waste_pit;

    msg!("Sacred Waste Pit initialized");

    Ok(())
}

pub fn handler_deposit(ctx: Context<DepositBurn>, burner: Pubkey, metadata: String) -> Result<()> {
    require!(
        metadata.len() <= PitBurnRecord::MAX_METADATA_LEN,
        PitError::MetadataTooLong
    );

    let pit = &mut ctx.accounts.sacred_waste_pit;
    let clock = Clock::get()?;

    // Store burn record
    let burn_record = &mut ctx.accounts.pit_burn_record;
    burn_record.burner = burner;
    burn_record.metadata = metadata;
    burn_record.timestamp = clock.unix_timestamp;
    burn_record.burn_id = pit.total_burns;
    burn_record.bump = ctx.bumps.pit_burn_record;

    // Update burner stats
    let stats = &mut ctx.accounts.burner_stats;
    if stats.burner == Pubkey::default() {
        stats.burner = burner;
        stats.bump = ctx.bumps.burner_stats;
    }
    stats.burn_count = stats.burn_count.checked_add(1).ok_or(PitError::MathOverflow)?;

    // Increment total burns (checked arithmetic to prevent overflow)
    pit.total_burns = pit.total_burns.checked_add(1).ok_or(PitError::MathOverflow)?;

    msg!("Burn deposited to pit: burn_id={}", burn_record.burn_id);
    emit!(BurnDeposited {
        burn_id: burn_record.burn_id,
        burner,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

pub fn handler_authorize(ctx: Context<AuthorizeProgram>, is_authorized: bool) -> Result<()> {
    let auth = &mut ctx.accounts.authorized_program;
    auth.program_id = ctx.accounts.program_to_authorize.key();
    auth.is_authorized = is_authorized;
    auth.bump = ctx.bumps.authorized_program;

    msg!(
        "Program {} authorization set to {}",
        ctx.accounts.program_to_authorize.key(),
        is_authorized
    );

    Ok(())
}

#[event]
pub struct BurnDeposited {
    pub burn_id: u64,
    pub burner: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum PitError {
    #[msg("Caller is not authorized")]
    Unauthorized,
    #[msg("Metadata is too long")]
    MetadataTooLong,
    #[msg("Math overflow")]
    MathOverflow,
}
