import client from '../index';
import logger from './logger';
import { TextChannel } from 'discord.js';
import { convertActionRowArrayToActionRowBuilderArray, disableAllRows } from './buttons';

// Interactions
import { spotifyButtonInteraction } from '../commands/spotify';
import { spotifyTopButtonInteraction } from '../commands/spotify_top';
import {
  animeShowSelectInteraction,
  animeCharacterSelectInteraction,
  animeStaffSelectInteraction,
  animeShowButtonInteraction,
  animeCharacterButtonInteraction,
  animeVaButtonInteraction
} from '../commands/anime.js';

import * as dbAnime from './databases/anime';
import * as dbMessages from './databases/messages';

const COMMAND_WITH_COLLECTORS = [
  'spotify',
  'spotify-top',
  'animeShowSelect',
  'animeStaffSelect',
  'animeCharacterSelect',
  'anime'
];
const COMMAND_MAP = {
  spotify: spotifyButtonInteraction,
  'spotify-top': spotifyTopButtonInteraction,
  animeShowSelect: animeShowSelectInteraction,
  animeStaffSelect: animeStaffSelectInteraction,
  animeCharacterSelect: animeCharacterSelectInteraction,
  animeShow: animeShowButtonInteraction,
  animeVa: animeVaButtonInteraction,
  animeCharacter: animeCharacterButtonInteraction
};

export async function disablePreviousCollector(commandName: string, newChannelId: string, newMessageId: string) {
  try {
    const oldChannelId = await dbMessages.get(`${commandName}ChannelId`);
    const oldMessageId = await dbMessages.get(`${commandName}MessageId`);
    const oldChannel = (await client.channels.fetch(oldChannelId)) as TextChannel;
    const oldMessage = await oldChannel!.messages.fetch(oldMessageId);
    const components = oldMessage.components;
    let actionRow = convertActionRowArrayToActionRowBuilderArray(components);
    actionRow = disableAllRows(actionRow);
    oldMessage.edit({ components: actionRow });
  } catch (error) {
    logger.warn(
      `[Collector Manager] Could not find/disable previous collector for ${commandName} with error: ${error}`
    );
  } finally {
    await dbMessages.set(`${commandName}ChannelId`, newChannelId);
    await dbMessages.set(`${commandName}MessageId`, newMessageId);
  }
}

export async function reinitializeCollectors() {
  for (const commandName of COMMAND_WITH_COLLECTORS) {
    try {
      logger.info(`[Collector Manager] Trying to reinitialize for command ${commandName}`);
      const oldChannelId = await dbMessages.get(`${commandName}ChannelId`);
      const oldMessageId = await dbMessages.get(`${commandName}MessageId`);
      const oldChannel = (await client.channels.fetch(oldChannelId)) as TextChannel;
      const oldMessage = await oldChannel!.messages.fetch(oldMessageId);
      if (commandName === 'anime') {
        const type = (await dbAnime.get('type')) as string;
        COMMAND_MAP[`${commandName}${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof COMMAND_MAP](
          oldMessage
        );
      } else {
        COMMAND_MAP[commandName as keyof typeof COMMAND_MAP](oldMessage);
      }
      logger.info(`[Collector Manager] Reinitialized for command ${commandName}`);
    } catch (error) {
      logger.warn(`[Collector Manager] Failed to reinitialize for command ${commandName} with error: ${error}`);
    }
  }
}
