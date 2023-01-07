export interface SpotifyOAuthAccessTokenURLEncodedData {
  code: string;
  redirect_uri: string;
  grant_type: 'authorization_code';
}

export interface SpotifyOAuthAccessTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

export interface SpotifyRefreshTokenRequest {
  client_id: string;
  client_secret: string;
  grant_type: 'refresh_token';
  refresh_token: string;
}

export interface SpotifyRefreshTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  scope: string;
  expires_in: number;
}

export interface AnilistOAuthAccessTokenURLEncodedData {
  grant_type: 'authorization_code';
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  code: string;
}

export interface AnilistOAuthAccessTokenResponse {
  access_token: string;
}
