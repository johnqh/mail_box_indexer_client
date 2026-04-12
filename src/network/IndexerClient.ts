import type { NetworkClient } from '@sudobility/types';
import type {
  IndexerAddressValidationResponse,
  IndexerAuthenticationStatusResponse,
  IndexerBlockStatusResponse,
  IndexerContractPermissionsResponse,
  IndexerDelegatedFromResponse,
  IndexerDelegatedToResponse,
  IndexerEmailAccountsResponse,
  IndexerEntitlementResponse,
  IndexerKYCInitiateResponse,
  IndexerKYCStatusResponse,
  IndexerLeaderboardResponse,
  IndexerNameResolutionResponse,
  IndexerNameServiceResponse,
  IndexerNonceResponse,
  IndexerOAuthAuthorizeResponse,
  IndexerOAuthChallengeResponse,
  IndexerOAuthClientInfoResponse,
  IndexerOAuthTokenResponse,
  IndexerOAuthUserInfoResponse,
  IndexerOAuthVerifyResponse,
  IndexerPointsInfoResponse,
  IndexerPointsResponse,
  IndexerReferralCodeResponse,
  IndexerReferralStatsResponse,
  IndexerSignInMessageResponse,
  IndexerSiteStatsResponse,
  IndexerTemplateCreateRequest,
  IndexerTemplateData,
  IndexerTemplateDeleteResponse,
  IndexerTemplateListResponse,
  IndexerTemplateResponse,
  IndexerTemplateUpdateRequest,
  IndexerWalletPermissionsResponse,
  IndexerWebhookCreateRequest,
  IndexerWebhookData,
  IndexerWebhookDeleteResponse,
  IndexerWebhookListResponse,
  IndexerWebhookResponse,
} from '@sudobility/mail_box_types';
import type { IndexerUserAuth } from '../types';
import {
  buildUrl,
  createAuthHeaders,
  createHeaders,
  handleApiError,
} from '../utils/indexer-helpers';

/**
 * Re-exported referral types from @sudobility/mail_box_types for backward compatibility
 */
export type { IndexerReferralCodeData as ReferralCodeData } from '@sudobility/mail_box_types';
export type { IndexerReferralCodeResponse as ReferralCodeResponse } from '@sudobility/mail_box_types';
export type { IndexerReferralConsumptionData as ReferredWallet } from '@sudobility/mail_box_types';
export type { IndexerReferralStatsData as ReferralStatsData } from '@sudobility/mail_box_types';
export type { IndexerReferralStatsResponse as ReferralStatsResponse } from '@sudobility/mail_box_types';

/**
 * Re-exported points info types from @sudobility/mail_box_types for backward compatibility
 */
export type { IndexerPointsInfoSiteStats as PointsInfoSiteStats } from '@sudobility/mail_box_types';
export type { IndexerPointsInfoTopUser as PointsInfoTopUser } from '@sudobility/mail_box_types';
export type { IndexerPointsInfoData as PointsInfoData } from '@sudobility/mail_box_types';
export type { IndexerPointsInfoResponse as PointsInfoResponse } from '@sudobility/mail_box_types';

/**
 * Mail template data - re-export from @sudobility/types
 */
export type MailTemplate = IndexerTemplateData;

/**
 * Mail template create request - re-export from @sudobility/types
 */
export type MailTemplateCreateRequest = IndexerTemplateCreateRequest;

/**
 * Mail template update request - re-export from @sudobility/types
 */
export type MailTemplateUpdateRequest = IndexerTemplateUpdateRequest;

/**
 * Mail template response (single template) - re-export from @sudobility/types
 */
export type MailTemplateResponse = IndexerTemplateResponse;

/**
 * Mail templates list response - re-export from @sudobility/types
 */
export type MailTemplatesListResponse = IndexerTemplateListResponse;

/**
 * Mail template delete response - re-export from @sudobility/types
 */
export type MailTemplateDeleteResponse = IndexerTemplateDeleteResponse;

/**
 * Mail templates list query parameters
 */
