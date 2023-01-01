import fetch from 'node-fetch';
import { Router } from 'express';
import Anilist from '../utils/anilist';
import { randomStringGenerator } from '../utils/random';
import * as discord from '../utils/discord';

import * as dbWeb from '../utils/databases/web';
import * as dbTokens from '../utils/databases/tokens';
import logger from '../utils/logger';
import { RESTPostOAuth2AccessTokenResult, RESTPostOAuth2AccessTokenURLEncodedData } from 'discord.js';
import {
  AnilistOAuthAccessTokenResponse,
  AnilistOAuthAccessTokenURLEncodedData,
  SpotifyOAuthAccessTokenResponse,
  SpotifyOAuthAccessTokenURLEncodedData
} from '../types';

const router = Router();

const SPOTIFY_ID = process.env.SPOTIFY_ID!;
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET!;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const ANILIST_ID = process.env.ANILIST_ID!;
const ANILIST_SECRET = process.env.ANILIST_SECRET!;

const BASE_URL = process.env.BASE_URL;
const BASE_URL_ENCODED = process.env.BASE_URL_ENCODED;

router.get('/discord', async (request, response) => {
  if (!request.query.task) {
    response.redirect('/?discordSuccess=false');
    return;
  }
  const id = randomStringGenerator(64);
  const state = randomStringGenerator(64);
  response.cookie('task', request.query.task, { sameSite: 'lax', maxAge: 600000 });
  response.cookie('discordStateId', id, { sameSite: 'lax', maxAge: 600000 });
  await dbTokens.set(`${id}DiscordState`, state);
  response.redirect(
    `https://discord.com/oauth2/authorize?response_type=code&client_id=${DISCORD_CLIENT_ID}&scope=identify&state=${state}&redirect_uri=${BASE_URL_ENCODED}auth%2Fdiscord%2Fcallback&prompt=consent`
  );
});

router.get('/spotify', async (request, response) => {
  if (request.query.discordId) {
    response.cookie('discordId', request.query.discordId, { sameSite: 'lax', maxAge: 600000 });
  }
  response.redirect(
    `https://accounts.spotify.com/en/authorize?client_id=${SPOTIFY_ID}&response_type=code&redirect_uri=${BASE_URL_ENCODED}auth%2Fspotify%2Fcallback&scope=user-top-read%20user-read-currently-playing%20user-read-playback-state&show_dialog=true`
  );
});

router.get('/anilist', async (request, response) => {
  response.redirect(
    `https://anilist.co/api/v2/oauth/authorize?client_id=${ANILIST_ID}&redirect_uri=${BASE_URL}auth/anilist/callback&response_type=code`
  );
});

router.get('/discord/callback', async (request, response) => {
  const discordStateId = request.cookies.discordStateId;
  const redirectUrl = request.cookies.redirectUrl;
  const task = request.cookies.task;
  response.clearCookie('discordStateId');
  response.clearCookie('redirectUrl');
  response.clearCookie('task');

  if (!discordStateId) {
    response.redirect('/?discordSuccess=false');
    return;
  }
  const state = await dbTokens.get(`${request.cookies.discordStateId}DiscordState`);
  response.clearCookie('discordStateId');
  if (state != request.query.state) {
    response.redirect('/?discordSuccess=false');
    return;
  }
  if (typeof request.query.code !== 'string') {
    response.redirect('/?discordSuccess=false');
    return;
  }
  const [accessToken, refreshToken] = await discordAccepted(request.query.code);
  if (!accessToken || !refreshToken) {
    response.redirect('/?discordSuccess=false');
    return;
  }

  if (task === 'spotify') {
    const user = await discord.getUser(accessToken);
    if (!user) {
      return response.redirect('/?discordSuccess=false');
    }
    const userId = user.id;
    response.cookie('discordId', userId, { sameSite: 'lax', maxAge: 600000 });
    response.redirect(`/auth/spotify`);
    return;
  }
  if (redirectUrl) {
    response.redirect(redirectUrl);
  } else {
    response.redirect('/?discordSuccess=true');
  }
});

