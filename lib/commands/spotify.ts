import Spotify from '../utils/spotify';
import logger from '../utils/logger';
import { SpotifySearchResponse } from '../types';
import { disablePreviousCollector } from '../utils/collector_manager';
import {
  SlashCommandBuilder,
  ComponentType,
  ChatInputCommandInteraction,
  Message,
  ActionRow,
  ButtonComponent,
  ActionRowBuilder,
  ButtonBuilder
} from 'discord.js';
import {
  createActionRowButtons,
  disableButton,
  enableButton,
  ButtonOptions,
  convertActionRowToActionRowBuilder
} from '../utils/buttons';

import * as dbSpotify from '../utils/databases/spotify';

const BASE_URL = process.env.BASE_URL;

export const data = new SlashCommandBuilder()
  .setName('spotify')
  .setDescription('Search Spotify')
  .addStringOption((option) => option.setName('query').setDescription('What to search').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (await Spotify.checkAccessToken('general')) {
    await interaction.deferReply({ ephemeral: false });
  } else {
    await interaction.reply({ content: `Error with general spotify token\n${BASE_URL}auth/spotify`, ephemeral: true });
    return;
  }
  const query = interaction.options.getString('query');
  if (!query) {
    await interaction.editReply(`Unable to find query`);
    return;
  }
  const response = await Spotify.search(query);
  const messageContent = await determineMessage(response);
  await setDatabase(response);
  const messageSent = await interaction.editReply(messageContent);
  await disablePreviousCollector(interaction.commandName, messageSent.channelId, messageSent.id);
  spotifyButtonInteraction(messageSent);
}