export interface MailTemplatesListParams {
  active?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Webhook data - re-export from @sudobility/types
 */
export type Webhook = IndexerWebhookData;

/**
 * Webhook create request - re-export from @sudobility/types
 */
export type WebhookCreateRequest = IndexerWebhookCreateRequest;

/**
 * Webhook response (single webhook) - re-export from @sudobility/types
 */
export type WebhookResponse = IndexerWebhookResponse;

/**
 * Webhooks list response - re-export from @sudobility/types
 */
export type WebhooksListResponse = IndexerWebhookListResponse;

/**
 * Webhook delete response - re-export from @sudobility/types
 */
export type WebhookDeleteResponse = IndexerWebhookDeleteResponse;

/**
 * Webhooks list query parameters
 */
export interface WebhooksListParams {
  active?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Indexer API client for the blockchain mail indexer REST API.
 *
 * Provides methods for all client-accessible endpoints -- both public and
 * signature-protected. Server-side/IP-restricted endpoints are excluded.
 *
 * All HTTP operations are delegated to an injected {@link NetworkClient} interface,
 * making this class cross-platform compatible (React Native, web, Node).
 *
 * @example
 * ```typescript
 * import { IndexerClient } from '@sudobility/indexer_client';
 *
 * const client = new IndexerClient('https://indexer.example.com', networkClient, false);
 *
 * // Public endpoint
 * const leaderboard = await client.getPointsLeaderboard(10);
 *
 * // Signature-protected endpoint
 * const accounts = await client.getWalletAccounts(walletAddress, auth);
 * ```
 */
export class IndexerClient {
  private readonly baseUrl: string;
  private readonly dev: boolean;
  private readonly networkClient: NetworkClient;

  /**
   * Creates a new IndexerClient instance.
   *
   * @param endpointUrl - Base URL of the indexer API (e.g., `https://indexer.example.com`)
   * @param networkClient - Platform-specific HTTP client implementing the `NetworkClient` interface
   * @param dev - When `true`, adds `x-dev: true` header to all requests to bypass server-side checks
   */
  constructor(
    endpointUrl: string,
    networkClient: NetworkClient,
    dev: boolean = false
  ) {
    this.baseUrl = endpointUrl;
    this.networkClient = networkClient;
    this.dev = dev;
  }

  // =============================================================================
  // PUBLIC API ENDPOINTS (No authentication required)
  // =============================================================================

  /**
   * Validate a username/address format against the indexer.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `GET /users/:username/validate`
   *
   * @param username - The username or wallet address to validate
   * @returns Validation response indicating if the address is valid and its type
   * @throws {IndexerValidationError} When the username format is invalid (400)
   * @throws {IndexerError} On other API errors
   */
  async validateUsername(
    username: string
  ): Promise<IndexerAddressValidationResponse> {
    const headers = createHeaders(this.dev);

    const response =
      await this.networkClient.get<IndexerAddressValidationResponse>(
        buildUrl(
          this.baseUrl,
          `/users/${encodeURIComponent(username)}/validate`
        ),
        { headers }
      );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'validate username');
    }

    return response.data;
  }

  /**
   * Get a deterministic SIWE (Sign-In with Ethereum) message for wallet authentication.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `GET /wallets/:walletAddress/message?chainId=...&domain=...&url=...`
   *
   * @param chainId - The blockchain chain ID (e.g., 1 for Ethereum mainnet)
   * @param walletAddress - The wallet address requesting the sign-in message
   * @param domain - The domain requesting authentication (e.g., `'mail.example.com'`)
   * @param url - The full URL of the application requesting authentication
   * @returns Sign-in message response containing the message string to be signed
   * @throws {IndexerError} On API errors
   */
  async getMessage(
    chainId: number,
    walletAddress: string,
    domain: string,
    url: string
  ): Promise<IndexerSignInMessageResponse> {
    const headers = createHeaders(this.dev);
    const queryParams = new URLSearchParams({
      chainId: chainId.toString(),
      domain,
      url,
    });

    const response = await this.networkClient.get<IndexerSignInMessageResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/message?${queryParams.toString()}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get message');
    }

