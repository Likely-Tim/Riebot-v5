import { AnilistMediaObject } from '../types/anilist';

export interface LogResponse {
  logNames: string[];
}

export interface AnimeCurrentResponse {
  media: AnilistMediaObject[];
}

export interface AnimeAiringResponse {
  media: AnilistMediaObject[];
}

export interface AnimeUsersResponse {
  users: [string, string][];
}

export interface AnimeWatchingResponse {
  media: AnilistMediaObject[];
}
