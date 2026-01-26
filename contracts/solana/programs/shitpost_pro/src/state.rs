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
    /// Sacred Waste Pit address (optional)
    pub sacred_waste_pit: Option<Pubkey>,
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
        1 + 32 + // sacred_waste_pit (Option<Pubkey>)
        1; // bump
}

/// Record of a burned NFT for the gallery
#[account]
pub struct BurnedArt {
    /// The artist who created and burned the NFT
    pub artist: Pubkey,
    /// Token URI / metadata
    pub token_uri: String,
    /// Timestamp of burn
    pub burned_at: i64,
    /// Original mint address
    pub original_mint: Pubkey,
    /// Bump seed for PDA
    pub bump: u8,
}

impl BurnedArt {
    pub const MAX_URI_LEN: usize = 200;

    pub const LEN: usize = 8 + // discriminator
        32 + // artist
        4 + Self::MAX_URI_LEN + // token_uri
        8 + // burned_at
        32 + // original_mint
        1; // bump
}

/// Sacred Waste Pit configuration
#[account]
#[derive(Default)]
pub struct SacredWastePit {
    /// Authority that can manage the pit
    pub authority: Pubkey,
    /// Total burns deposited
    pub total_burns: u64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl SacredWastePit {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 + // total_burns
        1; // bump
}

/// Individual burn record in the Sacred Waste Pit
#[account]
pub struct PitBurnRecord {
    /// The burner address
    pub burner: Pubkey,
    /// Metadata string
    pub metadata: String,
    /// Timestamp of burn
    pub timestamp: i64,
    /// Burn ID (sequential)
    pub burn_id: u64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl PitBurnRecord {
    pub const MAX_METADATA_LEN: usize = 200;

    pub const LEN: usize = 8 + // discriminator
        32 + // burner
        4 + Self::MAX_METADATA_LEN + // metadata
        8 + // timestamp
        8 + // burn_id
        1; // bump
}

/// Per-address burn counter for the pit
#[account]
pub struct BurnerStats {
    /// The burner address
    pub burner: Pubkey,
    /// Number of burns by this address
    pub burn_count: u64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl BurnerStats {
    pub const LEN: usize = 8 + // discriminator
        32 + // burner
        8 + // burn_count
        1; // bump
}

/// Authorized contract record for the pit
#[account]
pub struct AuthorizedProgram {
    /// The authorized program address
    pub program_id: Pubkey,
    /// Whether it's currently authorized
    pub is_authorized: bool,
    /// Bump seed for PDA
    pub bump: u8,
}

impl AuthorizedProgram {
    pub const LEN: usize = 8 + // discriminator
        32 + // program_id
        1 + // is_authorized
        1; // bump
}
