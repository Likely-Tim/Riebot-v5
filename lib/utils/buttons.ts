import { StringSelectMenuOptions, ButtonOptions } from '../types/buttons';
import {
  ActionRow,
  ActionRowBuilder,
  APIButtonComponentWithCustomId,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MessageActionRowComponentBuilder,
  MessageActionRowComponent
} from 'discord.js';

const nextButton = new ButtonBuilder().setCustomId('next').setEmoji('➡️').setStyle(ButtonStyle.Secondary);
const prevButton = new ButtonBuilder().setCustomId('prev').setEmoji('⬅️').setStyle(ButtonStyle.Secondary);
const trackButton = new ButtonBuilder().setCustomId('track').setLabel('Track').setStyle(ButtonStyle.Primary);
const artistButton = new ButtonBuilder().setCustomId('artist').setLabel('Artist').setStyle(ButtonStyle.Primary);
const albumButton = new ButtonBuilder().setCustomId('album').setLabel('Album').setStyle(ButtonStyle.Primary);
const shortTermButton = new ButtonBuilder()
  .setCustomId('shortTerm')
  .setLabel('Short Term')
  .setStyle(ButtonStyle.Primary);
const mediumTermButton = new ButtonBuilder()
  .setCustomId('mediumTerm')
  .setLabel('Medium Term')
  .setStyle(ButtonStyle.Primary);
const longTermButton = new ButtonBuilder().setCustomId('longTerm').setLabel('Long Term').setStyle(ButtonStyle.Primary);
const animeShowButton = new ButtonBuilder().setCustomId('show').setLabel('Show').setStyle(ButtonStyle.Primary);
const opAndEdButton = new ButtonBuilder().setCustomId('opAndEd').setLabel('OP & ED').setStyle(ButtonStyle.Primary);
const scoreButton = new ButtonBuilder().setCustomId('score').setLabel('Score').setStyle(ButtonStyle.Primary);
const characterButton = new ButtonBuilder()
  .setCustomId('character')
  .setLabel('Characters')
  .setStyle(ButtonStyle.Secondary);
const vaButton = new ButtonBuilder().setCustomId('va').setLabel('va').setStyle(ButtonStyle.Secondary);

export const buttonsMap = {
  next: nextButton,
  prev: prevButton,
  track: trackButton,
  artist: artistButton,
  album: albumButton,
  shortTerm: shortTermButton,
  mediumTerm: mediumTermButton,
  longTerm: longTermButton,
  animeShow: animeShowButton,
  opAndEd: opAndEdButton,
  score: scoreButton,
  character: characterButton,
  va: vaButton
};

export function convertActionRowToActionRowBuilder(actionRow: ActionRow<MessageActionRowComponent>) {
  const actionRowBuilder = ActionRowBuilder.from(actionRow) as ActionRowBuilder<MessageActionRowComponentBuilder>;
  return actionRowBuilder;
}

export function convertActionRowArrayToActionRowBuilderArray(actionRows: ActionRow<MessageActionRowComponent>[]) {
  const actionRowBuilders: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
  for (const actionRow of actionRows) {
    actionRowBuilders.push(convertActionRowToActionRowBuilder(actionRow));
  }
  return actionRowBuilders;
}

export function createActionRowButtons(buttons: ButtonOptions[]) {
  const components = [];
  for (const button of buttons) {
    if (button.label) {
      components.push(
        buttonsMap[button.name as keyof typeof buttonsMap]
          .setDisabled(button.disabled || false)
          .setLabel(button.label.length > 80 ? button.label.slice(0, 77) + '...' : button.label)
      );
    } else {
      components.push(buttonsMap[button.name as keyof typeof buttonsMap].setDisabled(button.disabled || false));
    }
  }
  return new ActionRowBuilder<ButtonBuilder>().addComponents(components);
}

export function changeButtonLabel(actionRow: ActionRowBuilder<ButtonBuilder>, buttonCustomId: string, label: string) {
  const components = actionRow.components;
  for (let i = 0; i < components.length; i++) {
    if ((components[i].data as APIButtonComponentWithCustomId).custom_id === buttonCustomId) {
      components[i].data.label = label;
      break;
    }
  }
  actionRow.setComponents(components);
  return actionRow;
}

export function disableButton(actionRow: ActionRowBuilder<ButtonBuilder>, buttonCustomId: string) {
  const components = actionRow.components;
  for (let i = 0; i < components.length; i++) {
    if ((components[i].data as APIButtonComponentWithCustomId).custom_id === buttonCustomId) {
      components[i].data.disabled = true;
      break;
    }
  }
  actionRow.setComponents(components);
  return actionRow;
}

export function disableAllButtons(actionRow: ActionRowBuilder<MessageActionRowComponentBuilder>) {
  const components = actionRow.components;
  for (let i = 0; i < components.length; i++) {
    components[i].data.disabled = true;
  }
  actionRow.setComponents(components);
  return actionRow;
}

export function disableAllRows(actionRows: ActionRowBuilder<MessageActionRowComponentBuilder>[]) {
  for (let i = 0; i < actionRows.length; i++) {
    const disabledActionRow = disableAllButtons(actionRows[i]);
    actionRows[i] = disabledActionRow;
  }
  return actionRows;
}

export function enableButton(actionRow: ActionRowBuilder<ButtonBuilder>, buttonCustomId: string) {
  const components = actionRow.components;
  for (let i = 0; i < components.length; i++) {
    if ((components[i].data as APIButtonComponentWithCustomId).custom_id === buttonCustomId) {
      components[i].data.disabled = false;
      break;
    }
  }
  actionRow.setComponents(components);
  return actionRow;
}

export function getSelectActionRow(options: StringSelectMenuOptions[]) {
  const select = new StringSelectMenuBuilder().setCustomId('selectMenu').setPlaceholder('Nothing Selected');
  select.addOptions(options);
  return new ActionRowBuilder().addComponents(select) as ActionRowBuilder<StringSelectMenuBuilder>;
}
