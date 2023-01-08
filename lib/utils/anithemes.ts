import logger from './logger';
import fetch from 'node-fetch';
import { AnithemesSearchAnilistId, ThemeObject } from '../types/anithemes';

class Anithemes {
  async searchByAnilistId(anilistId: number) {
    logger.info(`[Anithemes] Searching with Anilist Id ${anilistId}`);
    const url = `https://api.animethemes.moe/anime?&include=images,resources,animethemes.song.artists,animethemes.animethemeentries.videos&fields[anime]=name&fields[animetheme]=type&fields[song]=title&fields[artist]=name&fields[animethemeentry]=episodes&fields[video]=link&filter[has]=resources&filter[site]=AniList&filter[external_id]=${anilistId}`;
    let response = await fetch(url, {
      method: 'GET'
    });
    if (response.status === 200) {
      const body = (await response.json()) as AnithemesSearchAnilistId;
      if (body.anime.length === 0) {
        return null;
      }
      const themeObjects: ThemeObject[] = [];
      const themes = body.anime[0].animethemes;
      for (const theme of themes) {
        const artists = [];
        for (const artist of theme.song.artists) {
          artists.push(artist.name);
        }
        themeObjects.push({
          type: theme.type,
          title: theme.song.title,
          artists: artists.join(','),
          episodes: theme.animethemeentries[0].episodes,
          videoUrl: theme.animethemeentries[0].videos[0].link
        });
      }
      return themeObjects;
    } else {
      logger.info(`[Anithemes] Search failed with status ${response.status}`);
      return null;
    }
  }
}

export default new Anithemes();
