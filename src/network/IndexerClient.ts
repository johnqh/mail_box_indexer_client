import type {
  ChainType,
  IndexerAddressValidationResponse,
  IndexerDelegatedFromResponse,
  IndexerDelegatedToResponse,
  IndexerEmailAccountsResponse,
  IndexerEntitlementResponse,
  IndexerLeaderboardResponse,
  IndexerNameResolutionResponse,
  IndexerNameServiceResponse,
  IndexerNonceResponse,
  IndexerPointsResponse,
  IndexerSignInMessageResponse,
  IndexerSiteStatsResponse,
  IndexerTemplateCreateRequest,
  IndexerTemplateData,
  IndexerTemplateDeleteResponse,
  IndexerTemplateListResponse,
  IndexerTemplateResponse,
  IndexerTemplateUpdateRequest,
  IndexerWebhookCreateRequest,
  IndexerWebhookData,
  IndexerWebhookDeleteResponse,
  IndexerWebhookListResponse,
  IndexerWebhookResponse,
  NetworkClient,
  Optional,
} from '@sudobility/types';
import type { IndexerUserAuth } from '../types';
import {
  buildUrl,
  createAuthHeaders,
  createHeaders,
  handleApiError,
} from '../utils/indexer-helpers';

/**
 * Referral code data
 */
export interface ReferralCodeData {
  walletAddress: string;
  chainType: ChainType;
  referralCode: string;
  totalRedemptions: number;
  lastUsedAt?: string;
  createdAt: string;
}

/**
 * Referral code response
 */
export interface ReferralCodeResponse {
  success: boolean;
  data: ReferralCodeData;
  error: Optional<string>;
  timestamp: string;
}

/**
 * Referred wallet data
 */
export interface ReferredWallet {
  walletAddress: string;
  chainType: ChainType;
  createdAt: string;
  ipAddress?: string;
}

/**
 * Referral statistics data
 */
export interface ReferralStatsData {
  walletAddress: string;
  chainType: ChainType;
  referralCode: string;
  totalReferred: number;
  referredWallets: ReferredWallet[];
}

/**
 * Referral statistics response
 */
export interface ReferralStatsResponse {
  success: boolean;
  data: ReferralStatsData;
  error: Optional<string>;
  timestamp: string;
}

/**
 * Points info site stats
 */
export interface PointsInfoSiteStats {
  totalPoints: string;
  totalUsers: number;
  lastUpdated: string;
}

/**
 * Points info top user
 */
export interface PointsInfoTopUser {
  walletAddress: string;
  pointsEarned: string;
  rank: number;
}

/**
 * Points info data
 */
export interface PointsInfoData {
  siteStats: PointsInfoSiteStats;
  topUsers: PointsInfoTopUser[];
}

/**
 * Points info response
 */
export interface PointsInfoResponse {
  success: boolean;
  data: PointsInfoData;
  error: Optional<string>;
  timestamp: string;
}

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
 * Indexer API client for public endpoints only
 * Only includes endpoints that client applications can actually use without server-side authentication
 * Uses NetworkClient for all HTTP operations
 */
export class IndexerClient {
  private readonly baseUrl: string;
  private readonly dev: boolean;
  private readonly networkClient: NetworkClient;

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
   * Validate username format (public endpoint)
   * GET /users/:username/validate
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
   * Get deterministic message for signing (public endpoint)
   * GET /wallets/:walletAddress/message?chainId=...&domain=...&url=...
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
   * Get general points system information (public endpoint)
   * GET /points
   */
  async getPointsInfo(): Promise<PointsInfoResponse> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.get<PointsInfoResponse>(
      buildUrl(this.baseUrl, '/points'),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get points info');
    }

