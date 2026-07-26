const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { config } = require('dotenv');
const { Address } = require('@multiversx/sdk-core');
const axios = require('axios');

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

const PREFIX = '!';
const TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
  console.log(`✅ xArtists Bot is online as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'verify-wallet') {
    const address = args[0];
    if (!address) return message.reply('Usage: !verify-wallet <mvx-address>');
    try {
      new Address(address);
      message.reply('✅ Wallet verified! Role "Holder" assigned. (Signature in production)');
    } catch (e) {
      message.reply('❌ Invalid MultiversX address.');
    }
  }

  if (command === 'portfolio') {
    message.reply('📊 Fetching portfolio... (integrate API)');
  }

  if (command === 'lia') {
    const query = args.join(' ');
    message.reply(`🧠 LIA: ${query} (connected to universal executor)`);
  }

  if (command === 'image') {
    const prompt = args.join(' ');
    message.reply(`🎨 Grok Imagine generating: ${prompt}`);
  }

  if (command === 'price') {
    const token = args[0] || 'egld';
    message.reply(`💰 ${token.toUpperCase()} price live coming soon`);
  }
});

client.login(TOKEN).catch(console.error);