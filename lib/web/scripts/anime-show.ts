import { AnilistMediaObject, AnimeAiringResponse, AnimeUsersResponse, AnimeWatchingResponse } from '../../types';

export {};

const midnight = new Date();
midnight.setHours(0, 0, 0, 0);
const midnightUnix = midnight.getTime() / 1000;
const endOfDay = new Date();
endOfDay.setHours(24, 0, 0, 0);
const endOfDayUnix = endOfDay.getTime() / 1000;
const endOfWeek = endOfDay;
endOfWeek.setHours(endOfWeek.getHours() + 144);
const endOfWeekUnix = endOfWeek.getTime() / 1000;

sendGetRequest(`/anime/show/users`).then((response: AnimeUsersResponse) => {
  const buttons = ['Airing'];
  const buttonId = ['Airing'];
  const users = response.users;
  for (let i = 0; i < users.length; i++) {
    buttons.push(users[i][1]);
    buttonId.push(users[i][0]);
  }
  buttons.push('+');
  buttonId.push('+');
  generateChoiceButtons(buttons, buttonId);
});

displayAiringAnime();

function displayAiringAnime() {
  document.getElementById('loading')!.style.display = 'block';
  sendGetRequest(`/anime/show/airing?start=${midnightUnix}&end=${endOfWeekUnix}`).then(
    (response: AnimeAiringResponse) => {
      try {
        document.getElementsByTagName('main')[0].removeChild(document.getElementById('dayContainer')!);
      } catch (error) {}
      const mediaArray = mediaByDay(response.media);
      const sortedMediaArray = sortByPopularity(mediaArray);
      mediaGenerateHtml(sortedMediaArray);
      document.getElementById('loading')!.style.display = 'none';
    }
  );
}

function displayUserAnime(userId: string) {
  console.log(userId);
  document.getElementById('loading')!.style.height = '100%';
  document.getElementById('loading')!.style.display = 'block';
  sendGetRequest(`/anime/show/watching?userId=${userId}`).then((response: AnimeWatchingResponse) => {
    try {
      document.getElementsByTagName('main')[0].removeChild(document.getElementById('dayContainer')!);
    } catch (error) {}
    const mediaArray = mediaByDay(response.media);
    const sortedMediaArray = sortByPopularity(mediaArray);
    mediaGenerateHtml(sortedMediaArray);
    document.getElementById('loading')!.style.display = 'none';
  });
}

// sendGetRequest("/anime/current").then((response) => {
//   const mediaArray = mediaParseByDay(response.media);
//   mediaEnterDay(mediaArray);
//   document.getElementById("loading").style.display = "none";
// });

function generateChoiceButtons(buttons: string[], buttonId: string[]) {
  const buttonContainer = document.createElement('div');
  buttonContainer.setAttribute('id', 'choiceButtonContainer');
  for (let i = 0; i < buttons.length; i++) {
    const button = document.createElement('button');
    if (buttons[i] == 'Airing') {
      button.setAttribute('class', 'choiceButton active');
    } else if (buttons[i] == '+') {
      button.setAttribute('class', 'choiceButton addition');
    } else {
      button.setAttribute('class', 'choiceButton');
    }
    button.setAttribute('id', buttonId[i]);
    button.appendChild(document.createTextNode(buttons[i]));
    button.addEventListener('click', choiceButtonHandler);
    buttonContainer.appendChild(button);
  }
  document.getElementsByTagName('main')[0].appendChild(buttonContainer);
  document.getElementsByTagName('main')[0].appendChild(document.createElement('hr'));
}

function choiceButtonHandler(event: MouseEvent) {
  if (event.target instanceof Element) {
    if (event.target.id == '+') {
      document.cookie = 'redirectUrl=/anime/show; sameSite=lax; path=/';
      document.cookie = 'task=addAnimeShowUser; sameSite=lax; path=/';
      window.location.href = '/auth/anilist';
    } else {
      if (event.target.classList.contains('active')) {
        return;
      }
      document.getElementsByClassName('active')[0].classList.toggle('active');
      event.target.classList.toggle('active');
      if (event.target.id == 'Airing') {
        displayAiringAnime();
      } else {
        displayUserAnime(event.target.id);
      }
    }
  }
}

const numberToDiv = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Future',
  8: 'Watching',
  9: 'Unending'
};

