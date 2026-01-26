use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instructions::{
    CreateMetadataAccountV3, CreateMetadataAccountV3InstructionArgs,
    CreateMasterEditionV3, CreateMasterEditionV3InstructionArgs,
};
use mpl_token_metadata::types::DataV2;

use crate::state::CollectionConfig;

#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub minter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"collection_config"],
        bump = collection_config.bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        init,
        payer = minter,
        mint::decimals = 0,
        mint::authority = collection_config,
        mint::freeze_authority = collection_config,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = minter,
        associated_token::mint = mint,
        associated_token::authority = minter,
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK: Metadata account created via CPI
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Master edition account created via CPI
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Metaplex Token Metadata program
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct MintNftWithPremium<'info> {
    #[account(mut)]
    pub minter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"collection_config"],
        bump = collection_config.bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    /// CHECK: Treasury receives the premium fee
    #[account(mut, address = collection_config.treasury)]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init,
        payer = minter,
        mint::decimals = 0,
        mint::authority = collection_config,
        mint::freeze_authority = collection_config,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = minter,
        associated_token::mint = mint,
        associated_token::authority = minter,
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK: Metadata account created via CPI
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Master edition account created via CPI
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Metaplex Token Metadata program
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<MintNft>, uri: String) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;
    let token_id = config.total_minted;
    config.total_minted += 1;

    // Mint the token
    let seeds = &[b"collection_config".as_ref(), &[config.bump]];
    let signer_seeds = &[&seeds[..]];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: config.to_account_info(),
            },
            signer_seeds,
        ),
        1,
    )?;

    // Create metadata account
    let name = format!("{} #{}", config.name, token_id);
    create_metadata_account(
        &ctx.accounts.metadata,
        &ctx.accounts.mint.to_account_info(),
        &config.to_account_info(),
        &ctx.accounts.minter.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.rent.to_account_info(),
        &ctx.accounts.token_metadata_program,
        name,
        config.symbol.clone(),
        uri.clone(),
        signer_seeds,
    )?;

    // Create master edition
    create_master_edition(
        &ctx.accounts.master_edition,
        &ctx.accounts.mint.to_account_info(),
        &config.to_account_info(),
        &ctx.accounts.metadata,
        &ctx.accounts.minter.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.rent.to_account_info(),
        &ctx.accounts.token_metadata_program,
        &ctx.accounts.token_program.to_account_info(),
        signer_seeds,
    )?;

    msg!("NFT minted: {} (token #{})", ctx.accounts.mint.key(), token_id);
    emit!(ArtMinted {
        token_id,
        artist: ctx.accounts.minter.key(),
        token_uri: uri,
        premium: false,
    });

    Ok(())
}

pub fn handler_with_premium(ctx: Context<MintNftWithPremium>, uri: String) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;

    // Transfer premium fee to treasury
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.minter.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        ),
        config.premium_fee,
    )?;

    let token_id = config.total_minted;
    config.total_minted += 1;

    // Mint the token
    let seeds = &[b"collection_config".as_ref(), &[config.bump]];
    let signer_seeds = &[&seeds[..]];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: config.to_account_info(),
            },
            signer_seeds,
        ),
        1,
    )?;

    // Create metadata account
    let name = format!("{} #{}", config.name, token_id);
    create_metadata_account(
        &ctx.accounts.metadata,
        &ctx.accounts.mint.to_account_info(),
        &config.to_account_info(),
        &ctx.accounts.minter.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.rent.to_account_info(),
        &ctx.accounts.token_metadata_program,
        name,
        config.symbol.clone(),
        uri.clone(),
        signer_seeds,
    )?;

    // Create master edition
    create_master_edition(
        &ctx.accounts.master_edition,
        &ctx.accounts.mint.to_account_info(),
        &config.to_account_info(),
        &ctx.accounts.metadata,
        &ctx.accounts.minter.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.rent.to_account_info(),
        &ctx.accounts.token_metadata_program,
        &ctx.accounts.token_program.to_account_info(),
        signer_seeds,
    )?;

    msg!("Premium NFT minted: {} (token #{})", ctx.accounts.mint.key(), token_id);
    emit!(ArtMinted {
        token_id,
        artist: ctx.accounts.minter.key(),
        token_uri: uri,
        premium: true,
    });

    Ok(())
}

fn create_metadata_account<'info>(
    metadata: &UncheckedAccount<'info>,
    mint: &AccountInfo<'info>,
    mint_authority: &AccountInfo<'info>,
    payer: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    rent: &AccountInfo<'info>,
    token_metadata_program: &UncheckedAccount<'info>,
    name: String,
    symbol: String,
    uri: String,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let accounts = CreateMetadataAccountV3 {
        metadata: metadata.key(),
        mint: mint.key(),
        mint_authority: mint_authority.key(),
        payer: payer.key(),
        update_authority: (mint_authority.key(), true),
        system_program: system_program.key(),
        rent: Some(rent.key()),
    };

    let args = CreateMetadataAccountV3InstructionArgs {
        data: DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        is_mutable: true,
        collection_details: None,
    };

    let ix = accounts.instruction(args);

    anchor_lang::solana_program::program::invoke_signed(
        &ix,
        &[
            metadata.to_account_info(),
            mint.clone(),
            mint_authority.clone(),
            payer.clone(),
            mint_authority.clone(),
            system_program.clone(),
            rent.clone(),
        ],
        signer_seeds,
    )?;

    Ok(())
}

fn create_master_edition<'info>(
    master_edition: &UncheckedAccount<'info>,
    mint: &AccountInfo<'info>,
    mint_authority: &AccountInfo<'info>,
    metadata: &UncheckedAccount<'info>,
    payer: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    rent: &AccountInfo<'info>,
    token_metadata_program: &UncheckedAccount<'info>,
    token_program: &AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let accounts = CreateMasterEditionV3 {
        edition: master_edition.key(),
        mint: mint.key(),
        update_authority: mint_authority.key(),
        mint_authority: mint_authority.key(),
        payer: payer.key(),
        metadata: metadata.key(),
        token_program: anchor_spl::token::ID,
        system_program: system_program.key(),
        rent: Some(rent.key()),
    };

    let args = CreateMasterEditionV3InstructionArgs {
        max_supply: Some(0), // Non-fungible, no additional prints
    };

    let ix = accounts.instruction(args);

    anchor_lang::solana_program::program::invoke_signed(
        &ix,
        &[
            master_edition.to_account_info(),
            mint.clone(),
            mint_authority.clone(),
            mint_authority.clone(),
            payer.clone(),
            metadata.to_account_info(),
            token_program.clone(),
            system_program.clone(),
            rent.clone(),
        ],
        signer_seeds,
    )?;

    Ok(())
}

#[event]
pub struct ArtMinted {
    pub token_id: u64,
    pub artist: Pubkey,
    pub token_uri: String,
    pub premium: bool,
}
