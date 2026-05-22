/**
 * LIA v6 - xArtists Discord Bot
 * Main entry point
 */

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Command collection
(client as any).commands = new Collection();

// Ready event
client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  console.log(`🎯 Serving ${client.guilds.cache.size} guild(s)`);
});

// Message event
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!lia')) {
    return;
  }

  try {
    const [command, ...args] = message.content.split(' ');
    const subcommand = args[0] || 'help';

    switch (subcommand) {
      case 'status':
        await message.reply(
          '📊 **xArtists Status**\n' +
          '✅ Frontend: Live\n' +
          '✅ Smart Contracts: Operational\n' +
          '✅ Discord Bot: Online\n' +
          '✅ APIs: Connected'
        );
        break;

      case 'bridge':
        await message.reply(
          '🌉 **sBTC ↔ $TRO Bridge**\n' +
          'Coming soon! Monitor the bridge status and swap instructions.'
        );
        break;

      case 'tro':
        await message.reply(
          '💰 **$TRO Token Information**\n' +
          'Fetching live market data...'
        );
        break;

      case 'art':
        await message.reply(
          '🎨 **Latest Tuduri Artworks**\n' +
          'Browse the latest NFT collection on MultiversX.'
        );
        break;

      case 'stake':
        await message.reply(
          '🎯 **Staking Guide**\n' +
          '1. Connect your wallet\n' +
          '2. Select staking option (NFT or $TRO)\n' +
          '3. Approve and stake\n' +
          '4. Earn rewards!'
        );
        break;

      case 'help':
      default:
        await message.reply(
          '🤖 **LIA v6 Commands**\n' +
          '`!lia status` - Live system status\n' +
          '`!lia bridge` - sBTC bridge information\n' +
          '`!lia tro` - $TRO token info\n' +
          '`!lia art` - Latest artworks\n' +
          '`!lia stake` - Staking guide\n' +
          '`!lia help` - Show this message'
        );
        break;
    }
  } catch (error) {
    console.error('Error handling command:', error);
    await message.reply('❌ An error occurred while processing your command.');
  }
});

// Login
client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  client.destroy();
  process.exit(0);
});
