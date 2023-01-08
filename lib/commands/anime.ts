import path from 'node:path';
import logger from '../utils/logger';
import Anilist from '../utils/anilist';
import Anithemes from '../utils/anithemes';
import { generateAnimeShowScore } from '../utils/chart';
import { disablePreviousCollector } from '../utils/collector_manager';
import { buildAnimeShow, buildCharacter, buildOpAndEd, buildVa, jsonToEmbed } from '../utils/embeds';
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
  changeButtonLabel,
  disableButton,
  enableButton,
  createActionRowButtons,
  getSelectActionRow,
  convertActionRowToActionRowBuilder
} from '../utils/buttons.js';

import * as dbAnime from '../utils/databases/anime';
import { ButtonOptions } from '../types/buttons';
import { AnilistCharacter, AnilistTrend } from '../types/anilist';

export const data = new SlashCommandBuilder()
  .setName('anime')
  .setDescription('Weeb')
  .addStringOption((option) =>
    option
      .setName('type')
      .setDescription('Type to search')
      .setRequired(true)
      .addChoices(
        { name: 'show', value: 'show' },
        { name: 'character', value: 'character' },
        { name: 'staff', value: 'staff' }
      )
  )
  .addStringOption((option) => option.setName('query').setDescription('What to search').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const type = interaction.options.getString('type');
  const query = interaction.options.getString('query');
  if (!type || !query) {
    return interaction.editReply('Unable to find type or query');
  }
  switch (type) {
    case 'show': {
      const searchResults = await Anilist.searchAnime(query);
      if (!searchResults) {
        await interaction.editReply(`Nothing found`);
        return;
      }
      const selectActionRow = getSelectActionRow(searchResults);
      const messageSent = await interaction.editReply({ components: [selectActionRow] });
      await disablePreviousCollector(`animeShowSelect`, messageSent.channelId, messageSent.id);
      animeShowSelectInteraction(messageSent);
      break;
    }
    case 'character': {
      const searchResults = await Anilist.searchCharacter(query);
      if (!searchResults) {
        await interaction.editReply(`Nothing found`);
        return;
      }
      const selectActionRow = getSelectActionRow(searchResults);
      const messageSent = await interaction.editReply({ components: [selectActionRow] });
      await disablePreviousCollector(`animeCharacterSelect`, messageSent.channelId, messageSent.id);
      animeCharacterSelectInteraction(messageSent);
      break;
    }
    case 'staff': {
      const searchResults = await Anilist.searchStaff(query);
      if (!searchResults) {
        await interaction.editReply(`Nothing found`);
        return;
      }
      const selectActionRow = getSelectActionRow(searchResults);
      const messageSent = await interaction.editReply({ components: [selectActionRow] });
      await disablePreviousCollector(`animeStaffSelect`, messageSent.channelId, messageSent.id);
      animeStaffSelectInteraction(messageSent);
      break;
    }
  }
}

