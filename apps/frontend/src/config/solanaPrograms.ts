/** Only the local test programs exist in source. No environment variable can attest a deployment. */
export type SolanaProgramKind='marketplace'|'governance'
export type SolanaCluster='mainnet'|'devnet'|'localnet'
export const SOLANA_PROGRAMS={
 mainnet:{marketplace:null,governance:null},
 devnet:{marketplace:null,governance:null},
 localnet:{marketplace:'2xqre66jAqcSZFh1seMkgvQNVgG6uL1gwBtKVWuwePYC',governance:'3chFT3jsz3jhPXujW8MNjXPB8UUdHY6pSBkB3A37kLJd'},
} as const
export function getSolanaProgram(cluster:SolanaCluster,kind:SolanaProgramKind){return SOLANA_PROGRAMS[cluster]?.[kind]??null}