export function spotifyButtonInteraction(message: Message) {
  logger.info(`[Collector] Spotify Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button });
  collector.on('collect', async (press) => {
    switch (press.customId) {
      case 'next': {
        const displayType = await dbSpotify.get(`displayType`);
        let index = parseInt(await dbSpotify.get(`${displayType}Index`));
        const length = parseInt(await dbSpotify.get(`${displayType}Length`));
        index++;
        const content = await dbSpotify.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0] as ActionRow<ButtonComponent>;
        let actionRow = convertActionRowToActionRowBuilder(oldActionRow) as ActionRowBuilder<ButtonBuilder>;
        if (index === 1) {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === length) {
          actionRow = disableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        await dbSpotify.set(`${displayType}Index`, index);
        break;
      }
      case 'prev': {
        const displayType = await dbSpotify.get(`displayType`);
        let index = parseInt(await dbSpotify.get(`${displayType}Index`));
        const length = parseInt(await dbSpotify.get(`${displayType}Length`));
        index--;
        const content = await dbSpotify.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0] as ActionRow<ButtonComponent>;
        let actionRow = convertActionRowToActionRowBuilder(oldActionRow) as ActionRowBuilder<ButtonBuilder>;
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        }
        if (index + 2 === length) {
          actionRow = enableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        await dbSpotify.set(`${displayType}Index`, index);
        break;
      }
      case 'track': {
        const displayType = 'tracks';
        await dbSpotify.set(`displayType`, displayType);
        let index = parseInt(await dbSpotify.get(`${displayType}Index`));
        const trackLength = parseInt(await dbSpotify.get(`tracksLength`));
        const artistLength = parseInt(await dbSpotify.get(`artistsLength`));
        const albumLength = parseInt(await dbSpotify.get(`albumsLength`));
        const content = await dbSpotify.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0] as ActionRow<ButtonComponent>;
        let actionRow = convertActionRowToActionRowBuilder(oldActionRow) as ActionRowBuilder<ButtonBuilder>;
        actionRow = disableButton(actionRow, 'track');
        if (artistLength === 0) {
          actionRow = disableButton(actionRow, 'artist');
        } else {
          actionRow = enableButton(actionRow, 'artist');
        }
        if (albumLength === 0) {
          actionRow = disableButton(actionRow, 'album');
        } else {
          actionRow = enableButton(actionRow, 'album');
        }
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        } else {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === trackLength) {
          actionRow = disableButton(actionRow, 'next');
        } else {
          actionRow = enableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        break;
      }
      case 'artist': {
        const displayType = 'artists';
        await dbSpotify.set(`displayType`, displayType);
        let index = parseInt(await dbSpotify.get(`${displayType}Index`));
        const trackLength = parseInt(await dbSpotify.get(`tracksLength`));
        const artistLength = parseInt(await dbSpotify.get(`artistsLength`));
        const albumLength = parseInt(await dbSpotify.get(`albumsLength`));
        const content = await dbSpotify.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0] as ActionRow<ButtonComponent>;
        let actionRow = convertActionRowToActionRowBuilder(oldActionRow) as ActionRowBuilder<ButtonBuilder>;
        actionRow = disableButton(actionRow, 'artist');
        if (trackLength === 0) {
          actionRow = disableButton(actionRow, 'track');
        } else {
          actionRow = enableButton(actionRow, 'track');
        }
        if (albumLength === 0) {
          actionRow = disableButton(actionRow, 'album');
        } else {
          actionRow = enableButton(actionRow, 'album');
        }
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        } else {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === artistLength) {
          actionRow = disableButton(actionRow, 'next');
        } else {
          actionRow = enableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        break;
      }
      case 'album': {
        const displayType = 'albums';
        await dbSpotify.set(`displayType`, displayType);
        let index = parseInt(await dbSpotify.get(`${displayType}Index`));
        const trackLength = parseInt(await dbSpotify.get(`tracksLength`));
        const artistLength = parseInt(await dbSpotify.get(`artistsLength`));
        const albumLength = parseInt(await dbSpotify.get(`albumsLength`));
        const content = await dbSpotify.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0] as ActionRow<ButtonComponent>;
        let actionRow = convertActionRowToActionRowBuilder(oldActionRow) as ActionRowBuilder<ButtonBuilder>;
        actionRow = disableButton(actionRow, 'album');
        if (trackLength === 0) {
          actionRow = disableButton(actionRow, 'track');
        } else {
          actionRow = enableButton(actionRow, 'track');
        }
        if (artistLength === 0) {
          actionRow = disableButton(actionRow, 'artist');
        } else {
          actionRow = enableButton(actionRow, 'artist');
        }
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        } else {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === albumLength) {
          actionRow = disableButton(actionRow, 'next');
        } else {
          actionRow = enableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        break;
      }
    }
  });
}

async function setDatabase(items: SpotifySearchResponse) {
  await dbSpotify.set('tracksLength', items.tracks.length);
  await dbSpotify.set('artistsLength', items.artists.length);
  await dbSpotify.set('albumsLength', items.albums.length);
  await dbSpotify.set('tracksIndex', 0);
  await dbSpotify.set('artistsIndex', 0);
  await dbSpotify.set('albumsIndex', 0);
  for (const type in items) {
    const objects = items[type as keyof typeof items];
    for (let i = 0; i < objects.length; i++) {
      await dbSpotify.set(`${type}${i}`, objects[i].spotifyUrl);
    }
  }
}

async function determineMessage(items: SpotifySearchResponse) {
  let displayType = '';
  let message = 'Search came up with nothing.';
  const trackLength = items.tracks.length;
  const artistLength = items.artists.length;
  const albumLength = items.albums.length;
  const buttons: ButtonOptions[] = [];
  let isNextButtonDisabled = false;
  if (trackLength === 0) {
    buttons.push({ name: 'track', disabled: true });
  } else if (trackLength === 1) {
    buttons.push({ name: 'track', disabled: true });
    isNextButtonDisabled = true;
    message = items.tracks[0].spotifyUrl;
    displayType = 'tracks';
  } else {
    buttons.push({ name: 'track', disabled: true });
    isNextButtonDisabled = false;
    message = items.tracks[0].spotifyUrl;
    displayType = 'tracks';
  }
  if (artistLength === 0) {
    buttons.push({ name: 'artist', disabled: true });
  } else if (!displayType) {
    if (artistLength === 1) {
      buttons.push({ name: 'artist', disabled: true });
      isNextButtonDisabled = true;
      message = items.artists[0].spotifyUrl;
      displayType = 'artists';
    } else {
      buttons.push({ name: 'artist', disabled: true });
      isNextButtonDisabled = false;
      message = items.artists[0].spotifyUrl;
      displayType = 'artists';
    }
  } else {
    buttons.push({ name: 'artist', disabled: false });
  }
  if (albumLength === 0) {
    buttons.push({ name: 'album', disabled: true });
  } else if (!displayType) {
    if (albumLength === 1) {
      buttons.push({ name: 'album', disabled: true });
      isNextButtonDisabled = true;
      message = items.albums[0].spotifyUrl;
      displayType = 'albums';
    } else {
      buttons.push({ name: 'album', disabled: true });
      isNextButtonDisabled = false;
      message = items.albums[0].spotifyUrl;
      displayType = 'albums';
    }
  } else {
    buttons.push({ name: 'album', disabled: false });
  }
  await dbSpotify.set(`displayType`, displayType);
  buttons.push({ name: 'prev', disabled: true });
  buttons.push({ name: 'next', disabled: isNextButtonDisabled });
  return { content: message, components: [createActionRowButtons(buttons)] };
}