export function animeStaffSelectInteraction(message: Message) {
  logger.info(`[Collector] Anime Select Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
  collector.on('collect', async (selection) => {
    await selection.deferReply();
    const vaId = parseInt(selection.values[0]);
    await dbAnime.set(`animeVaId`, vaId);
    const va = await Anilist.getVa(vaId);
    if (!va) {
      await selection.editReply({ content: `Error getting VA ${vaId}`, embeds: [], components: [] });
      collector.stop();
      return;
    }
    const vaEmbed = buildVa(va);
    const buttons: ButtonOptions[] = [{ name: 'character', disabled: va.characters ? false : true }];
    const messageSent = await selection.editReply({ embeds: [vaEmbed], components: [createActionRowButtons(buttons)] });
    await disablePreviousCollector(`anime`, messageSent.channelId, messageSent.id);
    await dbAnime.set(`type`, `va`);
    animeVaButtonInteraction(messageSent);
  });
}

export function animeCharacterSelectInteraction(message: Message) {
  logger.info(`[Collector] Anime Select Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
  collector.on('collect', async (selection) => {
    await selection.deferReply();
    const characterId = parseInt(selection.values[0]);
    const characterMap = await Anilist.getCharacters([characterId]);
    if (!characterMap) {
      await selection.editReply({ content: `Error getting character ${characterId}`, embeds: [], components: [] });
      collector.stop();
      return;
    }
    const buttons: ButtonOptions[] = [];
    const character = characterMap[characterId];
    if (character.mediaId) {
      await dbAnime.set(`animeShowId`, character.mediaId);
      buttons.push({ name: 'animeShow', disabled: false, label: character.media ? character.media : '???' });
    }
    if (character.vaId) {
      await dbAnime.set(`animeVaId`, character.vaId);
      buttons.push({ name: 'va', disabled: false, label: character.vaName ? character.vaName : '???' });
    }
    const characterEmbed = buildCharacter(character);
    const messageSent = await selection.editReply({
      embeds: [characterEmbed],
      components: [createActionRowButtons(buttons)]
    });
    await disablePreviousCollector(`anime`, messageSent.channelId, messageSent.id);
    await dbAnime.set(`type`, `character`);
    animeCharacterButtonInteraction(messageSent);
  });
}

export function animeShowSelectInteraction(message: Message) {
  logger.info(`[Collector] Anime Select Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
  collector.on('collect', async (selection) => {
    await selection.deferReply();
    const showId = parseInt(selection.values[0]);
    await dbAnime.set('animeShowId', showId);
    const show = await Anilist.getAnime(showId);
    if (!show) {
      await selection.editReply({ content: `Error getting show ${showId}`, embeds: [], components: [] });
      collector.stop();
      return;
    }
    const showEmbed = buildAnimeShow(show);
    await dbAnime.set('animeShow', showEmbed.toJSON());
    const buttons: ButtonOptions[] = [];
    buttons.push({ name: 'animeShow', disabled: true, label: show.title });
    const themes = await Anithemes.searchByAnilistId(showId);
    if (themes && themes.length !== 0) {
      const opAndEdEmbed = buildOpAndEd(themes, show.title, show.url, show.coverImage);
      await dbAnime.set('opAndEd', opAndEdEmbed.toJSON());
      buttons.push({ name: 'opAndEd', disabled: false });
    } else {
      buttons.push({ name: 'opAndEd', disabled: true });
    }
    const trend = await Anilist.getShowTrend(showId);
    if (trend && trend.length !== 0) {
      generateTrendChart(trend);
      buttons.push({ name: 'score', disabled: false });
    } else {
      buttons.push({ name: 'score', disabled: true });
    }
    if (show.haveMain) {
      buttons.push({ name: 'character', disabled: false });
    } else {
      buttons.push({ name: 'character', disabled: true });
    }
    await dbAnime.set('display', 'show');
    const messageSent = await selection.editReply({
      embeds: [showEmbed],
      components: [createActionRowButtons(buttons)]
    });
    await disablePreviousCollector(`anime`, messageSent.channelId, messageSent.id);
    await dbAnime.set(`type`, `show`);
    animeShowButtonInteraction(messageSent);
  });
}

export function animeShowButtonInteraction(message: Message) {
  logger.info(`[Collector] Anime Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button });
  collector.on('collect', async (press) => {
    await press.deferUpdate();
    switch (press.customId) {
      case 'show': {
        const display = (await dbAnime.get('display')) as string;
        await dbAnime.set('display', 'show');
        const oldActionRow = press.message.components[0] as ActionRow<ButtonComponent>;
        let actionRow = convertActionRowToActionRowBuilder(oldActionRow) as ActionRowBuilder<ButtonBuilder>;
        actionRow = disableButton(actionRow, 'show');
        actionRow = enableButton(actionRow, display);
        const showEmbed = jsonToEmbed((await dbAnime.get('animeShow')) as Object);
        press.editReply({ components: [actionRow], embeds: [showEmbed], files: [] });
        break;
      }
      case 'opAndEd': {
        const display = (await dbAnime.get('display')) as string;
        await dbAnime.set('display', 'opAndEd');
        const oldActionRow = press.message.components[0] as ActionRow<ButtonComponent>;
        let actionRow = convertActionRowToActionRowBuilder(oldActionRow) as ActionRowBuilder<ButtonBuilder>;
        actionRow = disableButton(actionRow, 'opAndEd');
        actionRow = enableButton(actionRow, display);
        const opAndEdEmbed = jsonToEmbed((await dbAnime.get('opAndEd')) as Object);
        press.editReply({ components: [actionRow], embeds: [opAndEdEmbed], files: [] });
        break;
      }
      case 'score': {
        const display = (await dbAnime.get('display')) as string;
        await dbAnime.set('display', 'score');
        const oldActionRow = press.message.components[0] as ActionRow<ButtonComponent>;
        let actionRow = convertActionRowToActionRowBuilder(oldActionRow) as ActionRowBuilder<ButtonBuilder>;
        actionRow = disableButton(actionRow, 'score');
        actionRow = enableButton(actionRow, display);
        press.editReply({
          components: [actionRow],
          embeds: [],
          files: [path.join(__dirname, '../../media/animeShowScore.png')]
        });
        break;
      }
      case 'character': {
        const showId = await dbAnime.get('animeShowId');
        const characters = await Anilist.getShowCharacters(parseInt(showId as string));
        if (!characters) {
          await press.editReply({ content: `Error getting show characters ${showId}`, embeds: [], components: [] });
          collector.stop();
          return;
        }
        await dbAnime.set('characterIndex', 0);
        await dbAnime.set('characterLength', characters.length);
        for (let i = 1; i < characters.length; i++) {
          await dbAnime.set(`character${i}`, characters[i]);
        }
        const va = await Anilist.getCharacterVa(characters[0].id);
        if (va) {
          characters[0].vaId = va.id;
          characters[0].vaName = va.name;
        } else {
          characters[0].vaId = 'N/A';
          characters[0].vaName = 'N/A';
        }
        await dbAnime.set(`character0`, characters[0]);
        await dbAnime.set(`animeVaId`, characters[0].vaId);
        const characterEmbed = buildCharacter(characters[0]);
        const buttons: ButtonOptions[] = [];
        buttons.push({ name: 'animeShow', label: characters[0].media || '???', disabled: false });
        if (characters[0].vaName === 'N/A' || characters[0].vaId === 'N/A') {
          buttons.push({ name: 'va', label: characters[0].vaName, disabled: true });
        } else {
          buttons.push({ name: 'va', label: characters[0].vaName, disabled: false });
        }
        buttons.push({ name: 'prev', disabled: true });
        if (characters.length > 1) {
          buttons.push({ name: 'next', disabled: false });
        } else {
          buttons.push({ name: 'next', disabled: true });
        }
        collector.stop();
        await press.editReply({ embeds: [characterEmbed], components: [createActionRowButtons(buttons)], files: [] });
        await dbAnime.set(`type`, `character`);
        animeCharacterButtonInteraction(message);
        break;
      }
    }
  });
}

