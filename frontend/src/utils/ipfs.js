const PINATA_JWT = import.meta.env.VITE_PINATA_JWT
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud'

// Upload image blob to Pinata
export async function uploadImage(blob, filename = 'artwork.png') {
  if (!PINATA_JWT) {
    throw new Error('Pinata JWT not configured. Please add VITE_PINATA_JWT to your .env file.')
  }

  const formData = new FormData()
  formData.append('file', blob, filename)

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload image: ${error}`)
  }

  const data = await response.json()
  return {
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
    gateway: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
  }
}

// Upload metadata JSON to Pinata
export async function uploadMetadata(metadata) {
  if (!PINATA_JWT) {
    throw new Error('Pinata JWT not configured. Please add VITE_PINATA_JWT to your .env file.')
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: metadata.name || 'shitpost.pro metadata',
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload metadata: ${error}`)
  }

  const data = await response.json()
  return {
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
    gateway: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
  }
}

// Generate NFT metadata
export function generateMetadata(imageIpfsUrl, tokenId) {
  return {
    name: `shitpost #${tokenId}`,
    description: 'A professional shitpost minted on shitpost.pro',
    image: imageIpfsUrl,
    external_url: 'https://shitpost.pro',
    attributes: [
      {
        trait_type: 'Canvas Size',
        value: '1080x1080',
      },
      {
        display_type: 'date',
        trait_type: 'Created',
        value: Math.floor(Date.now() / 1000),
      },
    ],
  }
}

// Fetch metadata from IPFS
export async function fetchMetadata(ipfsUrl) {
  const url = ipfsUrl.replace('ipfs://', `https://${PINATA_GATEWAY}/ipfs/`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch metadata')
  }

  try {
    return await response.json()
  } catch (parseError) {
    throw new Error('Failed to parse metadata JSON')
  }
}

// Convert IPFS URL to gateway URL
export function ipfsToGateway(ipfsUrl) {
  if (!ipfsUrl) return ''
  return ipfsUrl.replace('ipfs://', `https://${PINATA_GATEWAY}/ipfs/`)
}
