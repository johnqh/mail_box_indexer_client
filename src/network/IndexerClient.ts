import axios from 'axios';
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
  Optional,
} from '@sudobility/types';
import type { IndexerUserAuth } from '../types';

/**
 * Network request options
 */
export interface NetworkRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

/**
 * Network response interface
 */
export interface NetworkResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
  success: boolean;
  timestamp: string;
}

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
 * Mail template data
 */
export interface MailTemplate {
  id: string;
  userId: string;
  templateName: string;
  bodyContent: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mail template create request
 */
export interface MailTemplateCreateRequest {
  templateName: string;
  bodyContent: string;
}

/**
 * Mail template update request
 */
export interface MailTemplateUpdateRequest {
  templateName?: string;
  bodyContent?: string;
}

/**
 * Mail template response (single template)
 */
export interface MailTemplateResponse {
  success: boolean;
  template: MailTemplate;
  verified: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Mail templates list response
 */
export interface MailTemplatesListResponse {
  success: boolean;
  templates: MailTemplate[];
  total: number;
  hasMore: boolean;
  verified: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Mail template delete response
 */
export interface MailTemplateDeleteResponse {
  success: boolean;
  message: string;
  verified: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Mail templates list query parameters
 */
export interface MailTemplatesListParams {
  active?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Indexer API client for public endpoints only
 * Only includes endpoints that client applications can actually use without server-side authentication
 */
export class IndexerClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly dev: boolean;

  constructor(
    endpointUrl: string,
    dev: boolean = false,
    timeout: number = 30000
  ) {
    this.baseUrl = endpointUrl;
    this.dev = dev;
    this.timeout = timeout;
  }

  async get<T>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body,
    });
  }

  async put<T>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  async delete<T>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  async request<T>(
    url: string,
    options?: NetworkRequestOptions
  ): Promise<NetworkResponse<T>> {
    const fullUrl = `${this.baseUrl}${url}`;

    const axiosConfig: any = {
      method: options?.method || 'GET',
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(this.dev && { 'x-dev': 'true' }),
        ...options?.headers,
      },
      timeout: this.timeout,
      signal: options?.signal,
      withCredentials: false, // Ensure CORS doesn't require credentials
    };

    console.log('[IndexerClient] Making request:', {
      url: fullUrl,
      method: axiosConfig.method,
      headers: axiosConfig.headers,
    });

    if (options?.body) {
      if (typeof options.body === 'string') {
        try {
          axiosConfig.data = JSON.parse(options.body);
        } catch {
          axiosConfig.data = options.body;
        }
      } else {
        axiosConfig.data = options.body;
      }
    }

