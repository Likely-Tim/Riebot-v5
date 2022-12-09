import * as fs from 'node:fs';
import * as path from 'node:path';
import logger from './utils/logger.js';
import { refreshSlashCommands } from './slash_refresh.js';
import * as types from './types';
import { Collection, Events, GatewayIntentBits } from 'discord.js';

const DISCORD_CLIENT = process.env.DISCORD_TOKEN;

const discordClient = new types.DiscordClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

discordClient.once(Events.ClientReady, async (client) => {
  console.log(`Discord Client Ready! Logged in as ${client.user.tag}`);
  await startup();
});

discordClient.on(Events.InteractionCreate, async (interaction) => {
  // Not Slash Command
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = discordClient.commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply(`No command matching ${interaction.commandName} was found.`);
  } else {
    try {
      logger.info(`[Command] Executing ${interaction.commandName}`);
      await command.execute(interaction);
      logger.info(`[Command] Executed ${interaction.commandName} successfully`);
    } catch (error) {
      logger.error(error);
      logger.error(`[Command] Error Executing ${interaction.commandName}`);
      await interaction.editReply('There was an error while executing this command!');
    }
  }
});

async function startup() {
  await refreshSlashCommands();

  discordClient.commands = new Collection();
  const commandsPath = path.join(__dirname, './commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    let command: types.Command = require(filePath);
    discordClient.commands.set(command.data.name, command);
  }
}

discordClient.login(DISCORD_CLIENT);
