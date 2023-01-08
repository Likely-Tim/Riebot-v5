import logger from './logger';
import fetch from 'node-fetch';
import { dateParse } from './misc';
import { Date } from '../types/misc';
import { StringSelectMenuOptions } from '../types/buttons';
import {
  AnilistAiringScheduleInBetweenResponse,
  AnilistAnimeSeasonPageResponse,
  AnilistCharacter,
  AnilistCharactersResponse,
  AnilistCharacterVa,
  AnilistMedia,
  AnilistMediaObject,
  AnilistMediaResponse,
  AnilistSearchAnimeResponse,
  AnilistSearchCharacterResponse,
  AnilistSearchStaffResponse,
  AnilistShowCharactersResponse,
  AnilistTrend,
  AnilistTrendResponse,
  AnilistUserWatchingListResponse,
  AnilistVa,
  AnilistVaCharactersResponse,
  AnilistVaResponse,
  AnilistViewerObject,
  AnilistViewerResponse
} from '../types/anilist';

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
  async getVaCharacters(vaId: number) {
    logger.info(`[Anilist] Getting characters for va ${vaId}`);
    const search = `
      query {
        Staff(id: ${vaId}) {
          characters(sort: [ROLE, FAVOURITES_DESC], perPage: 10) {
            nodes {
              id
              name {
                full
              }
              
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Character Ids`);
      const body = (await response.json()) as AnilistVaCharactersResponse;
      const characters = [];
      for (const character of body.data.Staff.characters.nodes) {
        characters.push({ name: character.name.full, id: character.id });
      }
      return characters;
    } else {
      logger.warn(`[Anilist] Failed to get characters`);
      return null;
    }
  }

  async getCharacterVa(characterId: number) {
    logger.info(`[Anilist] Getting voice actor name with character id ${characterId}`);
    const search = `
      {
        Character(id: ${characterId}) {
          media(type: ANIME) {
            edges {
              node {
                id
              }
              voiceActors(language: JAPANESE, sort: RELEVANCE) {
                id
                name {
                  full
                }
              }
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Voice Actor name`);
      const body = (await response.json()) as AnilistCharacterVa;
      let name = null;
      let id = null;
      for (const edge of body.data.Character.media.edges) {
        if (edge.voiceActors.length !== 0) {
          name = edge.voiceActors[0].name.full;
          id = edge.voiceActors[0].id;
          break;
        }
      }
      if (name && id) {
        return { name: name, id: id };
      } else {
        return null;
      }
    } else {
      logger.warn(`[Anilist] Failed to get voice actor with characted id ${characterId}`);
      return null;
    }
  }

  async getShowTrend(id: number, page?: number): Promise<AnilistTrend[] | null> {
    logger.info(`[Anilist] Getting anime trend with id ${id}`);
    if (!page) {
      page = 1;
    }
    logger.info(`[Anilist] Getting anime trend page ${page}`);
    const search = `
      query {
        Media(id: ${id}) {
          trends (page: ${page}, perPage: 25, releasing:true, sort: [EPISODE_DESC]) {
            pageInfo {
              currentPage
              hasNextPage
            }
            nodes {
              averageScore
              date
              episode
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Anime Trend`);
      const trendData: AnilistTrend[] = [];
      const body = (await response.json()) as AnilistTrendResponse;
      const trends = body.data.Media.trends.nodes;
      for (const trend of trends) {
        if (trend.episode) {
          trendData.unshift({ episode: trend.episode, score: trend.averageScore });
        }
      }
      if (
        body.data.Media.trends.pageInfo.hasNextPage &&
        body.data.Media.trends.nodes[body.data.Media.trends.nodes.length - 1].episode
      ) {
        const temp = await this.getShowTrend(id, ++page);
        if (temp) {
          return [...temp, ...trendData];
        }
      }
      return trendData;
    } else {
      logger.warn(`[Anilist] Failed to get anime trend with id ${id}`);
      return null;
    }
  }

  async getAnime(id: number): Promise<AnilistMedia | null> {
    logger.info(`[Anilist] Getting anime with id ${id}`);
    const search = `
      query {
        Media(id: ${id}, type: ANIME) {
          id
          format
          title {
            english
            romaji
            native
          }
          status
          description(asHtml: true)
          season
          seasonYear
          episodes
          popularity
          trailer {
            site
            id
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
          meanScore
          nextAiringEpisode {
            episode
            timeUntilAiring
          }
          siteUrl
          rankings {
            type
            rank
            allTime
            year
            season
          }
          studios {
            nodes {
              name
              isAnimationStudio
            }
          }
          characters (role: MAIN) {
            nodes {
              id
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Anime`);
      const body = (await response.json()) as AnilistMediaResponse;
      const media = body.data.Media;
      const englishTitle = media.title.english;
      const romajiTitle = media.title.romaji;
      const nativeTitle = media.title.native;
      const title = romajiTitle
        ? romajiTitle
        : englishTitle
        ? englishTitle
        : nativeTitle
        ? nativeTitle
        : 'Unknown Title';
      const extraLargeCover = media.coverImage.extraLarge;
      const largeCover = media.coverImage.large;
      const mediumCover = media.coverImage.medium;
      const coverImage = extraLargeCover ? extraLargeCover : largeCover ? largeCover : mediumCover ? mediumCover : null;
      let nextEpisode: number | null;
      if (media.nextAiringEpisode) {
        nextEpisode = media.nextAiringEpisode.episode;
      } else {
        nextEpisode = null;
      }
      let trailer: string | null = null;
      if (media.trailer) {
        if (media.trailer.site === 'youtube') {
          trailer = `https://youtu.be/${media.trailer.id}`;
        } else if (media.trailer.site === 'dailymotion') {
          trailer = `https://dai.ly/${media.trailer.id}`;
        } else {
          trailer = null;
        }
      }
      const studios: string[] = [];
      for (const studio of media.studios.nodes) {
        if (studio.isAnimationStudio) {
          studios.push(studio.name);
        }
      }
      let ranking = [];
      for (const rank of media.rankings) {
        if (rank.type == 'POPULAR') {
          continue;
        }
        if (rank.allTime) {
          ranking.unshift(`➤ **All Time**: #${rank.rank}`);
        } else {
          if (rank.season && rank.year) {
            ranking.push(`➤ **${SEASON_MAP[rank.season]} ${rank.year}**: #${rank.rank}`);
          }
        }
      }
      return {
        id: media.id,
        title: title,
        url: media.siteUrl,
        status: media.status,
        descriptionHtml: media.description,
        season: `${SEASON_MAP[media.season]} ${media.seasonYear}`,
        episodes: media.episodes,
        score: media.meanScore,
        coverImage: coverImage,
        nextEpisode: nextEpisode,
        studios: studios.length ? studios.join(',') : null,
        rank: ranking.length ? ranking.join('\n') : null,
        haveMain: media.characters.nodes.length ? true : false,
        trailer: trailer
      };
    } else {
      logger.warn(`[Anilist] Failed to get show with status ${response.status}`);
      return null;
    }
  }

  async getShowCharacters(showId: number) {
    logger.info(`[Anilist] Getting anime character with id ${showId}`);
    const search = `
      query {
        Media(id: ${showId}) {
          title {
            romaji
            english
            native
          }
          characters(sort: RELEVANCE, role: MAIN, perPage: 10) {
            nodes {
              id
              name {
                full
              }
              image {
                large
              }
              description (asHtml:true)
              siteUrl
              dateOfBirth {
                year
                month
                day
              }
              age
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Characters`);
      const characters: AnilistCharacter[] = [];
      const body = (await response.json()) as AnilistShowCharactersResponse;
      let title;
      if (body.data.Media.title.romaji) {
        title = body.data.Media.title.romaji;
      } else {
        title = body.data.Media.title.english;
      }
      for (const character of body.data.Media.characters.nodes) {
        const dobObject: Date = {
          year: character.dateOfBirth.year,
          month: character.dateOfBirth.month,
          day: character.dateOfBirth.day
        };
        const dob = dateParse(dobObject);
        characters.push({
          id: character.id,
          name: character.name.full,
          imageUrl: character.image.large,
          url: character.siteUrl,
          descriptionHtml: character.description,
          dob: dob,
          age: character.age,
          media: title,
          mediaId: showId,
          vaName: null,
          vaId: null
        });
      }
      return characters;
    } else {
      logger.warn(`[Anilist] Failed to get anime trend with id ${showId}`);
      return null;
    }
  }

  async getCharacters(characterIds: number[]) {
    logger.info(`[Anilist] Getting characters from ids ${characterIds}`);
    const search = `
      query {
        Page(perPage: 10) {
          characters(id_in: [${characterIds.join(', ')}]) {
            id
            name {
              full
            }
            image {
              large
            }
            description(asHtml: true)
            dateOfBirth {
              year
              month
              day
            }
            age
            siteUrl
            media(type: ANIME, sort: [ID]) {
              edges {
                node {
                  id
                }
                voiceActors(language: JAPANESE, sort: RELEVANCE) {
                  id
                  name {
                    full
                  }
                }
              }
              nodes {
                id
                title {
                  romaji
                  english
                }
              }
            }
          }
        }
      }  
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Character Ids`);
      const body = (await response.json()) as AnilistCharactersResponse;
      const idToCharacter: { [key: number]: AnilistCharacter } = {};
      for (const character of body.data.Page.characters) {
        const dobObject: Date = {
          year: character.dateOfBirth.year,
          month: character.dateOfBirth.month,
          day: character.dateOfBirth.day
        };
        const dob = dateParse(dobObject);
        let vaName: string | null = null;
        let vaId: number | null = null;
        if (character.media.edges[0].voiceActors.length !== 0) {
          vaName = character.media.edges[0].voiceActors[0].name.full;
          vaId = character.media.edges[0].voiceActors[0].id;
        }
        let mediaName: string | null = null;
        let mediaId: number | null = null;
        if (character.media.nodes.length !== 0) {
          mediaName = character.media.nodes[0].title.romaji;
          mediaId = character.media.nodes[0].id;
        }
        const info: AnilistCharacter = {
          id: character.id,
          name: character.name.full,
          url: character.siteUrl,
          imageUrl: character.image.large,
          descriptionHtml: character.description,
          age: character.age,
          dob: dob,
          vaName: vaName,
          vaId: vaId,
          media: mediaName,
          mediaId: mediaId
        };
        idToCharacter[character.id] = info;
      }
      return idToCharacter;
    } else {
      logger.warn(`[Anilist] Failed to get characters`);
      return null;
    }
  }

  async getVa(vaId: number): Promise<AnilistVa | null> {
    logger.info(`[Anilist] Getting voice actor with id ${vaId}`);
    const search = `
      query {
        Staff(id: ${vaId}) {
          name {
            full
          }
          image {
            large
          }
          description(asHtml: true)
          homeTown
          age
          dateOfBirth {
            year
            month
            day
          }
          yearsActive
          siteUrl
          characters(sort: [ROLE, FAVOURITES_DESC], perPage: 10) {
            nodes {
              name {
                full
              }
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Voice Actor`);
      const body = (await response.json()) as AnilistVaResponse;
      const staff = body.data.Staff;
      const dobObject: Date = {
        year: staff.dateOfBirth.year,
        month: staff.dateOfBirth.month,
        day: staff.dateOfBirth.day
      };
      const dob = dateParse(dobObject);
      return {
        name: staff.name.full,
        imageUrl: staff.image.large,
        descriptionHtml: staff.description,
        homeTown: staff.homeTown || 'N/A',
        age: staff.age || 'N/A',
        dob: dob,
        url: staff.siteUrl,
        characters: staff.characters.nodes.length
      };
    } else {
      logger.warn(`[Anilist] Failed to get voice actor id ${vaId}`);
      return null;
    }
  }

  async searchStaff(query: string) {
    logger.info(`[Anilist] Searching staff ${query}`);
    const search = `
      query {
        Page(perPage: 20) {
          staff(search: "${query}") {
            id
            name {
              full
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got staff`);
      const body = (await response.json()) as AnilistSearchStaffResponse;
      const items: StringSelectMenuOptions[] = [];
      for (const staff of body.data.Page.staff) {
        items.push({ value: String(staff.id), label: staff.name.full });
      }
      return items;
    } else {
      logger.warn(`[Anilist] Failed to search for staff`);
      return null;
    }
  }

  async searchCharacter(query: string) {
    logger.info(`[Anilist] Searching character ${query}`);
    const search = `
      query {
        Page(perPage: 20) {
          characters(search: "${query}") {
            id
            name {
              full
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got characters`);
      const body = (await response.json()) as AnilistSearchCharacterResponse;
      const items: StringSelectMenuOptions[] = [];
      for (const character of body.data.Page.characters) {
        items.push({ value: String(character.id), label: character.name.full });
      }
      return items;
    } else {
      logger.warn(`[Anilist] Failed to search for characters`);
      return null;
    }
  }

  async searchAnime(query: string) {
    logger.info(`[Anilist] Searching for anime ${query}`);
    const search = `
      query {
        Page(perPage: 20) {
          media (search: "${query}", type: ANIME) {
            id
            title {
              english,
              romaji,
              native
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    const response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Successfully got anime search`);
      const body = (await response.json()) as AnilistSearchAnimeResponse;
      const medias = body.data.Page.media;
      const items: StringSelectMenuOptions[] = [];
      for (const media of medias) {
        const englishTitle = media.title.english;
        const romajiTitle = media.title.romaji;
        const nativeTitle = media.title.native;
        const title = romajiTitle
          ? romajiTitle
          : englishTitle
          ? englishTitle
          : nativeTitle
          ? nativeTitle
          : 'Unknown Title';
        items.push({ value: String(media.id), label: title });
      }
      return items;
    } else {
      logger.warn(`[Anilist] Failed to search for show with status ${response.status}`);
      return null;
    }
  }

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
