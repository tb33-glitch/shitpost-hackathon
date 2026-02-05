use anchor_lang::prelude::*;

/// Collection configuration account
#[account]
#[derive(Default)]
pub struct CollectionConfig {
    /// Authority that can update the collection
    pub authority: Pubkey,
    /// Collection name
    pub name: String,
    /// Collection symbol
    pub symbol: String,
    /// Base URI for metadata
    pub uri: String,
    /// Treasury address for premium fees
    pub treasury: Pubkey,
    /// Premium fee in lamports
    pub premium_fee: u64,
    /// Total tokens minted
    pub total_minted: u64,
    /// Total tokens burned
    pub total_burned: u64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl CollectionConfig {
    pub const MAX_NAME_LEN: usize = 32;
    pub const MAX_SYMBOL_LEN: usize = 10;
    pub const MAX_URI_LEN: usize = 200;

    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        4 + Self::MAX_NAME_LEN + // name (string prefix + content)
        4 + Self::MAX_SYMBOL_LEN + // symbol
        4 + Self::MAX_URI_LEN + // uri
        32 + // treasury
        8 + // premium_fee
        8 + // total_minted
        8 + // total_burned
        1; // bump
}
