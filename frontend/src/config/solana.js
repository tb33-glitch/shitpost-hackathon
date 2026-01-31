import { PublicKey, clusterApiUrl } from '@solana/web3.js'

// $SHITPOST token (pump.fun)
export const SHITPOST_TOKEN_MINT = 'FjHwh3VkCHdd6LxPXQsV2eKFX3DErzzHvxHrHtmRpump'
export const SHITPOST_TOKEN_PUBKEY = new PublicKey(SHITPOST_TOKEN_MINT)

// Treasury address for mint fees (set in .env)
// This should be the same address that the keeper bot monitors
const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS_SOLANA

// Solana network configurations
export const SOLANA_NETWORKS = {
  devnet: {
    name: 'Devnet',
    endpoint: clusterApiUrl('devnet'),
    programId: new PublicKey(import.meta.env.VITE_SOLANA_PROGRAM_ID_DEVNET || '11111111111111111111111111111111'),
    pitProgramId: import.meta.env.VITE_SOLANA_PIT_DEVNET
      ? new PublicKey(import.meta.env.VITE_SOLANA_PIT_DEVNET)
      : null,
    treasury: TREASURY_ADDRESS ? new PublicKey(TREASURY_ADDRESS) : null,
    isTestnet: true,
  },
  mainnet: {
    name: 'Mainnet',
    endpoint: clusterApiUrl('mainnet-beta'),
    programId: new PublicKey(import.meta.env.VITE_SOLANA_PROGRAM_ID_MAINNET || '11111111111111111111111111111111'),
    pitProgramId: import.meta.env.VITE_SOLANA_PIT_MAINNET
      ? new PublicKey(import.meta.env.VITE_SOLANA_PIT_MAINNET)
      : null,
    treasury: TREASURY_ADDRESS ? new PublicKey(TREASURY_ADDRESS) : null,
    isTestnet: false,
  },
}

// Default network - configurable via environment variable
// Set VITE_SOLANA_NETWORK=mainnet for production
export const DEFAULT_SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'

// Get explorer cluster parameter for URLs
export const getExplorerCluster = (network) => {
  const net = network || DEFAULT_SOLANA_NETWORK
  return net === 'mainnet' ? '' : `?cluster=${net}`
}

// Get network config by name
export const getSolanaNetwork = (network) => SOLANA_NETWORKS[network] || SOLANA_NETWORKS[DEFAULT_SOLANA_NETWORK]

// Check if Solana is configured
export const isSolanaConfigured = () => {
  return !!(
    import.meta.env.VITE_SOLANA_PROGRAM_ID_DEVNET ||
    import.meta.env.VITE_SOLANA_PROGRAM_ID_MAINNET
  )
}

// Get treasury address for fee collection
export const getTreasuryAddress = (network) => {
  const config = SOLANA_NETWORKS[network] || SOLANA_NETWORKS[DEFAULT_SOLANA_NETWORK]
  return config.treasury
}

// PDA seeds for deriving account addresses
export const PDA_SEEDS = {
  COLLECTION_CONFIG: 'collection_config',
  SACRED_WASTE_PIT: 'sacred_waste_pit',
  BURNED_ART: 'burned_art',
  PIT_BURN: 'pit_burn',
  BURNER_STATS: 'burner_stats',
  AUTHORIZED_PROGRAM: 'authorized_program',
}

// Derive PDA addresses
export const deriveCollectionConfigPda = (programId) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.COLLECTION_CONFIG)],
    programId
  )
}

export const deriveSacredWastePitPda = (programId) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.SACRED_WASTE_PIT)],
    programId
  )
}

export const deriveBurnedArtPda = (programId, mintPubkey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.BURNED_ART), mintPubkey.toBuffer()],
    programId
  )
}

export const deriveBurnerStatsPda = (programId, burnerPubkey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.BURNER_STATS), burnerPubkey.toBuffer()],
    programId
  )
}
