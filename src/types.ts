/**
 * Local type definitions for the indexer client
 */

/**
 * Authentication credentials using message and signature
 * Used for signature-protected endpoints
 */
export interface SignatureAuth {
  message: string;
  signature: string;
}
