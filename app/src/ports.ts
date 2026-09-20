/** Renderer-side capability shapes. Implementations are the narrow core bridge;
 * none expose raw filesystem, process, shell, network, or credential operations. */
export interface SourceTransactionPort {}
export interface ProjectFilesystemPort {
  listRecent(): Promise<unknown>;
  createProject(request: Readonly<Record<string, unknown>>): Promise<unknown>;
  openRecent(recentId: string): Promise<unknown>;
  closeProject(): Promise<unknown>;
}
export interface RenpyPort {
  discover(): Promise<unknown>;
  installSupported(): Promise<unknown>;
}
export interface GitPort {
  /** Git authority is limited to the create-project initializeGit choice. */
  readonly initializationOnly: true;
}
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
