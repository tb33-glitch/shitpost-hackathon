export type ShitpostPro = {
  "version": "0.1.0",
  "name": "shitpost_pro",
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "Initialize the collection configuration"
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "treasury",
          "type": "publicKey"
        },
        {
          "name": "premiumFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mint",
      "docs": [
        "Mint a new NFT"
      ],
      "accounts": [
        {
          "name": "minter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "mintWithPremium",
      "docs": [
        "Mint with premium fee"
      ],
      "accounts": [
        {
          "name": "minter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "burn",
      "docs": [
        "Burn an NFT and record in gallery"
      ],
      "accounts": [
        {
          "name": "burner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnedArt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "burnToWaste",
      "docs": [
        "Burn an NFT to Sacred Waste Pit"
      ],
      "accounts": [
        {
          "name": "burner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sacredWastePit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnedArt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pitBurnRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnerStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initializePit",
      "docs": [
        "Initialize the Sacred Waste Pit"
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sacredWastePit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "depositBurn",
      "docs": [
        "Deposit a burn record to the pit (called by authorized programs)"
      ],
      "accounts": [
        {
          "name": "caller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sacredWastePit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorizedProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pitBurnRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnerStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "burner",
          "type": "publicKey"
        },
        {
          "name": "metadata",
          "type": "string"
        }
      ]
    },
    {
      "name": "setSacredWastePit",
      "docs": [
        "Set the Sacred Waste Pit address"
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "pit",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setTreasury",
      "docs": [
        "Update treasury address"
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "treasury",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setPremiumFee",
      "docs": [
        "Update premium fee"
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "fee",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "collectionConfig",
      "docs": [
        "Collection configuration account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Authority that can update the collection"
            ],
            "type": "publicKey"
          },
          {
            "name": "name",
            "docs": [
              "Collection name"
            ],
            "type": "string"
          },
          {
            "name": "symbol",
            "docs": [
              "Collection symbol"
            ],
            "type": "string"
          },
          {
            "name": "uri",
            "docs": [
              "Base URI for metadata"
            ],
            "type": "string"
          },
          {
            "name": "treasury",
            "docs": [
              "Treasury address for premium fees"
            ],
            "type": "publicKey"
          },
          {
            "name": "premiumFee",
            "docs": [
              "Premium fee in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "totalMinted",
            "docs": [
              "Total tokens minted"
            ],
            "type": "u64"
          },
          {
            "name": "totalBurned",
            "docs": [
              "Total tokens burned"
            ],
            "type": "u64"
          },
          {
            "name": "sacredWastePit",
            "docs": [
              "Sacred Waste Pit address (optional)"
            ],
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "burnedArt",
      "docs": [
        "Record of a burned NFT for the gallery"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "artist",
            "docs": [
              "The artist who created and burned the NFT"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenUri",
            "docs": [
              "Token URI / metadata"
            ],
            "type": "string"
          },
          {
            "name": "burnedAt",
            "docs": [
              "Timestamp of burn"
            ],
            "type": "i64"
          },
          {
            "name": "originalMint",
            "docs": [
              "Original mint address"
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sacredWastePit",
      "docs": [
        "Sacred Waste Pit configuration"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Authority that can manage the pit"
            ],
            "type": "publicKey"
          },
          {
            "name": "totalBurns",
            "docs": [
              "Total burns deposited"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "pitBurnRecord",
      "docs": [
        "Individual burn record in the Sacred Waste Pit"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "burner",
            "docs": [
              "The burner address"
            ],
            "type": "publicKey"
          },
          {
            "name": "metadata",
            "docs": [
              "Metadata string"
            ],
            "type": "string"
          },
          {
            "name": "timestamp",
            "docs": [
              "Timestamp of burn"
            ],
            "type": "i64"
          },
          {
            "name": "burnId",
            "docs": [
              "Burn ID (sequential)"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "burnerStats",
      "docs": [
        "Per-address burn counter for the pit"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "burner",
            "docs": [
              "The burner address"
            ],
            "type": "publicKey"
          },
          {
            "name": "burnCount",
            "docs": [
              "Number of burns by this address"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "authorizedProgram",
      "docs": [
        "Authorized contract record for the pit"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "programId",
            "docs": [
              "The authorized program address"
            ],
            "type": "publicKey"
          },
          {
            "name": "isAuthorized",
            "docs": [
              "Whether it's currently authorized"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "BurnError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NotOwner"
          },
          {
            "name": "PitNotConfigured"
          }
        ]
      }
    },
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NameTooLong"
          },
          {
            "name": "SymbolTooLong"
          },
          {
            "name": "UriTooLong"
          }
        ]
      }
    },
    {
      "name": "PitError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unauthorized"
          },
          {
            "name": "MetadataTooLong"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "SacredWastePitUpdated",
      "fields": [
        {
          "name": "oldPit",
          "type": {
            "option": "publicKey"
          },
          "index": false
        },
        {
          "name": "newPit",
          "type": {
            "option": "publicKey"
          },
          "index": false
        }
      ]
    },
    {
      "name": "TreasuryUpdated",
      "fields": [
        {
          "name": "oldTreasury",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newTreasury",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "PremiumFeeUpdated",
      "fields": [
        {
          "name": "oldFee",
          "type": "u64",
          "index": false
        },
        {
          "name": "newFee",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "AuthorityTransferred",
      "fields": [
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ArtBurned",
      "fields": [
        {
          "name": "artist",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenUri",
          "type": "string",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "BurnedToSacredWaste",
      "fields": [
        {
          "name": "artist",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "burnId",
          "type": "u64",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ArtMinted",
      "fields": [
        {
          "name": "tokenId",
          "type": "u64",
          "index": false
        },
        {
          "name": "artist",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenUri",
          "type": "string",
          "index": false
        },
        {
          "name": "premium",
          "type": "bool",
          "index": false
        }
      ]
    },
    {
      "name": "BurnDeposited",
      "fields": [
        {
          "name": "burnId",
          "type": "u64",
          "index": false
        },
        {
          "name": "burner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Caller is not the authority"
    }
  ]
};

export const IDL: ShitpostPro = {
  "version": "0.1.0",
  "name": "shitpost_pro",
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "Initialize the collection configuration"
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "treasury",
          "type": "publicKey"
        },
        {
          "name": "premiumFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mint",
      "docs": [
        "Mint a new NFT"
      ],
      "accounts": [
        {
          "name": "minter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "mintWithPremium",
      "docs": [
        "Mint with premium fee"
      ],
      "accounts": [
        {
          "name": "minter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "burn",
      "docs": [
        "Burn an NFT and record in gallery"
      ],
      "accounts": [
        {
          "name": "burner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnedArt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "burnToWaste",
      "docs": [
        "Burn an NFT to Sacred Waste Pit"
      ],
      "accounts": [
        {
          "name": "burner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sacredWastePit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnedArt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pitBurnRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnerStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initializePit",
      "docs": [
        "Initialize the Sacred Waste Pit"
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sacredWastePit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "depositBurn",
      "docs": [
        "Deposit a burn record to the pit (called by authorized programs)"
      ],
      "accounts": [
        {
          "name": "caller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sacredWastePit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorizedProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pitBurnRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnerStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "burner",
          "type": "publicKey"
        },
        {
          "name": "metadata",
          "type": "string"
        }
      ]
    },
    {
      "name": "setSacredWastePit",
      "docs": [
        "Set the Sacred Waste Pit address"
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "pit",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setTreasury",
      "docs": [
        "Update treasury address"
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "treasury",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setPremiumFee",
      "docs": [
        "Update premium fee"
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collectionConfig",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "fee",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "collectionConfig",
      "docs": [
        "Collection configuration account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Authority that can update the collection"
            ],
            "type": "publicKey"
          },
          {
            "name": "name",
            "docs": [
              "Collection name"
            ],
            "type": "string"
          },
          {
            "name": "symbol",
            "docs": [
              "Collection symbol"
            ],
            "type": "string"
          },
          {
            "name": "uri",
            "docs": [
              "Base URI for metadata"
            ],
            "type": "string"
          },
          {
            "name": "treasury",
            "docs": [
              "Treasury address for premium fees"
            ],
            "type": "publicKey"
          },
          {
            "name": "premiumFee",
            "docs": [
              "Premium fee in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "totalMinted",
            "docs": [
              "Total tokens minted"
            ],
            "type": "u64"
          },
          {
            "name": "totalBurned",
            "docs": [
              "Total tokens burned"
            ],
            "type": "u64"
          },
          {
            "name": "sacredWastePit",
            "docs": [
              "Sacred Waste Pit address (optional)"
            ],
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "burnedArt",
      "docs": [
        "Record of a burned NFT for the gallery"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "artist",
            "docs": [
              "The artist who created and burned the NFT"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenUri",
            "docs": [
              "Token URI / metadata"
            ],
            "type": "string"
          },
          {
            "name": "burnedAt",
            "docs": [
              "Timestamp of burn"
            ],
            "type": "i64"
          },
          {
            "name": "originalMint",
            "docs": [
              "Original mint address"
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sacredWastePit",
      "docs": [
        "Sacred Waste Pit configuration"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Authority that can manage the pit"
            ],
            "type": "publicKey"
          },
          {
            "name": "totalBurns",
            "docs": [
              "Total burns deposited"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "pitBurnRecord",
      "docs": [
        "Individual burn record in the Sacred Waste Pit"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "burner",
            "docs": [
              "The burner address"
            ],
            "type": "publicKey"
          },
          {
            "name": "metadata",
            "docs": [
              "Metadata string"
            ],
            "type": "string"
          },
          {
            "name": "timestamp",
            "docs": [
              "Timestamp of burn"
            ],
            "type": "i64"
          },
          {
            "name": "burnId",
            "docs": [
              "Burn ID (sequential)"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "burnerStats",
      "docs": [
        "Per-address burn counter for the pit"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "burner",
            "docs": [
              "The burner address"
            ],
            "type": "publicKey"
          },
          {
            "name": "burnCount",
            "docs": [
              "Number of burns by this address"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "authorizedProgram",
      "docs": [
        "Authorized contract record for the pit"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "programId",
            "docs": [
              "The authorized program address"
            ],
            "type": "publicKey"
          },
          {
            "name": "isAuthorized",
            "docs": [
              "Whether it's currently authorized"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "BurnError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NotOwner"
          },
          {
            "name": "PitNotConfigured"
          }
        ]
      }
    },
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NameTooLong"
          },
          {
            "name": "SymbolTooLong"
          },
          {
            "name": "UriTooLong"
          }
        ]
      }
    },
    {
      "name": "PitError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unauthorized"
          },
          {
            "name": "MetadataTooLong"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "SacredWastePitUpdated",
      "fields": [
        {
          "name": "oldPit",
          "type": {
            "option": "publicKey"
          },
          "index": false
        },
        {
          "name": "newPit",
          "type": {
            "option": "publicKey"
          },
          "index": false
        }
      ]
    },
    {
      "name": "TreasuryUpdated",
      "fields": [
        {
          "name": "oldTreasury",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newTreasury",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "PremiumFeeUpdated",
      "fields": [
        {
          "name": "oldFee",
          "type": "u64",
          "index": false
        },
        {
          "name": "newFee",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "AuthorityTransferred",
      "fields": [
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ArtBurned",
      "fields": [
        {
          "name": "artist",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenUri",
          "type": "string",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "BurnedToSacredWaste",
      "fields": [
        {
          "name": "artist",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "burnId",
          "type": "u64",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ArtMinted",
      "fields": [
        {
          "name": "tokenId",
          "type": "u64",
          "index": false
        },
        {
          "name": "artist",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenUri",
          "type": "string",
          "index": false
        },
        {
          "name": "premium",
          "type": "bool",
          "index": false
        }
      ]
    },
    {
      "name": "BurnDeposited",
      "fields": [
        {
          "name": "burnId",
          "type": "u64",
          "index": false
        },
        {
          "name": "burner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Caller is not the authority"
    }
  ]
};