export function animeVaButtonInteraction(message: Message) {
  logger.info(`[Collector] Anime Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button });
  collector.on('collect', async (press) => {
    await press.deferUpdate();
    switch (press.customId) {
      case 'character': {
        const vaId = await dbAnime.get(`animeVaId`);
        let characters = await Anilist.getVaCharacters(parseInt(vaId as string));
        if (!characters) {
          press.editReply({ content: `Error getting va characters ${vaId}`, embeds: [], components: [] });
          collector.stop();
          return;
        }
        await dbAnime.set('characterIndex', 0);
        await dbAnime.set('characterLength', characters.length);
        const characterIds = [];
        for (const character of characters) {
          characterIds.push(character.id);
        }
        const characterMap = await Anilist.getCharacters(characterIds);
        if (!characterMap) {
          press.editReply({ content: `Error getting characters ${characterIds}`, embeds: [], components: [] });
          collector.stop();
          return;
        }
        const charactersObjects: AnilistCharacter[] = [];
        for (const characterId of characterIds) {
          charactersObjects.push(characterMap[characterId as keyof typeof characterMap]);
        }
        for (let i = 0; i < charactersObjects.length; i++) {
          await dbAnime.set(`character${i}`, charactersObjects[i]);
        }

        await dbAnime.set(`animeVaId`, charactersObjects[0].vaId!);
        await dbAnime.set(`animeShowId`, charactersObjects[0].mediaId!);
        const characterEmbed = buildCharacter(charactersObjects[0]);
        const buttons: ButtonOptions[] = [];
        buttons.push({ name: 'animeShow', label: charactersObjects[0].media || '???', disabled: false });
        if (charactersObjects[0].vaName === 'N/A' || charactersObjects[0].vaId === 'N/A') {
          buttons.push({ name: 'va', label: charactersObjects[0].vaName || '???', disabled: true });
        } else {
          buttons.push({ name: 'va', label: charactersObjects[0].vaName || '???', disabled: false });
        }
        buttons.push({ name: 'prev', disabled: true });
        if (charactersObjects.length > 1) {
          buttons.push({ name: 'next', disabled: false });
        } else {
          buttons.push({ name: 'next', disabled: true });
        }
        collector.stop();
        await press.editReply({ embeds: [characterEmbed], components: [createActionRowButtons(buttons)], files: [] });
        await dbAnime.set(`type`, `character`);
        animeCharacterButtonInteraction(message);
      }
    }
  });
}

export function animeCharacterButtonInteraction(message: Message) {
  logger.info(`[Collector] Anime Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button });
  collector.on('collect', async (press) => {
    await press.deferUpdate();
    switch (press.customId) {
      case 'show': {
        const showId = parseInt((await dbAnime.get('animeShowId')) as string);
        const show = await Anilist.getAnime(showId);
        if (!show) {
          press.editReply({ content: `Error getting show ${showId}`, embeds: [], components: [] });
          collector.stop();
          return;
        }
        const showEmbed = buildAnimeShow(show);
        await dbAnime.set('animeShow', showEmbed);
        const themes = await Anithemes.searchByAnilistId(showId);
        const trend = await Anilist.getShowTrend(showId);
        const buttons: ButtonOptions[] = [];
        buttons.push({ name: 'animeShow', disabled: true, label: show.title });
        if (themes && themes.length !== 0) {
          const opAndEdEmbed = buildOpAndEd(themes, show.title, show.url, show.coverImage);
          await dbAnime.set('opAndEd', opAndEdEmbed);
          buttons.push({ name: 'opAndEd', disabled: false });
        } else {
          buttons.push({ name: 'opAndEd', disabled: true });
        }
        if (trend && trend.length !== 0) {
          generateTrendChart(trend);
          buttons.push({ name: 'score', disabled: false });
        } else {
          buttons.push({ name: 'score', disabled: true });
        }
        if (show.haveMain) {
          buttons.push({ name: 'character', disabled: false });
        } else {
          buttons.push({ name: 'character', disabled: true });
        }
        await dbAnime.set('display', 'show');
        collector.stop();
        await press.editReply({ embeds: [showEmbed], components: [createActionRowButtons(buttons)], files: [] });
        await dbAnime.set(`type`, `show`);
        animeShowButtonInteraction(message);
        break;
      }
      case 'va': {
        const vaId = parseInt((await dbAnime.get(`animeVaId`)) as string);
        const va = await Anilist.getVa(vaId);
        if (!va) {
          press.editReply({ content: `Error getting va ${vaId}`, embeds: [], components: [] });
          collector.stop();
          return;
        }
        const vaEmbed = buildVa(va);
        const buttons: ButtonOptions[] = [];
        if (va.characters) {
          buttons.push({ name: 'character', disabled: false });
        } else {
          buttons.push({ name: 'character', disabled: true });
        }
        collector.stop();
        await press.editReply({ embeds: [vaEmbed], components: [createActionRowButtons(buttons)], files: [] });
        await dbAnime.set(`type`, `va`);
        animeVaButtonInteraction(message);
        break;
      }
      case 'prev': {
        let index = parseInt((await dbAnime.get('characterIndex')) as string);
        const length = parseInt((await dbAnime.get('characterLength')) as string);
        index--;
        const character = (await dbAnime.get(`character${index}`)) as AnilistCharacter;
        if (!character.vaId) {
          const va = await Anilist.getCharacterVa(character.id);
          if (va) {
            character.vaId = va.id;
            character.vaName = va.name;
          } else {
            character.vaId = 'N/A';
            character.vaName = 'N/A';
          }
        }
        await dbAnime.set(`character${index}`, character);
        await dbAnime.set(`animeShowId`, character.mediaId!);
        await dbAnime.set(`animeVaId`, character.vaId);
        const characterEmbed = buildCharacter(character);
        const oldActionRow = press.message.components[0] as ActionRow<ButtonComponent>;
        let actionRow = convertActionRowToActionRowBuilder(oldActionRow) as ActionRowBuilder<ButtonBuilder>;
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        }
        if (index + 2 === length) {
          actionRow = enableButton(actionRow, 'next');
        }
        if (character.vaId === 'N/A' || character.vaName === 'N/A') {
          actionRow = disableButton(actionRow, 'va');
        } else {
          actionRow = enableButton(actionRow, 'va');
        }
        actionRow = changeButtonLabel(actionRow, 'show', character.media!);
        actionRow = changeButtonLabel(actionRow, 'va', character.vaName!);
        await press.editReply({ embeds: [characterEmbed], components: [actionRow], files: [] });
        await dbAnime.set(`characterIndex`, index);
        break;
      }
      case 'next': {
        let index = parseInt((await dbAnime.get('characterIndex')) as string);
        const length = parseInt((await dbAnime.get('characterLength')) as string);
        index++;
        const character = (await dbAnime.get(`character${index}`)) as AnilistCharacter;
        if (!character.vaId) {
          const va = await Anilist.getCharacterVa(character.id);
          if (va) {
            character.vaId = va.id;
            character.vaName = va.name;
          } else {
            character.vaId = 'N/A';
            character.vaName = 'N/A';
          }
        }
        await dbAnime.set(`character${index}`, character);
        await dbAnime.set(`animeShowId`, character.mediaId!);
        await dbAnime.set(`animeVaId`, character.vaId);
        const characterEmbed = buildCharacter(character);
        const oldActionRow = press.message.components[0] as ActionRow<ButtonComponent>;
        let actionRow = convertActionRowToActionRowBuilder(oldActionRow) as ActionRowBuilder<ButtonBuilder>;
        if (index === 1) {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === length) {
          actionRow = disableButton(actionRow, 'next');
        }
        if (character.vaId === 'N/A' || character.vaName === 'N/A') {
          actionRow = disableButton(actionRow, 'va');
        } else {
          actionRow = enableButton(actionRow, 'va');
        }
        actionRow = changeButtonLabel(actionRow, 'show', character.media!);
        actionRow = changeButtonLabel(actionRow, 'va', character.vaName!);
        await press.editReply({ embeds: [characterEmbed], components: [actionRow], files: [] });
        await dbAnime.set(`characterIndex`, index);
        break;
      }
    }
  });
}

async function generateTrendChart(trend: AnilistTrend[]) {
  const labels = [];
  const data = [];
  const cleanedDataPoints: { [key: number]: number } = {};
  for (const point of trend) {
    cleanedDataPoints[point.episode] = point.score;
  }
  for (const point in cleanedDataPoints) {
    labels.push(point);
    data.push(cleanedDataPoints[point]);
  }
  await generateAnimeShowScore(labels, data);
}
