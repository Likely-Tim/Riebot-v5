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
      lists: {
        entries: {
          progress: number;
          media: AnilistMediaObject;
        }[];
      }[];
    };
  };
}

export interface AnilistMediaResponse {
  data: {
    Media: AnilistGetAnimeMediaObject;
  };
}

export interface AnilistGetAnimeMediaObject extends AnilistMediaObject {
  id: number;
  status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  description: string;
  season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  seasonYear: number;
  trailer: {
    site: 'youtube' | 'dailymotion';
    id: string;
  };
  meanScore: number;
  rankings: {
    type: 'RATED' | 'POPULAR';
    rank: number;
    allTime: boolean;
    year: number | null;
    season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  }[];
  studios: {
    nodes: {
      name: string;
      isAnimationStudio: boolean;
    }[];
  };
  characters: {
    nodes: {
      id: number;
    }[];
  };
}

export interface AnilistMediaObjectWithProgress extends AnilistMediaObject {
  progress: number;
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

export interface AnilistSearchAnimeResponse {
  data: {
    Page: {
      media: {
        id: number;
        title: AnilistMediaTitleObject;
      }[];
    };
  };
}

export interface AnilistSearchCharacterResponse {
  data: {
    Page: {
      characters: {
        id: number;
        name: {
          full: string;
        };
      }[];
    };
  };
}

export interface AnilistSearchStaffResponse {
  data: {
    Page: {
      staff: {
        id: number;
        name: {
          full: string;
        };
      }[];
    };
  };
}

export interface AnilistVaResponse {
  data: {
    Staff: {
      name: {
        full: string;
      };
      image: {
        large: string;
      };
      description: string;
      homeTown: string;
      age: number;
      dateOfBirth: {
        year: number | null;
        month: number | null;
        day: number | null;
      };
      yearsActive: [] | [number, number] | [number];
      siteUrl: string;
      characters: {
        nodes: {
          name: {
            full: string;
          };
        }[];
      };
    };
  };
}

export interface AnilistVa {
  name: string;
  imageUrl: string;
  descriptionHtml: string;
  homeTown: string;
  age: number | string;
  dob: string;
  url: string;
  characters: number;
}

export interface AnilistCharactersResponse {
  data: {
    Page: {
      characters: {
        id: number;
        name: {
          full: string;
        };
        image: {
          large: string;
        };
        description: string;
        dateOfBirth: {
          year: number | null;
          month: number | null;
          day: number | null;
        };
        age: number | null;
        siteUrl: string;
        media: {
          edges: {
            node: {
              id: number;
            };
            voiceActors: {
              id: number;
              name: {
                full: string;
              };
            }[];
          }[];
          nodes: {
            id: number;
            title: {
              romaji: string;
              english: string;
            };
          }[];
        };
      }[];
    };
  };
}

export interface AnilistCharacter {
  id: number;
  name: string;
  url: string;
  imageUrl: string;
  descriptionHtml: string;
  age: number | null;
  dob: string;
  vaName: string | null;
  vaId: number | null | string;
  media: string | null;
  mediaId: number | null;
}

export interface AnilistCharacterVa {
  data: {
    Character: {
      media: {
        edges: {
          node: {
            id: number;
          };
          voiceActors: {
            id: number;
            name: {
              full: string;
            };
          }[];
        }[];
      };
    };
  };
}

export interface AnilistMedia {
  id: number;
  title: string;
  url: string;
  status: string;
  descriptionHtml: string;
  season: string;
  episodes: number | null;
  score: number;
  coverImage: string | null;
  nextEpisode: number | null;
  trailer: string | null;
  studios: string | null;
  rank: string | null;
  haveMain: boolean;
}

export interface AnilistTrendResponse {
  data: {
    Media: {
      trends: {
        pageInfo: {
          currentPage: number;
          hasNextPage: boolean;
        };
        nodes: {
          averageScore: number;
          date: number;
          episode: null;
        }[];
      };
    };
  };
}

export interface AnilistTrend {
  episode: number;
  score: number;
}

export interface AnilistShowCharactersResponse {
  data: {
    Media: {
      title: AnilistMediaTitleObject;
      characters: {
        nodes: {
          id: number;
          name: {
            full: string;
          };
          image: {
            large: string;
          };
          description: string;
          siteUrl: string;
          dateOfBirth: {
            year: number | null;
            month: number | null;
            day: number | null;
          };
          age: number | null;
        }[];
      };
    };
  };
}

export interface AnilistVaCharactersResponse {
  data: {
    Staff: {
      characters: {
        nodes: {
          id: number;
          name: {
            full: string;
          };
        }[];
      };
    };
  };
}