function mediaGenerateHtml(mediaArray: AnilistMediaObject[][]) {
  generateDayHtml(mediaArray);
  for (let dayId = 0; dayId < mediaArray.length; dayId++) {
    let day = numberToDiv[dayId as keyof typeof numberToDiv] + '_Covers';
    for (let i = 0; i < mediaArray[dayId].length; i++) {
      let parent = document.getElementById(day)!;
      let div = document.createElement('div');
      div.setAttribute('class', 'cover');
      let anchor = document.createElement('a');
      anchor.setAttribute('href', mediaArray[dayId][i].siteUrl);
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
      let image = document.createElement('img');
      image.setAttribute('src', mediaArray[dayId][i].coverImage.extraLarge!);
      image.setAttribute('class', 'covers');
      anchor.appendChild(image);
      div.appendChild(anchor);
      parent.appendChild(div);
    }
  }
  reorderDays();
}

function generateDayHtml(mediaArray: AnilistMediaObject[][]) {
  const container = document.createElement('div');
  container.setAttribute('id', 'dayContainer');
  for (let i = 0; i < mediaArray.length; i++) {
    if (mediaArray[i].length == 0) {
      continue;
    }
    const day = numberToDiv[i as keyof typeof numberToDiv];
    const div = document.createElement('div');
    div.setAttribute('class', 'day');
    div.setAttribute('id', day);
    const heading = document.createElement('h2');
    heading.appendChild(document.createTextNode(day));
    div.appendChild(heading);
    const covers = document.createElement('div');
    covers.setAttribute('class', 'covers');
    covers.setAttribute('id', `${day}_Covers`);
    div.appendChild(covers);
    container.appendChild(div);
  }
  document.getElementsByTagName('main')[0].appendChild(container);
}

function reorderDays() {
  const date = new Date();
  let dayNumber = date.getDay();
  for (let i = 0; i < 7; i++) {
    try {
      dayNumber = dayNumber % 7;
      let day = numberToDiv[dayNumber as keyof typeof numberToDiv];
      document.getElementById(day)!.style.order = String(i);
      dayNumber++;
    } catch (error) {
      continue;
    }
  }
}

function mediaByDay(medias: AnilistMediaObject[]) {
  const days: AnilistMediaObject[][] = [[], [], [], [], [], [], [], [], [], []];
  for (const media of medias) {
    if (!(media.format == 'TV') && !(media.format == 'TV_SHORT')) {
      continue;
    }
    // There is no known next episode
    if (!media.nextAiringEpisode) {
      days[8].push(media);
      continue;
    }
    // Long lasting anime
    if (media.nextAiringEpisode.episode > 100) {
      days[9].push(media);
      continue;
    }
    // Airing later today or this week
    const nextAiringTime = media.nextAiringEpisode.airingAt;
    const nextAiringDate = new Date(nextAiringTime * 1000);
    if (endOfDay > nextAiringDate || endOfWeek > nextAiringDate) {
      days[nextAiringDate.getDay()].push(media);
      continue;
    }
    // Check if aired already today
    const latestEpisode = getLatestEpisodeTime(media);
    if (latestEpisode) {
      let date = new Date();
      date.setSeconds(date.getSeconds() + latestEpisode);
      if (midnight < date) {
        days[date.getDay()].push(media);
        continue;
      }
    }
    // Assume will always air on same day of the week
    const episodeAirTime = media.airingSchedule.nodes[0].timeUntilAiring;
    const episodeAirDate = new Date();
    episodeAirDate.setSeconds(episodeAirDate.getSeconds() + episodeAirTime);
    if (episodeAirDate.getDay() == new Date().getDay()) {
      days[episodeAirDate.getDay()].push(media);
      continue;
    }
    days[7].push(media);
  }
  return days;
}

function sortByPopularity(mediaArray: AnilistMediaObject[][]) {
  for (let i = 0; i < mediaArray.length; i++) {
    mediaArray[i].sort((a, b) => {
      return b.popularity - a.popularity;
    });
  }
  return mediaArray;
}

function getLatestEpisodeTime(media: AnilistMediaObject) {
  // Airing Schedule not long enough
  if (media.airingSchedule.pageInfo.hasNextPage) {
    return null;
  }
  for (let i = media.airingSchedule.nodes.length - 1; i >= 0; i--) {
    if (media.airingSchedule.nodes[i].timeUntilAiring < 0) {
      return media.airingSchedule.nodes[i].timeUntilAiring;
    }
  }
  return null;
}

async function sendGetRequest(url: string) {
  const response = await fetch(url, { method: 'GET' });
  return response.json();
}