    return response.data;
  }

  /**
   * Get general points system information including site-wide stats and top users.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `GET /points`
   *
   * @returns Points info response with site stats and top users list
   * @throws {IndexerError} On API errors
   */
  async getPointsInfo(): Promise<IndexerPointsInfoResponse> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.get<IndexerPointsInfoResponse>(
      buildUrl(this.baseUrl, '/points'),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get points info');
    }

    return response.data;
  }

  /**
   * Get the points leaderboard showing top-ranked wallets.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `GET /points/leaderboard/:count`
   *
   * @param count - Number of top users to include in the leaderboard (default: 10)
   * @returns Leaderboard response with ranked wallet entries
   * @throws {IndexerError} On API errors
   */
  async getPointsLeaderboard(
    count: number = 10
  ): Promise<IndexerLeaderboardResponse> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.get<IndexerLeaderboardResponse>(
      buildUrl(this.baseUrl, `/points/leaderboard/${count}`),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get points leaderboard');
    }

    return response.data;
  }

  /**
   * Get site-wide statistics including total users, total points, and last update timestamp.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `GET /points/site-stats`
   *
   * @returns Site stats response with aggregate counters
   * @throws {IndexerError} On API errors
   */
  async getPointsSiteStats(): Promise<IndexerSiteStatsResponse> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.get<IndexerSiteStatsResponse>(
      buildUrl(this.baseUrl, '/points/site-stats'),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get site stats');
    }

    return response.data;
  }

  // =============================================================================
  // SIGNATURE-PROTECTED ENDPOINTS (Require wallet signature)
  // =============================================================================

  /**
   * Get email accounts associated with a wallet address.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /wallets/:walletAddress/accounts`
   *
   * @param walletAddress - The wallet address to query
   * @param auth - Wallet-signed authentication credentials (`message`, `signature`, `signer`)
   * @param referralCode - Optional referral code to associate with account creation
   * @returns Email accounts response listing the wallet's associated email addresses
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getWalletAccounts(
    walletAddress: string,
    auth: IndexerUserAuth,
    referralCode?: string
  ): Promise<IndexerEmailAccountsResponse> {
    const additionalHeaders = referralCode
      ? { 'x-referral': referralCode }
      : undefined;
    const headers = createAuthHeaders(auth, this.dev, additionalHeaders);

    const response = await this.networkClient.get<IndexerEmailAccountsResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/accounts`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get wallet accounts');
    }

    return response.data;
  }

  /**
   * Get the address that this wallet has delegated to (latest active delegation).
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /delegations/from/:walletAddress`
   *
   * @param walletAddress - The delegator's wallet address
   * @param auth - Wallet-signed authentication credentials
   * @returns Delegation response showing the current delegate, if any
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getDelegatedTo(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerDelegatedToResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<IndexerDelegatedToResponse>(
      buildUrl(
        this.baseUrl,
        `/delegations/from/${encodeURIComponent(walletAddress)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get delegation');
    }

    return response.data;
  }

  /**
   * Get all wallet addresses that have delegated TO the given wallet.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /delegations/to/:walletAddress`
   *
   * @param walletAddress - The delegate's wallet address
   * @param auth - Wallet-signed authentication credentials
   * @returns Response listing all wallets that have delegated to this address
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getDelegatedFrom(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerDelegatedFromResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<IndexerDelegatedFromResponse>(
      buildUrl(
        this.baseUrl,
        `/delegations/to/${encodeURIComponent(walletAddress)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get delegators');
    }

    return response.data;
  }

  /**
   * Create a new authentication nonce for an email username.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `POST /users/:username/nonce`
   *
   * @param username - Email username (without the @domain part)
   * @param auth - Wallet-signed authentication credentials
   * @returns Nonce response containing the newly created nonce string
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async createNonce(
    username: string,
    auth: IndexerUserAuth
  ): Promise<IndexerNonceResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.post<IndexerNonceResponse>(
      buildUrl(this.baseUrl, `/users/${encodeURIComponent(username)}/nonce`),
      {},
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'create nonce');
    }

    return response.data;
  }

  /**
   * Get the current authentication nonce for an email username.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /users/:username/nonce`
   *
   * @param username - Email username (without the @domain part)
   * @param auth - Wallet-signed authentication credentials
   * @returns Nonce response containing the current nonce string
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getNonce(
    username: string,
    auth: IndexerUserAuth
  ): Promise<IndexerNonceResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<IndexerNonceResponse>(
      buildUrl(this.baseUrl, `/users/${encodeURIComponent(username)}/nonce`),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get nonce');
    }

    return response.data;
  }

  /**
   * Check whether a wallet has an active entitlement (e.g., premium name service).
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /wallets/:walletAddress/entitlements/`
   *
   * @param walletAddress - The wallet address to check
   * @param auth - Wallet-signed authentication credentials
   * @returns Entitlement response indicating the entitlement status and type
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getEntitlement(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerEntitlementResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<IndexerEntitlementResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/entitlements/`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get entitlement');
    }

    return response.data;
  }

  /**
   * Get the points balance and activity summary for a specific wallet.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /wallets/:walletAddress/points`
   *
   * @param walletAddress - The wallet address to query
   * @param auth - Wallet-signed authentication credentials
   * @returns Points response with earned points, activity count, and leaderboard rank
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getPointsBalance(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerPointsResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<IndexerPointsResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/points`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get points balance');
    }

    return response.data;
  }

  /**
   * Get or create a referral code for a wallet. If a code already exists, it is returned;
   * otherwise a new one is generated.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `POST /wallets/:walletAddress/referral`
   *
   * @param walletAddress - The wallet address to get/create a referral code for
   * @param auth - Wallet-signed authentication credentials
   * @returns Referral code response with the code string and usage statistics
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getReferralCode(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerReferralCodeResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.post<IndexerReferralCodeResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/referral`
      ),
      {},
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get referral code');
    }

    return response.data;
  }

  /**
   * Get usage statistics for a referral code.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `POST /referrals/:referralCode/stats`
   *
   * @param referralCode - The referral code to look up (e.g., `'ABC123DEF'`)
   * @returns Referral stats response with total referred count and wallet list
   * @throws {IndexerError} On API errors
   */
  async getReferralStats(
    referralCode: string
  ): Promise<IndexerReferralStatsResponse> {
    const headers = createHeaders(this.dev);

    const response =
      await this.networkClient.post<IndexerReferralStatsResponse>(
        buildUrl(
          this.baseUrl,
          `/referrals/${encodeURIComponent(referralCode)}/stats`
        ),
        {},
        { headers }
      );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get referral stats');
    }

    return response.data;
  }

  // =============================================================================
  // NAME SERVICE ENDPOINTS
  // =============================================================================

  /**
   * Get all ENS/SNS names registered to a wallet address.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /wallets/:walletAddress/names`
   *
   * @param walletAddress - The wallet address to query
   * @param auth - Wallet-signed authentication credentials
   * @returns Name service response with an array of associated name records
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getWalletNames(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerNameServiceResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<IndexerNameServiceResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/names`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get wallet names');
    }

    return response.data;
  }

  /**
   * Resolve an ENS or SNS name to its associated wallet address.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `GET /wallets/named/:name`
   *
   * @param name - The ENS or SNS name to resolve (e.g., `'vitalik.eth'`)
   * @returns Name resolution response with the resolved wallet address and chain type
   * @throws {IndexerError} On API errors (e.g., name not found)
   */
  async resolveNameToAddress(
    name: string
  ): Promise<IndexerNameResolutionResponse> {
    const headers = createHeaders(this.dev);

    const response =
      await this.networkClient.get<IndexerNameResolutionResponse>(
        buildUrl(this.baseUrl, `/wallets/named/${encodeURIComponent(name)}`),
        { headers }
      );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'resolve name');
    }

    return response.data;
  }

  // =============================================================================
  // MAIL TEMPLATE ENDPOINTS (Require wallet signature)
  // =============================================================================

  /**
   * Create a new mail template for a wallet.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `POST /wallets/:walletAddress/templates`
   *
   * @param walletAddress - The wallet address owning the template
   * @param auth - Wallet-signed authentication credentials
   * @param template - Template data including name, subject, and body
   * @returns Created template response with the full template object
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerValidationError} When template data is invalid (400/422)
   * @throws {IndexerError} On other API errors
   */
  async createMailTemplate(
    walletAddress: string,
    auth: IndexerUserAuth,
    template: MailTemplateCreateRequest
  ): Promise<MailTemplateResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.post<MailTemplateResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/templates`
      ),
      template,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'create template');
    }

    return response.data;
  }

  /**
   * Get a paginated list of mail templates for a wallet.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /wallets/:walletAddress/templates`
   *
   * @param walletAddress - The wallet address owning the templates
   * @param auth - Wallet-signed authentication credentials
   * @param params - Optional filter/pagination parameters (`active`, `limit`, `offset`)
   * @returns Templates list response with array of templates, total count, and `hasMore` flag
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getMailTemplates(
    walletAddress: string,
    auth: IndexerUserAuth,
    params?: MailTemplatesListParams
  ): Promise<MailTemplatesListResponse> {
    const headers = createAuthHeaders(auth, this.dev);
    const queryParams = new URLSearchParams();

    if (params?.active !== undefined) {
      queryParams.append('active', params.active.toString());
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset !== undefined) {
      queryParams.append('offset', params.offset.toString());
    }

    const queryString = queryParams.toString();
    const path = `/wallets/${encodeURIComponent(walletAddress)}/templates${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<MailTemplatesListResponse>(
      buildUrl(this.baseUrl, path),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get templates');
    }

    return response.data;
  }

  /**
   * Get a single mail template by its ID.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /wallets/:walletAddress/templates/:templateId`
   *
   * @param walletAddress - The wallet address owning the template
   * @param templateId - The UUID of the template to retrieve
   * @param auth - Wallet-signed authentication credentials
   * @returns Template response with the full template object
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getMailTemplate(
    walletAddress: string,
    templateId: string,
    auth: IndexerUserAuth
  ): Promise<MailTemplateResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<MailTemplateResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/templates/${encodeURIComponent(templateId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get template');
    }

    return response.data;
  }

  /**
   * Update an existing mail template.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `PUT /wallets/:walletAddress/templates/:templateId`
   *
   * @param walletAddress - The wallet address owning the template
   * @param templateId - The UUID of the template to update
   * @param auth - Wallet-signed authentication credentials
   * @param updates - Partial template data to update (name, subject, body, isActive)
   * @returns Updated template response with the full template object
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerValidationError} When update data is invalid (400/422)
   * @throws {IndexerError} On other API errors
   */
  async updateMailTemplate(
    walletAddress: string,
    templateId: string,
    auth: IndexerUserAuth,
    updates: MailTemplateUpdateRequest
  ): Promise<MailTemplateResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.put<MailTemplateResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/templates/${encodeURIComponent(templateId)}`
      ),
      updates,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'update template');
    }

    return response.data;
  }

  /**
   * Soft-delete a mail template. The template is marked inactive but not permanently removed.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `DELETE /wallets/:walletAddress/templates/:templateId`
   *
   * @param walletAddress - The wallet address owning the template
   * @param templateId - The UUID of the template to delete
   * @param auth - Wallet-signed authentication credentials
   * @returns Delete confirmation response
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async deleteMailTemplate(
    walletAddress: string,
    templateId: string,
    auth: IndexerUserAuth
  ): Promise<MailTemplateDeleteResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response =
      await this.networkClient.delete<MailTemplateDeleteResponse>(
        buildUrl(
          this.baseUrl,
          `/wallets/${encodeURIComponent(walletAddress)}/templates/${encodeURIComponent(templateId)}`
        ),
        { headers }
      );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'delete template');
    }

    return response.data;
  }

  // =============================================================================
  // WEBHOOK ENDPOINTS (Require wallet signature)
  // =============================================================================

  /**
   * Create a new webhook for a wallet.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `POST /wallets/:walletAddress/webhooks`
   *
   * @param walletAddress - The wallet address owning the webhook
   * @param auth - Wallet-signed authentication credentials
   * @param webhook - Webhook configuration including the callback URL
   * @returns Created webhook response with the full webhook object
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerValidationError} When webhook data is invalid (400/422)
   * @throws {IndexerError} On other API errors
   */
  async createWebhook(
    walletAddress: string,
    auth: IndexerUserAuth,
    webhook: WebhookCreateRequest
  ): Promise<WebhookResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.post<WebhookResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/webhooks`
      ),
      webhook,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'create webhook');
    }

    return response.data;
  }

  /**
   * Get a paginated list of webhooks for a wallet.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /wallets/:walletAddress/webhooks`
   *
   * @param walletAddress - The wallet address owning the webhooks
   * @param auth - Wallet-signed authentication credentials
   * @param params - Optional filter/pagination parameters (`active`, `limit`, `offset`)
   * @returns Webhooks list response with array of webhooks, total count, and `hasMore` flag
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getWebhooks(
    walletAddress: string,
    auth: IndexerUserAuth,
    params?: WebhooksListParams
  ): Promise<WebhooksListResponse> {
    const headers = createAuthHeaders(auth, this.dev);
    const queryParams = new URLSearchParams();

    if (params?.active !== undefined) {
      queryParams.append('active', params.active.toString());
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset !== undefined) {
      queryParams.append('offset', params.offset.toString());
    }

    const queryString = queryParams.toString();
    const path = `/wallets/${encodeURIComponent(walletAddress)}/webhooks${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<WebhooksListResponse>(
      buildUrl(this.baseUrl, path),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get webhooks');
    }

    return response.data;
  }

  /**
   * Get a single webhook by its ID.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /wallets/:walletAddress/webhooks/:webhookId`
   *
   * @param walletAddress - The wallet address owning the webhook
   * @param webhookId - The UUID of the webhook to retrieve
   * @param auth - Wallet-signed authentication credentials
   * @returns Webhook response with the full webhook object
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getWebhook(
    walletAddress: string,
    webhookId: string,
    auth: IndexerUserAuth
  ): Promise<WebhookResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<WebhookResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/webhooks/${encodeURIComponent(webhookId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get webhook');
    }

    return response.data;
  }

  /**
   * Soft-delete a webhook. The webhook is deactivated but not permanently removed.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `DELETE /wallets/:walletAddress/webhooks/:webhookId`
   *
   * @param walletAddress - The wallet address owning the webhook
   * @param webhookId - The UUID of the webhook to delete
   * @param auth - Wallet-signed authentication credentials
   * @returns Delete confirmation response
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async deleteWebhook(
    walletAddress: string,
    webhookId: string,
    auth: IndexerUserAuth
  ): Promise<WebhookDeleteResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.delete<WebhookDeleteResponse>(
      buildUrl(
        this.baseUrl,
        `/wallets/${encodeURIComponent(walletAddress)}/webhooks/${encodeURIComponent(webhookId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'delete webhook');
    }

    return response.data;
  }

  // =============================================================================
  // OAUTH ENDPOINTS
  // =============================================================================

  /**
   * Generate a wallet authentication challenge for OAuth SIWE flow.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `POST /auth/challenge`
   *
   * @param walletIdentifier - The wallet address or identifier requesting authentication
   * @param clientId - OAuth client ID
   * @param redirectUri - OAuth redirect URI after authentication
   * @param deviceFingerprint - Optional device fingerprint for session binding
   * @returns Challenge response with session ID, challenge message, and expiration
   * @throws {IndexerValidationError} When parameters are invalid (400)
   * @throws {IndexerError} On other API errors
   */
  async createAuthChallenge(
    walletIdentifier: string,
    clientId: string,
    redirectUri: string,
    deviceFingerprint?: string
  ): Promise<IndexerOAuthChallengeResponse> {
    const headers = createHeaders(this.dev);

    const response =
      await this.networkClient.post<IndexerOAuthChallengeResponse>(
        buildUrl(this.baseUrl, '/auth/challenge'),
        {
          wallet_identifier: walletIdentifier,
          client_id: clientId,
          redirect_uri: redirectUri,
          device_fingerprint: deviceFingerprint,
        },
        { headers }
      );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'create auth challenge');
    }

    return response.data;
  }

  /**
   * Verify a wallet's signature of the authentication challenge.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `POST /auth/verify`
   *
   * @param sessionId - The session ID from {@link createAuthChallenge}
   * @param signature - The wallet's signature of the challenge message
   * @param chainType - The blockchain type (`'evm'` or `'solana'`)
   * @param currentWallet - The wallet address that signed the challenge
   * @returns Verification response confirming the signature validity
   * @throws {IndexerAuthError} When the signature verification fails (401/403)
   * @throws {IndexerError} On other API errors
   */
  async verifyAuthSignature(
    sessionId: string,
    signature: string,
    chainType: 'evm' | 'solana',
    currentWallet: string
  ): Promise<IndexerOAuthVerifyResponse> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.post<IndexerOAuthVerifyResponse>(
      buildUrl(this.baseUrl, '/auth/verify'),
      {
        session_id: sessionId,
        signature,
        chain_type: chainType,
        current_wallet: currentWallet,
      },
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'verify signature');
    }

    return response.data;
  }

  /**
   * OAuth 2.0 authorization endpoint. Requires a valid session from the auth challenge flow.
   *
   * `GET /oauth/authorize`
   *
   * @param clientId - OAuth client ID
   * @param redirectUri - URI to redirect after authorization
   * @param responseType - OAuth response type (e.g., `'code'`)
   * @param scope - Space-separated OAuth scopes (e.g., `'openid email'`)
   * @param state - CSRF protection state parameter
   * @param sessionId - Session ID from {@link verifyAuthSignature}
   * @param codeChallenge - Optional PKCE code challenge
   * @param codeChallengeMethod - Optional PKCE method (e.g., `'S256'`)
   * @param nonce - Optional OpenID Connect nonce
   * @param privacy - Optional privacy setting
   * @returns Authorization response with redirect URL and authorization code
   * @throws {IndexerAuthError} When session is invalid (401/403)
   * @throws {IndexerError} On other API errors
   */
  async authorizeOAuth(
    clientId: string,
    redirectUri: string,
    responseType: string,
    scope: string,
    state: string,
    sessionId: string,
    codeChallenge?: string,
    codeChallengeMethod?: string,
    nonce?: string,
    privacy?: string
  ): Promise<IndexerOAuthAuthorizeResponse> {
    const headers = createHeaders(this.dev, { 'X-Session-Id': sessionId });
    const queryParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: responseType,
      scope,
      state,
    });

    if (codeChallenge) queryParams.append('code_challenge', codeChallenge);
    if (codeChallengeMethod)
      queryParams.append('code_challenge_method', codeChallengeMethod);
    if (nonce) queryParams.append('nonce', nonce);
    if (privacy) queryParams.append('privacy', privacy);

    const response =
      await this.networkClient.get<IndexerOAuthAuthorizeResponse>(
        buildUrl(this.baseUrl, `/oauth/authorize?${queryParams.toString()}`),
        { headers }
      );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'authorize');
    }

    return response.data;
  }

  /**
   * Exchange an authorization code or refresh token for access/refresh tokens.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `POST /oauth/token`
   *
   * @param grantType - OAuth grant type (`'authorization_code'` or `'refresh_token'`)
   * @param clientId - OAuth client ID
   * @param code - Authorization code (required for `authorization_code` grant)
   * @param redirectUri - Redirect URI (required for `authorization_code` grant)
   * @param clientSecret - Optional client secret for confidential clients
   * @param codeVerifier - Optional PKCE code verifier
   * @param refreshToken - Refresh token (required for `refresh_token` grant)
   * @returns Token response with `access_token`, `token_type`, `expires_in`, and optional `refresh_token`
   * @throws {IndexerAuthError} When the code or refresh token is invalid (401/403)
   * @throws {IndexerError} On other API errors
   */
  async exchangeOAuthToken(
    grantType: 'authorization_code' | 'refresh_token',
    clientId: string,
    code?: string,
    redirectUri?: string,
    clientSecret?: string,
    codeVerifier?: string,
    refreshToken?: string
  ): Promise<IndexerOAuthTokenResponse> {
    const headers = createHeaders(this.dev);
    const body: Record<string, string> = {
      grant_type: grantType,
      client_id: clientId,
    };

    if (code) body.code = code;
    if (redirectUri) body.redirect_uri = redirectUri;
    if (clientSecret) body.client_secret = clientSecret;
    if (codeVerifier) body.code_verifier = codeVerifier;
    if (refreshToken) body.refresh_token = refreshToken;

    const response = await this.networkClient.post<IndexerOAuthTokenResponse>(
      buildUrl(this.baseUrl, '/oauth/token'),
      body,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'exchange token');
    }

    return response.data;
  }

  /**
   * Get user info using a Bearer access token (OpenID Connect UserInfo endpoint).
   *
   * `GET /oauth/userinfo`
   *
   * @param accessToken - A valid OAuth access token
   * @returns User info object with `sub`, `email`, `wallet_address`, etc.
   * @throws {IndexerAuthError} When the access token is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getOAuthUserInfo(
    accessToken: string
  ): Promise<IndexerOAuthUserInfoResponse> {
    const headers = createHeaders(this.dev, {
      Authorization: `Bearer ${accessToken}`,
    });

    const response = await this.networkClient.get<IndexerOAuthUserInfoResponse>(
      buildUrl(this.baseUrl, '/oauth/userinfo'),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get user info');
    }

    return response.data;
  }

  /**
   * Revoke an OAuth token (access or refresh).
   *
   * **Public endpoint** -- no authentication required.
   *
   * `POST /oauth/revoke`
   *
   * @param token - The token to revoke
   * @param tokenTypeHint - Optional hint: `'access_token'` or `'refresh_token'`
   * @throws {IndexerError} On API errors
   */
  async revokeOAuthToken(token: string, tokenTypeHint?: string): Promise<void> {
    const headers = createHeaders(this.dev);
    const body: Record<string, string> = { token };
    if (tokenTypeHint) body.token_type_hint = tokenTypeHint;

    const response = await this.networkClient.post<void>(
      buildUrl(this.baseUrl, '/oauth/revoke'),
      body,
      { headers }
    );

    if (!response.ok) {
      throw handleApiError(response, 'revoke token');
    }
  }

  /**
   * Get public information about an OAuth client.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `GET /oauth/clients/:clientId`
   *
   * @param clientId - The OAuth client ID to look up
   * @returns Client info with `client_id`, `client_name`, `client_uri`, and `scope`
   * @throws {IndexerError} On API errors
   */
  async getOAuthClientInfo(
    clientId: string
  ): Promise<IndexerOAuthClientInfoResponse> {
    const headers = createHeaders(this.dev);

    const response =
      await this.networkClient.get<IndexerOAuthClientInfoResponse>(
        buildUrl(this.baseUrl, `/oauth/clients/${clientId}`),
        { headers }
      );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get client info');
    }

    return response.data;
  }

  // =============================================================================
  // KYC ENDPOINTS
  // =============================================================================

  /**
   * Initiate a KYC verification process for a wallet.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `POST /kyc/initiate/:walletAddress`
   *
   * @param walletAddress - The wallet address to verify
   * @param auth - Wallet-signed authentication credentials
   * @param verificationLevel - The level of verification requested (`'basic'`, `'enhanced'`, or `'accredited'`)
   * @returns KYC initiation response with application ID and access token
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async initiateKYC(
    walletAddress: string,
    auth: IndexerUserAuth,
    verificationLevel: 'basic' | 'enhanced' | 'accredited'
  ): Promise<IndexerKYCInitiateResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.post<IndexerKYCInitiateResponse>(
      buildUrl(
        this.baseUrl,
        `/kyc/initiate/${encodeURIComponent(walletAddress)}`
      ),
      { verificationLevel },
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'initiate KYC');
    }

    return response.data;
  }

  /**
   * Get the current KYC verification status for a wallet.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /kyc/status/:walletAddress`
   *
   * @param walletAddress - The wallet address to check
   * @param auth - Wallet-signed authentication credentials
   * @returns KYC status response with verification level, status, and retry information
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async getKYCStatus(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerKYCStatusResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<IndexerKYCStatusResponse>(
      buildUrl(
        this.baseUrl,
        `/kyc/status/${encodeURIComponent(walletAddress)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get KYC status');
    }

    return response.data;
  }

  // =============================================================================
  // ADDITIONAL MAIL ENDPOINTS
  // =============================================================================

  /**
   * Check whether a wallet has completed authentication.
   *
   * **Signature-protected** -- requires a valid `IndexerUserAuth`.
   *
   * `GET /wallets/:walletAddress/authenticated`
   *
   * @param walletAddress - The wallet address to check
   * @param auth - Wallet-signed authentication credentials
   * @returns Authentication status response
   * @throws {IndexerAuthError} When the signature is invalid or expired (401/403)
   * @throws {IndexerError} On other API errors
   */
  async checkAuthenticated(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerAuthenticationStatusResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response =
      await this.networkClient.get<IndexerAuthenticationStatusResponse>(
        buildUrl(
          this.baseUrl,
          `/wallets/${encodeURIComponent(walletAddress)}/authenticated`
        ),
        { headers }
      );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'check authentication status');
    }

    return response.data;
  }

  /**
   * Get block synchronization status for all indexed chains.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `GET /blocks`
   *
   * @returns Block status response with per-chain sync info and overall health
   * @throws {IndexerError} On API errors
   */
  async getBlockStatus(): Promise<IndexerBlockStatusResponse> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.get<IndexerBlockStatusResponse>(
      buildUrl(this.baseUrl, '/blocks'),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get block status');
    }

    return response.data;
  }

  /**
   * Get all wallets that have permissions for a given contract address.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `GET /permissions/contract/:contractAddress`
   *
   * @param contractAddress - The contract address to query
   * @param chainId - The blockchain chain ID
   * @param testNet - Whether to query testnet permissions (default: `false`)
   * @returns Contract permissions response listing wallet addresses with permissions
   * @throws {IndexerError} On API errors
   */
  async getContractPermissions(
    contractAddress: string,
    chainId: number,
    testNet: boolean = false
  ): Promise<IndexerContractPermissionsResponse> {
    const headers = createHeaders(this.dev);
    const queryParams = new URLSearchParams({
      chainId: chainId.toString(),
      testNet: testNet.toString(),
    });

    const response =
      await this.networkClient.get<IndexerContractPermissionsResponse>(
        buildUrl(
          this.baseUrl,
          `/permissions/contract/${encodeURIComponent(contractAddress)}?${queryParams.toString()}`
        ),
        { headers }
      );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get contract permissions');
    }

    return response.data;
  }

  /**
   * Get all contracts that a wallet has permissions for.
   *
   * **Public endpoint** -- no authentication required.
   *
   * `GET /permissions/wallet/:walletAddress`
   *
   * @param walletAddress - The wallet address to query
   * @param chainId - The blockchain chain ID
   * @param testNet - Whether to query testnet permissions (default: `false`)
   * @returns Wallet permissions response listing contract addresses
   * @throws {IndexerError} On API errors
   */
  async getWalletPermissions(
    walletAddress: string,
    chainId: number,
    testNet: boolean = false
  ): Promise<IndexerWalletPermissionsResponse> {
    const headers = createHeaders(this.dev);
    const queryParams = new URLSearchParams({
      chainId: chainId.toString(),
      testNet: testNet.toString(),
    });

    const response =
      await this.networkClient.get<IndexerWalletPermissionsResponse>(
        buildUrl(
          this.baseUrl,
          `/permissions/wallet/${encodeURIComponent(walletAddress)}?${queryParams.toString()}`
        ),
        { headers }
      );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get wallet permissions');
    }

    return response.data;
  }

  // Note: The following endpoints are NOT included as they are server-side or webhook receivers:
  // IP-restricted endpoints (only accessible from WildDuck server):
  // - POST /wallets/:walletAddress/points/add (IPHelper validation)
  // - POST /authenticate (IPHelper validation)
  // - POST /addresses/:address/verify (IPHelper validation)
  //
  // Webhook receiver endpoints (called by external services):
  // - POST /kyc/webhook (Sumsub webhook receiver)
  // - POST /solana/webhook (Helius webhook receiver)
  // - POST /solana/setup-webhooks (server-side webhook configuration)
  // - GET /solana/status (server-side status)
  // - POST /solana/test-transaction (server-side testing)
  //
  // OAuth discovery endpoint (used by OAuth libraries, not application code):
  // - GET /.well-known/openid-configuration (OAuth/OIDC discovery)
}
