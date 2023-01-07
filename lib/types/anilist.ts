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
