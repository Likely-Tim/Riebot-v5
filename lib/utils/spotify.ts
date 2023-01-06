import logger from './logger';
import fetch from 'node-fetch';

import * as dbTokens from './databases/tokens';
import {
  SpotifyExternalObject,
  SpotifyRefreshTokenRequest,
  SpotifyRefreshTokenResponse,
  SpotifySearchResponse
} from '../types';

class Spotify {
  readonly spotifyId: string;
  readonly spotifySecret: string;

  constructor() {
    if (process.env.SPOTIFY_ID && process.env.SPOTIFY_SECRET) {
      this.spotifyId = process.env.SPOTIFY_ID;
      this.spotifySecret = process.env.SPOTIFY_SECRET;
    } else {
      throw new Error(`Missing SPOTIFY_ID or SPOTIFY_SECRET in .env!`);
    }
  }

  async checkAccessToken(suffix: string) {
    return await dbTokens.check(`spotifyAccess_${suffix}`);
  }

  async refreshToken(suffix: string): Promise<string> {
    let refreshToken = await dbTokens.get(`spotifyRefresh_${suffix}`);
    if (!refreshToken) {
      throw new Error(`[Spotify] Missing refresh token for ${suffix}`);
    }
    const url = 'https://accounts.spotify.com/api/token';
    const data: SpotifyRefreshTokenRequest = {
      client_id: this.spotifyId,
      client_secret: this.spotifySecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data as unknown as Record<string, string>)
    });
    if (!response.ok) {
      throw new Error(`[Spotify] Refreshing token failed with status: ${response.status}`);
    } else {
      logger.info(`[Spotify] Refreshed Token`);
      const body = (await response.json()) as SpotifyRefreshTokenResponse;
      if (suffix) {
        await dbTokens.set(`spotifyAccess_${suffix}`, body.access_token);
      } else {
        await dbTokens.set(`spotifyAccess`, body.access_token);
      }
      return body.access_token;
    }
  }

  async currentlyPlaying(userId: string, isUri: boolean): Promise<string | undefined> {
    logger.info(`[Spotify] Getting playing track | URI: ${isUri}`);
    let accessToken = await dbTokens.get(`spotifyAccess_${userId}`);
    if (!accessToken) {
      throw new Error(`[Spotify] Can't find access token for ${userId}`);
    }
    const url = 'https://api.spotify.com/v1/me/player/currently-playing';
    let response = await sendGetRequest(url, accessToken);
    if (!response.ok) {
      if (response.status === 401) {
        logger.info(`[Spotify] Expired Token`);
        accessToken = await this.refreshToken(userId);
        return await this.currentlyPlaying(userId, isUri);
      }
      throw new Error(`[Spotify] Failed to get currently playing with status: ${response.status}`);
    } else {
      logger.info(`[Spotify] Got Currently Playing`);
      const body = (await response.json()) as SpotifyApi.CurrentlyPlayingResponse;
      if (!body.is_playing) {
        return 'Nothing Playing';
      } else {
        switch (body.currently_playing_type) {
          case 'ad': {
            return 'Currently in Ad';
          }
          case 'track':
          case 'episode': {
            if (isUri) {
              return body.item?.uri;
            } else {
              return body.item?.external_urls.spotify;
            }
          }
          case 'unknown': {
            return 'Unknown Type';
          }
        }
      }
    }
  }

  async search(query: string): Promise<SpotifySearchResponse> {
    logger.info(`[Spotify] Searching for "${query}"`);
    const accessToken = await dbTokens.get('spotifyAccess_general');
    if (!accessToken) {
      throw new Error(`[Spotify] Can't find general access token`);
    }
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=5`;
    const response = await sendGetRequest(url, accessToken);
    switch (response.status) {
      case 200: {
        logger.info(`[Spotify] Got search results`);
        const body = (await response.json()) as SpotifyApi.SearchResponse;
        const types = ['tracks', 'albums', 'artists'];
        const items: SpotifySearchResponse = { tracks: [], albums: [], artists: [] };
        for (const type of types) {
          const spotifyInfo: SpotifyExternalObject[] = [];
          if (body[type as keyof typeof body]) {
            for (const item of body[type as keyof typeof body]!.items) {
              spotifyInfo.push({ spotifyUrl: item.external_urls.spotify, spotifyUri: item.uri });
            }
            items[type as keyof SpotifySearchResponse] = spotifyInfo;
          }
        }
        return items;
      }
      case 401: {
        logger.info(`[Spotify] Expired Token`);
        if (await this.refreshToken('general')) {
          return await this.search(query);
        }
      }
      default: {
        throw new Error(`[Spotify] Failed to get search results with status: ${response.status}`);
      }
    }
  }
}

async function sendGetRequest(url: string, accessToken: string) {
  let response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  return response;
}

export default new Spotify();
