import { Client, ClientOptions, SlashCommandBuilder, ChatInputCommandInteraction, Collection } from 'discord.js';

export class DiscordClient extends Client {
  commands: Collection<string, Command>;

  constructor(options: ClientOptions) {
    super(options);
  }
}

export interface Command {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
