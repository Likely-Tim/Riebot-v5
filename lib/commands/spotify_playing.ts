import Spotify from '../utils/spotify.js';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

const BASE_URL = process.env.BASE_URL;

export const data = new SlashCommandBuilder().setName('spotify-playing').setDescription('What is currently playing?');

export async function execute(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const accessToken = await Spotify.getAccessToken(userId);
  if (accessToken) {
    await interaction.deferReply({ ephemeral: false });
  } else {
    await interaction.reply({ content: `${BASE_URL}auth/discord?task=spotify`, ephemeral: true });
    return;
  }
  const track = await Spotify.currentlyPlaying(userId, false, accessToken);
  if (track) {
    await interaction.editReply(track);
  } else {
    await interaction.editReply('Spotify Url Not Found');
  }
}