router.get('/spotify/callback', async (request, response) => {
  if (typeof request.query.code !== 'string') {
    response.redirect('/?spotifySuccess=false');
    return;
  }
  const [accessToken, refreshToken] = await spotifyAccepted(request.query.code);
  if (!accessToken || !refreshToken) {
    response.redirect('/?spotifySuccess=false');
    return;
  }
  const discordId = request.cookies.discordId;
  const redirectUrl = request.cookies.redirectUrl;
  response.clearCookie('discordId');
  response.clearCookie('redirectUrl');

  if (discordId) {
    await dbTokens.set(`spotifyAccess_${discordId}`, accessToken);
    await dbTokens.set(`spotifyRefresh_${discordId}`, refreshToken);
  } else {
    await dbTokens.set('spotifyAccess', accessToken);
    await dbTokens.set('spotifyRefresh', refreshToken);
  }
  if (redirectUrl) {
    response.redirect(redirectUrl);
  } else {
    response.redirect('/?spotifySuccess=true');
  }
});

router.get('/anilist/callback', async (request, response) => {
  const task = request.cookies.task;
  const redirectUrl = request.cookies.redirectUrl;
  response.clearCookie('task');
  response.clearCookie('redirectUrl');
  if (typeof request.query.code !== 'string') {
    response.redirect('/?anilistSuccess=false');
    return;
  }
  const accessToken = await anilistAccepted(request.query.code);
  if (!accessToken) {
    response.redirect('/?anilistSuccess=false');
    return;
  }
  if (task == 'addAnimeShowUser') {
    const user = await Anilist.getAuthenticatedUser(accessToken);
    if (!user || !user.id || !user.name) {
      response.redirect('/?anilistSuccess=false');
      return;
    } else {
      await dbWeb.setAnimeShowUser(String(user.id), user.name);
    }
  }
  if (redirectUrl) {
    response.redirect(redirectUrl);
  } else {
    response.redirect('/');
  }
});

async function discordAccepted(code: string) {
  const url = 'https://discord.com/api/oauth2/token';
  const data: RESTPostOAuth2AccessTokenURLEncodedData = {
    grant_type: 'authorization_code',
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    redirect_uri: `${BASE_URL}auth/discord/callback`,
    code: code
  };
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(data as unknown as Record<string, string>)
  });
  if (response.ok) {
    const oauth = (await response.json()) as RESTPostOAuth2AccessTokenResult;
    return [oauth.access_token, oauth.refresh_token];
  } else {
    logger.error(`Discord callback failed with status: ${response.status}`);
    return [null, null];
  }
}

async function spotifyAccepted(code: string) {
  const url = 'https://accounts.spotify.com/api/token';
  const authorization = Buffer.from(SPOTIFY_ID + ':' + SPOTIFY_SECRET).toString('base64');
  const data: SpotifyOAuthAccessTokenURLEncodedData = {
    code: code,
    redirect_uri: `${BASE_URL}auth/spotify/callback`,
    grant_type: 'authorization_code'
  };
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + authorization
    },
    body: new URLSearchParams(data as unknown as Record<string, string>)
  });
  if (response.ok) {
    const oauth = (await response.json()) as SpotifyOAuthAccessTokenResponse;
    return [oauth.access_token, oauth.refresh_token];
  } else {
    logger.error(`Spotify callback failed with status: ${response.status}`);
    return [null, null];
  }
}

async function anilistAccepted(code: string) {
  const url = 'https://anilist.co/api/v2/oauth/token';
  const data: AnilistOAuthAccessTokenURLEncodedData = {
    grant_type: 'authorization_code',
    client_id: ANILIST_ID,
    client_secret: ANILIST_SECRET,
    redirect_uri: `${BASE_URL}auth/anilist/callback`,
    code: code
  };
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams(data as unknown as Record<string, string>)
  });
  if (response.ok) {
    const oauth = (await response.json()) as AnilistOAuthAccessTokenResponse;
    return oauth.access_token;
  } else {
    logger.error(`Spotify callback failed with status: ${response.status}`);
    return null;
  }
}

export default router;
