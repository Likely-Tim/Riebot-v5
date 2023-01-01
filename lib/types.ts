import { Client, ClientOptions, SlashCommandBuilder, ChatInputCommandInteraction, Collection } from 'discord.js';

export class DiscordClient extends Client {
  commands: Collection<string, Command>;

  constructor(options: ClientOptions) {
    super(options);
  }
}

export interface Command {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

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

export interface AnilistViewerResponse {
  data: {
    Viewer: AnilistViewerObject | null;
  };
}

export interface AnilistViewerObject {
  id: number | null;
  name: string | null;
}

export interface AnilistAnimeSeasonPageResponse {
  data: {
    Page: {
      pageInfo: AnilistPageInfoObject;
      media: AnilistMediaObject[];
    };
  };
}

export interface AnilistAiringScheduleInBetweenResponse {
  data: {
    Page: {
      pageInfo: AnilistPageInfoObject;
      airingSchedules: AnilistMediaWrapper[];
    };
  };
}

export interface AnilistMediaWrapper {
  media: AnilistMediaObject;
}

export interface AnilistUserWatchingListResponse {
  data: {
    MediaListCollection: {
      lists: [{ entries: AnilistMediaWrapper[] }] | [];
    };
  };
}

export interface AnilistMediaObject {
  format: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'MANGA' | 'NOVEL' | 'ONE_SHOT';
  title: AnilistMediaTitleObject;
  episodes: number | null;
  nextAiringEpisode: AnilistMediaNextAiringEpisodeObject | null;
  airingSchedule: AnilistMediaAiringScheduleObject;
  coverImage: AnilistMediaCoverImageObject;
  siteUrl: string;
  stats: AnilistMediaStatsObject;
  popularity: number;
}

export interface AnilistPageInfoObject {
  hasNextPage: boolean;
}

export interface AnilistMediaTitleObject {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export interface AnilistMediaNextAiringEpisodeObject {
  timeUntilAiring: number;
  airingAt: number;
  episode: number;
}

export interface AnilistMediaAiringScheduleObject {
  pageInfo: AnilistPageInfoObject;
  nodes: AnilistMediaAiringScheduleNodeObject[];
}

export interface AnilistMediaAiringScheduleNodeObject {
  timeUntilAiring: number;
  episode: number;
}

export interface AnilistMediaCoverImageObject {
  extraLarge: string | null;
  large: string | null;
  medium: string | null;
  color: string | null;
}

export interface AnilistMediaStatsObject {
  scoreDistribution: AnilistMediaScoreDistributionObject[];
  statusDistribution: AnilistMediaStatusDistributionObject[];
}

export interface AnilistMediaScoreDistributionObject {
  score: number;
  amount: number;
}

export interface AnilistMediaStatusDistributionObject {
  status: 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';
  amount: number;
}