    try {
      const response = await axios(axiosConfig);

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        data: response.data as T,
        headers: response.headers as Record<string, string>,
        success: response.status >= 200 && response.status < 300,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      // Check if it's an axios error by checking for response property
      if (error.response || error.request) {
        // If we got a response, return it even if it's an error status
        if (error.response) {
          return {
            ok: false,
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data as T,
            headers: error.response.headers as Record<string, string>,
            success: false,
            timestamp: new Date().toISOString(),
          };
        }

        // Network or other error without a response
        console.error('[IndexerClient] Network error details:', {
          message: error.message,
          code: error.code,
          url: fullUrl,
          method: axiosConfig.method,
        });
        throw new Error(`Indexer API request failed: ${error.message}`);
      }

      throw new Error(
        `Indexer API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
    const response = await this.get<IndexerAddressValidationResponse>(
      `/users/${encodeURIComponent(username)}/validate`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to validate username: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerAddressValidationResponse;
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
    const queryParams = new URLSearchParams({
      chainId: chainId.toString(),
      domain,
      url,
    });

    const response = await this.get<IndexerSignInMessageResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/message?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get message: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerSignInMessageResponse;
  }

  /**
   * Get points leaderboard (public endpoint)
   * GET /points/leaderboard/:count
   */
  async getPointsLeaderboard(
    count: number = 10
  ): Promise<IndexerLeaderboardResponse> {
    const response = await this.get<IndexerLeaderboardResponse>(
      `/points/leaderboard/${count}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get points leaderboard: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerLeaderboardResponse;
  }

  /**
   * Get site-wide statistics (public endpoint)
   * GET /points/site-stats
   */
  async getPointsSiteStats(): Promise<IndexerSiteStatsResponse> {
    const response =
      await this.get<IndexerSiteStatsResponse>('/points/site-stats');

    if (!response.ok) {
      throw new Error(
        `Failed to get site stats: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerSiteStatsResponse;
  }

  // =============================================================================
  // SIGNATURE-PROTECTED ENDPOINTS (Require wallet signature)
  // =============================================================================

  /**
   * Helper method to create authentication headers for signature-protected endpoints
   * Encodes the message using encodeURIComponent for HTTP header transmission
   * The indexer will decode it using decodeURIComponent
   */
  private createAuthHeaders(auth: IndexerUserAuth): Record<string, string> {
    return {
      'x-signature': auth.signature.replace(/[\r\n]/g, ''), // Remove any newlines from signature
      'x-message': encodeURIComponent(auth.message), // Encode message for HTTP header
      'x-signer': auth.signer, // Wallet address that signed the message
    };
  }

  /**
   * Get email addresses for a wallet (requires signature)
   * GET /wallets/:walletAddress/accounts
   */
  async getWalletAccounts(
    walletAddress: string,
    auth: IndexerUserAuth,
    referralCode?: string
  ): Promise<IndexerEmailAccountsResponse> {
    console.log('[IndexerClient] getWalletAccounts called with:', {
      walletAddress,
      auth,
      referralCode,
      baseUrl: this.baseUrl,
      endpoint: `/wallets/${encodeURIComponent(walletAddress)}/accounts`,
    });

    const headers = this.createAuthHeaders(auth);

    // Add referral code header if provided
    if (referralCode) {
      headers['x-referral'] = referralCode;
    }

    const response = await this.get<IndexerEmailAccountsResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/accounts`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get wallet accounts: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerEmailAccountsResponse;
  }

  /**
   * Get latest delegated address for a wallet (requires signature)
   * GET /delegations/from/:walletAddress
   */
  async getDelegatedTo(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerDelegatedToResponse> {
    const response = await this.get<IndexerDelegatedToResponse>(
      `/delegations/from/${encodeURIComponent(walletAddress)}`,
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get delegation: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerDelegatedToResponse;
  }

  /**
   * Get all addresses that have delegated TO a wallet (requires signature)
   * GET /delegations/to/:walletAddress
   */
  async getDelegatedFrom(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerDelegatedFromResponse> {
    const response = await this.get<IndexerDelegatedFromResponse>(
      `/delegations/to/${encodeURIComponent(walletAddress)}`,
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get delegators: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerDelegatedFromResponse;
  }

  /**
   * Create new nonce for username (requires signature)
   * POST /users/:username/nonce
   */
  async createNonce(
    username: string,
    auth: IndexerUserAuth
  ): Promise<IndexerNonceResponse> {
    const response = await this.post<IndexerNonceResponse>(
      `/users/${encodeURIComponent(username)}/nonce`,
      {},
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create nonce: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerNonceResponse;
  }

  /**
   * Get nonce for username (requires signature)
   * GET /users/:username/nonce
   */
  async getNonce(
    username: string,
    auth: IndexerUserAuth
  ): Promise<IndexerNonceResponse> {
    const response = await this.get<IndexerNonceResponse>(
      `/users/${encodeURIComponent(username)}/nonce`,
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get nonce: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerNonceResponse;
  }

  /**
   * Check entitlement for a wallet (requires signature)
   * GET /wallets/:walletAddress/entitlements/
   */
  async getEntitlement(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerEntitlementResponse> {
    const response = await this.get<IndexerEntitlementResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/entitlements/`,
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get entitlement: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerEntitlementResponse;
  }

  /**
   * Get user points balance (requires signature)
   * GET /wallets/:walletAddress/points
   */
  async getPointsBalance(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<IndexerPointsResponse> {
    const response = await this.get<IndexerPointsResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/points`,
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get points balance: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerPointsResponse;
  }

  /**
   * Get or create referral code for a wallet (requires signature)
   * POST /wallets/:walletAddress/referral
   */
  async getReferralCode(
    walletAddress: string,
    auth: IndexerUserAuth
  ): Promise<ReferralCodeResponse> {
    console.log('[IndexerClient] getReferralCode called with:', {
      walletAddress,
      auth,
      endpoint: `/wallets/${encodeURIComponent(walletAddress)}/referral`,
    });

    const response = await this.post<ReferralCodeResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/referral`,
      {},
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    console.log('[IndexerClient] getReferralCode response:', {
      ok: response.ok,
      status: response.status,
      data: response.data,
    });

    if (!response.ok) {
      const errorMessage =
        (response.data as any)?.error ||
        (response.data as any)?.message ||
        JSON.stringify(response.data) ||
        `HTTP ${response.status}`;
      console.error('[IndexerClient] getReferralCode failed:', errorMessage);
      throw new Error(`Failed to get referral code: ${errorMessage}`);
    }

    return response.data as ReferralCodeResponse;
  }

  /**
   * Get referral statistics by referral code (public endpoint)
   * POST /referrals/:referralCode/stats
   */
  async getReferralStats(referralCode: string): Promise<ReferralStatsResponse> {
    const response = await this.post<ReferralStatsResponse>(
      `/referrals/${encodeURIComponent(referralCode)}/stats`,
      {}
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get referral stats: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as ReferralStatsResponse;
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
    const response = await this.get<IndexerNameServiceResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/names`,
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get wallet names: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerNameServiceResponse;
  }

  /**
   * Resolve ENS/SNS name to wallet address (public endpoint)
   * GET /wallets/named/:name
   */
  async resolveNameToAddress(
    name: string
  ): Promise<IndexerNameResolutionResponse> {
    const response = await this.get<IndexerNameResolutionResponse>(
      `/wallets/named/${encodeURIComponent(name)}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to resolve name: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as IndexerNameResolutionResponse;
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
    const response = await this.post<MailTemplateResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/templates`,
      template,
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create template: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as MailTemplateResponse;
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
    const url = `/wallets/${encodeURIComponent(walletAddress)}/templates${queryString ? `?${queryString}` : ''}`;

    const response = await this.get<MailTemplatesListResponse>(url, {
      headers: this.createAuthHeaders(auth),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get templates: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as MailTemplatesListResponse;
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
    const response = await this.get<MailTemplateResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/templates/${encodeURIComponent(templateId)}`,
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get template: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as MailTemplateResponse;
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
    const response = await this.put<MailTemplateResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/templates/${encodeURIComponent(templateId)}`,
      updates,
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update template: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as MailTemplateResponse;
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
    const response = await this.delete<MailTemplateDeleteResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/templates/${encodeURIComponent(templateId)}`,
      {
        headers: this.createAuthHeaders(auth),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to delete template: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as MailTemplateDeleteResponse;
  }

  // Note: The following endpoints are IP-restricted and only accessible from WildDuck server:
  // - POST /wallets/:walletAddress/points/add (IPHelper validation)
  // - POST /authenticate (IPHelper validation)
  // - POST /addresses/:address/verify (IPHelper validation)
}