    return response.data;
  }

  /**
   * Get points leaderboard (public endpoint)
   * GET /points/leaderboard/:count
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
   * Get site-wide statistics (public endpoint)
   * GET /points/site-stats
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
   * Get email addresses for a wallet (requires signature)
   * GET /wallets/:walletAddress/accounts
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
   * Get latest delegated address for a wallet (requires signature)
   * GET /delegations/from/:walletAddress
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
   * Get all addresses that have delegated TO a wallet (requires signature)
   * GET /delegations/to/:walletAddress
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
   * Create new nonce for username (requires signature)
   * POST /users/:username/nonce
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
   * Get nonce for username (requires signature)
   * GET /users/:username/nonce
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
   * Check entitlement for a wallet (requires signature)
   * GET /wallets/:walletAddress/entitlements/
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
   * Get user points balance (requires signature)
   * GET /wallets/:walletAddress/points
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
   * Get or create referral code for a wallet (requires signature)
   * POST /wallets/:walletAddress/referral
   */
  async getReferralCode(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<ReferralCodeResponse> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.post<ReferralCodeResponse>(
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
   * Get referral statistics by referral code (public endpoint)
   * POST /referrals/:referralCode/stats
   */
  async getReferralStats(referralCode: string): Promise<ReferralStatsResponse> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.post<ReferralStatsResponse>(
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
   * Get all ENS/SNS names for a wallet address (requires signature)
   * GET /wallets/:walletAddress/names
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
   * Resolve ENS/SNS name to wallet address (public endpoint)
   * GET /wallets/named/:name
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
   * Create a new mail template (requires signature)
   * POST /wallets/:walletAddress/templates
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
   * Get list of templates for a wallet (requires signature)
   * GET /wallets/:walletAddress/templates
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
   * Get a single template by ID (requires signature)
   * GET /wallets/:walletAddress/templates/:templateId
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
   * Update a template (requires signature)
   * PUT /wallets/:walletAddress/templates/:templateId
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
   * Delete a template (soft delete, requires signature)
   * DELETE /wallets/:walletAddress/templates/:templateId
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
   * Create a new webhook (requires signature)
   * POST /wallets/:walletAddress/webhooks
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
   * Get list of webhooks for a wallet (requires signature)
   * GET /wallets/:walletAddress/webhooks
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
   * Get a single webhook by ID (requires signature)
   * GET /wallets/:walletAddress/webhooks/:webhookId
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
   * Delete a webhook (soft delete, requires signature)
   * DELETE /wallets/:walletAddress/webhooks/:webhookId
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
   * Generate wallet authentication challenge (public endpoint)
   * POST /auth/challenge
   */
  async createAuthChallenge(
    walletIdentifier: string,
    clientId: string,
    redirectUri: string,
    deviceFingerprint?: string
  ): Promise<any> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.post<any>(
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
   * Verify wallet signature (public endpoint)
   * POST /auth/verify
   */
  async verifyAuthSignature(
    sessionId: string,
    signature: string,
    chainType: 'evm' | 'solana',
    currentWallet: string
  ): Promise<any> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.post<any>(
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
   * OAuth authorization endpoint (requires session)
   * GET /oauth/authorize
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
  ): Promise<any> {
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

    const response = await this.networkClient.get<any>(
      buildUrl(this.baseUrl, `/oauth/authorize?${queryParams.toString()}`),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'authorize');
    }

    return response.data;
  }

  /**
   * Exchange authorization code for tokens (public endpoint)
   * POST /oauth/token
   */
  async exchangeOAuthToken(
    grantType: 'authorization_code' | 'refresh_token',
    clientId: string,
    code?: string,
    redirectUri?: string,
    clientSecret?: string,
    codeVerifier?: string,
    refreshToken?: string
  ): Promise<any> {
    const headers = createHeaders(this.dev);
    const body: any = {
      grant_type: grantType,
      client_id: clientId,
    };

    if (code) body.code = code;
    if (redirectUri) body.redirect_uri = redirectUri;
    if (clientSecret) body.client_secret = clientSecret;
    if (codeVerifier) body.code_verifier = codeVerifier;
    if (refreshToken) body.refresh_token = refreshToken;

    const response = await this.networkClient.post<any>(
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
   * Get user info from access token (requires Bearer token)
   * GET /oauth/userinfo
   */
  async getOAuthUserInfo(accessToken: string): Promise<any> {
    const headers = createHeaders(this.dev, {
      Authorization: `Bearer ${accessToken}`,
    });

    const response = await this.networkClient.get<any>(
      buildUrl(this.baseUrl, '/oauth/userinfo'),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get user info');
    }

    return response.data;
  }

  /**
   * Revoke OAuth token (public endpoint)
   * POST /oauth/revoke
   */
  async revokeOAuthToken(token: string, tokenTypeHint?: string): Promise<void> {
    const headers = createHeaders(this.dev);
    const body: any = { token };
    if (tokenTypeHint) body.token_type_hint = tokenTypeHint;

    const response = await this.networkClient.post<any>(
      buildUrl(this.baseUrl, '/oauth/revoke'),
      body,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'revoke token');
    }
  }

  /**
   * Get OAuth client info (public endpoint)
   * GET /oauth/clients/:clientId
   */
  async getOAuthClientInfo(clientId: string): Promise<any> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.get<any>(
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
   * Initiate KYC verification (requires signature)
   * POST /kyc/initiate/:walletAddress
   */
  async initiateKYC(
    walletAddress: string,
    auth: IndexerUserAuth,
    verificationLevel: 'basic' | 'enhanced' | 'accredited'
  ): Promise<any> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.post<any>(
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
   * Get KYC verification status (requires signature)
   * GET /kyc/status/:walletAddress
   */
  async getKYCStatus(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<any> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<any>(
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
   * Check if wallet has authenticated (requires signature)
   * GET /wallets/:walletAddress/authenticated
   */
  async checkAuthenticated(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<any> {
    const headers = createAuthHeaders(auth, this.dev);

    const response = await this.networkClient.get<any>(
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
   * Get block synchronization status for all chains (public endpoint)
   * GET /blocks
   */
  async getBlockStatus(): Promise<any> {
    const headers = createHeaders(this.dev);

    const response = await this.networkClient.get<any>(
      buildUrl(this.baseUrl, '/blocks'),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get block status');
    }

    return response.data;
  }

  /**
   * Get wallets with permissions for a contract (public endpoint)
   * GET /permissions/contract/:contractAddress
   */
  async getContractPermissions(
    contractAddress: string,
    chainId: number,
    testNet: boolean = false
  ): Promise<any> {
    const headers = createHeaders(this.dev);
    const queryParams = new URLSearchParams({
      chainId: chainId.toString(),
      testNet: testNet.toString(),
    });

    const response = await this.networkClient.get<any>(
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
   * Get contracts a wallet has permissions for (public endpoint)
   * GET /permissions/wallet/:walletAddress
   */
  async getWalletPermissions(
    walletAddress: string,
    chainId: number,
    testNet: boolean = false
  ): Promise<any> {
    const headers = createHeaders(this.dev);
    const queryParams = new URLSearchParams({
      chainId: chainId.toString(),
      testNet: testNet.toString(),
    });

    const response = await this.networkClient.get<any>(
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
