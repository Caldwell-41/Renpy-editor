/**
 * Authority-free markers for future core adapters. Phase 1A intentionally gives
 * these ports no operations, implementations, handles, paths, or credentials.
 */
export interface SourceTransactionPort {}
export interface ProjectFilesystemPort {}
export interface RenpyPort {}
export interface GitPort {}
export interface CredentialPort {}
export interface NetworkProviderPort {}

export interface FuturePorts {
  readonly sourceTransactions?: SourceTransactionPort;
  readonly projectFilesystem?: ProjectFilesystemPort;
  readonly renpy?: RenpyPort;
  readonly git?: GitPort;
  readonly credentials?: CredentialPort;
  readonly networkProviders?: NetworkProviderPort;
}
