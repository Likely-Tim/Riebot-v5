import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Weather from '../utils/weather';
import { buildBasicEmbed, buildWeather } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('weather')
  .setDescription('What is the weather?')
  .addStringOption((option) => option.setName('location').setDescription('Where').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const location = interaction.options.getString('location');
  if (!location) {
    return interaction.editReply('Error getting location');
  }
  const response = await Weather.sendGetRequestWeather(location);
  if (response) {
    const embed = buildWeather(response);
    interaction.editReply({ embeds: [embed] });
  } else {
    const embed = buildBasicEmbed(`Could not find ${location}`);
    interaction.editReply({ embeds: [embed] });
  }
}
