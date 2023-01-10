import * as path from 'path';
import { Router } from 'express';
import Anilist from '../utils/anilist';
import * as dbWeb from '../utils/databases/web';
import { AnimeAiringResponse, AnimeCurrentResponse, AnimeUsersResponse, AnimeWatchingResponse } from '../types/web';
import { AnilistMediaObject } from '../types/anilist';

const router = Router();

router.get('/show', async (request, response) => {
  response.sendFile(path.join(__dirname, '..', 'web', 'html', 'anime-show.html'));
});

router.get('/current', async (request, response) => {
  const media = await Anilist.getAnimeSeason('FALL', 2022);
  const data: AnimeCurrentResponse = {
    media: media ? media : []
  };
  response.send(data);
});

router.get('/show/airing', async (request, response) => {
  const startTime = parseInt(request.query.start as string);
  const endTime = parseInt(request.query.end as string);
  if (startTime && endTime) {
    let media: AnilistMediaObject[] | null;
    if (!(await dbWeb.checkAnimeShowCache(`AnimeShow-${startTime}-${endTime}`))) {
      media = await Anilist.getAnimeAiringBetweenTimes(startTime, endTime);
      dbWeb.setAnimeShowCache(`AnimeShow-${startTime}-${endTime}`, media ? media : []);
    } else {
      media = (await dbWeb.getAnimeShowCache(`AnimeShow-${startTime}-${endTime}`)) as AnilistMediaObject[] | null;
    }
    const data: AnimeAiringResponse = {
      media: media ? media : []
    };
    response.send(data);
  } else {
    response.sendStatus(404);
  }
});

router.get('/show/users', async (request, response) => {
  const users = await dbWeb.getAllAnimeShowUser();
  const data: AnimeUsersResponse = {
    users: users ? users : []
  };
  response.send(data);
});

router.get('/show/watching', async (request, response) => {
  const userId = parseInt(request.query.userId as string);
  const media = await Anilist.getUserAnimeWatching(userId);
  const data: AnimeWatchingResponse = {
    media: media ? media : []
  };
  response.send(data);
});

export default router;
