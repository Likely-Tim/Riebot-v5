import Spotify from '../utils/spotify';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

const BASE_URL = process.env.BASE_URL;

export const data = new SlashCommandBuilder().setName('spotify-playing').setDescription('What is currently playing?');

export async function execute(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  if (await Spotify.checkAccessToken(userId)) {
    await interaction.deferReply({ ephemeral: false });
  } else {
    await interaction.reply({ content: `${BASE_URL}auth/discord?task=spotify`, ephemeral: true });
    return;
  }
  const track = await Spotify.currentlyPlaying(userId, false);
  if (track) {
    await interaction.editReply(track);
  } else {
    await interaction.editReply('Spotify Url Not Found');
  }
}
