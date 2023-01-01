import logger from './logger';
import fetch from 'node-fetch';
import {
  AnilistAiringScheduleInBetweenResponse,
  AnilistAnimeSeasonPageResponse,
  AnilistMediaObject,
  AnilistUserWatchingListResponse,
  AnilistViewerObject,
  AnilistViewerResponse
} from '../types';

const SEASON_MAP = {
  WINTER: 'Winter',
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Fall'
};

const MONTH_MAP = {
  1: 'Jan',
  2: 'Feb',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'Aug',
  9: 'Sept',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec'
};

class Anilist {
  async getAuthenticatedUser(accessToken: string): Promise<AnilistViewerObject | null> {
    logger.info(`[Anilist] Get Authenticated User`);
    const search = `
      query {
        Viewer {
          id
          name
        }
      }  
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendAuthenticatedPostRequest(url, search, accessToken);
    if (response.ok) {
      logger.info(`[Anilist] Get Authenticated User Response Status: ${response.status}`);
      const body = (await response.json()) as AnilistViewerResponse;
      return body.data.Viewer;
    } else {
      logger.warn(`[Anilist] Failed Getting Authenticated User Response Status: ${response.status}`);
      return null;
    }
  }

  async getAnimeSeason(season: string, year: number, page?: number) {
    if (!page) {
      page = 1;
    }
    logger.info(`[Anilist] Get Anime for ${season} ${year} page ${page}`);
    const search = `
      query {
        Page(page: ${page}, perPage: 50) {
          pageInfo {
            hasNextPage
          }
          media(type: ANIME, format_in: [TV, TV_SHORT], season: ${season}, seasonYear: ${year}, sort: [POPULARITY_DESC]) {
            popularity
            format
            title {
              romaji
              english
              native
            }
            episodes
            nextAiringEpisode {
              timeUntilAiring
              airingAt
              episode
            }
            airingSchedule {
              pageInfo {
                hasNextPage
              }
              nodes {
                timeUntilAiring
                episode
              }
            }
            coverImage {
              extraLarge
              large
              medium
              color
            }
            siteUrl
            stats {
              scoreDistribution {
                score
                amount
              }
              statusDistribution {
                status
                amount
              }
            }
          }
        }
      }   
    `;
    const url = 'https://graphql.anilist.co';
    const response = await sendPostRequest(url, search);
    if (response.ok) {
      logger.info(`[Anilist] Got anime season`);
      const body = (await response.json()) as AnilistAnimeSeasonPageResponse;
      let media = body.data.Page.media;
      if (body.data.Page.pageInfo.hasNextPage) {
        const response = await this.getAnimeSeason(season, year, ++page);
        if (response) {
          media = media.concat(response);
        }
      }
      return removeDuplicateMedia(media);
    } else {
      logger.warn(`[Anilist] Failed to get anime season with status: ${response.status}`);
      return null;
    }
  }

  async getAnimeAiringBetweenTimes(startTime: number, endTime: number, page?: number) {
    if (!page) {
      page = 1;
    }
    logger.info(`[Anilist] Get Anime Airing Between ${startTime}-${endTime} page ${page}`);
    const search = `
      query {
        Page(page: ${page}, perPage: 50) {
          pageInfo {
            hasNextPage
          }
          airingSchedules(airingAt_greater: ${startTime}, airingAt_lesser: ${endTime}, sort: [TIME]) {
            media {
              popularity
              format
              title {
                romaji
                english
                native
              }
              episodes
              nextAiringEpisode {
                timeUntilAiring
                airingAt
                episode
              }
              airingSchedule {
                pageInfo {
                  hasNextPage
                }
                nodes {
                  timeUntilAiring
                  episode
                }
              }
              coverImage {
                extraLarge
                large
                medium
                color
              }
              siteUrl
              stats {
                scoreDistribution {
                  score
                  amount
                }
                statusDistribution {
                  status
                  amount
                }
              }
            }
          }
        }
      }   
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.ok) {
      logger.info(`[Anilist] Got Anime Airing Between Time`);
      const body = (await response.json()) as AnilistAiringScheduleInBetweenResponse;
      let medias: AnilistMediaObject[] = [];
      for (const media of body.data.Page.airingSchedules) {
        medias.push(media.media);
      }
      if (body.data.Page.pageInfo.hasNextPage) {
        const response = await this.getAnimeAiringBetweenTimes(startTime, endTime, ++page);
        if (response) {
          medias.push(...response);
        }
      }
      return removeDuplicateMedia(medias);
    } else {
      logger.warn(`[Anilist] Failed to get airing anime between time with status: ${response.status}`);
      return null;
    }
  }

  async getUserAnimeWatching(userId: number) {
    logger.info(`[Anilist] Get Anime Watching List for ${userId}`);
    const search = `
      query {
        MediaListCollection(userId: ${userId}, type: ANIME, forceSingleCompletedList: true, status: CURRENT) {
          lists {
            entries {
              media {
                popularity
                format
                title {
                  romaji
                  english
                  native
                }
                episodes
                nextAiringEpisode {
                  timeUntilAiring
                  airingAt
                  episode
                }
                airingSchedule {
                  pageInfo {
                    hasNextPage
                  }
                  nodes {
                    timeUntilAiring
                    episode
                  }
                }
                coverImage {
                  extraLarge
                  large
                  medium
                  color
                }
                siteUrl
                stats {
                  scoreDistribution {
                    score
                    amount
                  }
                  statusDistribution {
                    status
                    amount
                  }
                }
              }
            }
          }
        }
      }   
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.ok) {
      logger.info(`[Anilist] Got Anime Watching List`);
      const body = (await response.json()) as AnilistUserWatchingListResponse;
      const medias: AnilistMediaObject[] = [];
      if (body.data.MediaListCollection.lists.length !== 0) {
        for (const media of body.data.MediaListCollection.lists[0].entries) {
          medias.push(media.media);
        }
        return medias;
      } else {
        return [];
      }
    } else {
      logger.warn(`[Anilist] Failed to get user anime watching list with status ${response.status}`);
      return null;
    }
  }
}

async function sendPostRequest(url: string, search: string) {
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      query: search
    })
  });
  return response;
}

async function sendAuthenticatedPostRequest(url: string, search: string, accessToken: string) {
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      query: search
    })
  });
  return response;
}

// Anilist API bug may return duplicates
function removeDuplicateMedia(medias: AnilistMediaObject[]) {
  return medias.filter((media, index, medias) => index === medias.findIndex((temp) => temp.siteUrl === media.siteUrl));
}

export default new Anilist();
