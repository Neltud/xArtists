/**
 * xArtists Discord bot — autorole on join + wallet verify (format) + LIA stubs.
 * Env: DISCORD_TOKEN, ROLE_MEMBER_ID, ROLE_HOLDER_ID, ROLE_VERIFIED_ID, AUTO_ROLE_ON_JOIN
 */
const { Client, GatewayIntentBits, EmbedBuilder, Partials } = require('discord.js');
const { config } = require('dotenv');

config();

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = '!';
const AUTO_ROLE_ON_JOIN = (process.env.AUTO_ROLE_ON_JOIN || 'true').toLowerCase() === 'true';
const ROLE_MEMBER_ID = process.env.ROLE_MEMBER_ID || '';
const ROLE_VERIFIED_ID = process.env.ROLE_VERIFIED_ID || '';
const ROLE_HOLDER_ID = process.env.ROLE_HOLDER_ID || '';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.GuildMember],
});

function isErdAddress(s) {
  return typeof s === 'string' && /^erd1[a-z0-9]{58}$/i.test(s.trim());
}

async function safeAddRole(member, roleId, label) {
  if (!roleId) return { ok: false, reason: 'role id missing' };
  try {
    const role = await member.guild.roles.fetch(roleId).catch(() => null);
    if (!role) return { ok: false, reason: `role ${label} not found` };
    if (member.roles.cache.has(role.id)) return { ok: true, reason: 'already' };
    await member.roles.add(role);
    return { ok: true, reason: 'added' };
  } catch (e) {
    console.error(`roles.add ${label}:`, e.message);
    return { ok: false, reason: e.message };
  }
}

client.once('ready', () => {
  console.log(`✅ xArtists Bot online as ${client.user.tag}`);
  console.log(
    `   AUTO_ROLE_ON_JOIN=${AUTO_ROLE_ON_JOIN} MEMBER=${ROLE_MEMBER_ID || '—'} HOLDER=${ROLE_HOLDER_ID || '—'}`
  );
});

client.on('guildMemberAdd', async member => {
  if (!AUTO_ROLE_ON_JOIN) return;
  if (GUILD_ID && member.guild.id !== GUILD_ID) return;

  const r = await safeAddRole(member, ROLE_MEMBER_ID, 'Member');
  if (r.ok && r.reason === 'added') {
    console.log(`Auto-role Member → ${member.user.tag}`);
  } else if (!r.ok) {
    console.warn(`Auto-role failed for ${member.user.tag}: ${r.reason}`);
  }

  // Optional: also give Verified on join (or reserve for reaction gate)
  if (process.env.AUTO_VERIFIED_ON_JOIN === 'true') {
    await safeAddRole(member, ROLE_VERIFIED_ID, 'Verified');
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'roles') {
    const embed = new EmbedBuilder()
      .setTitle('xArtists — rôles auto')
      .setColor(0x8b5cf6)
      .setDescription(
        [
          `Auto join Member: **${AUTO_ROLE_ON_JOIN ? 'ON' : 'OFF'}**`,
          `ROLE_MEMBER_ID: \`${ROLE_MEMBER_ID || 'non défini'}\``,
          `ROLE_VERIFIED_ID: \`${ROLE_VERIFIED_ID || 'non défini'}\``,
          `ROLE_HOLDER_ID: \`${ROLE_HOLDER_ID || 'non défini'}\``,
          '',
          'Guide: `docs/DISCORD_AUTO_ROLES.md`',
          'Invite: https://discord.gg/QkJgzeyWG',
        ].join('\n')
      );
    return message.reply({ embeds: [embed] });
  }

  if (command === 'verify-wallet') {
    const address = (args[0] || '').trim();
    if (!address) {
      return message.reply('Usage: `!verify-wallet erd1...`');
    }
    if (!isErdAddress(address)) {
      return message.reply('❌ Adresse MultiversX invalide (attendu: `erd1` + 58 chars).');
    }

    const member = message.member;
    if (!member) {
      return message.reply('Commande à utiliser **sur le serveur**, pas en MP.');
    }

    const holder = await safeAddRole(member, ROLE_HOLDER_ID, 'Holder');
    const verified = await safeAddRole(member, ROLE_VERIFIED_ID || ROLE_MEMBER_ID, 'Verified');

    if (holder.ok || verified.ok) {
      return message.reply(
        `✅ Wallet \`${address.slice(0, 12)}…\` accepté (format).\n` +
          `Holder: ${holder.reason} · base: ${verified.reason}\n` +
          `_Preuve signature on-chain = phase 2._`
      );
    }
    return message.reply(
      `⚠️ Adresse OK mais rôle non assigné (${holder.reason}). Vérifie ROLE_*_ID et la hiérarchie du bot.`
    );
  }

  if (command === 'portfolio') {
    return message.reply('📊 Portfolio on-chain — brancher API MultiversX (à venir).');
  }

  if (command === 'lia') {
    const sub = (args[0] || 'help').toLowerCase();
    if (sub === 'help' || !args.length) {
      return message.reply(
        [
          '**LIA / xArtists**',
          '`!lia help` — aide',
          '`!verify-wallet erd1…` — rôle Holder (format)',
          '`!roles` — config autorole',
          '`!price [token]` — prix (stub)',
          'DApp: https://neltud.github.io/xArtists/',
        ].join('\n')
      );
    }
    const query = args.join(' ');
    return message.reply(`🧠 LIA (paper): _${query}_ — exécution live hors Discord.`);
  }

  if (command === 'price') {
    const token = (args[0] || 'TRO').toUpperCase();
    return message.reply(`💰 ${token} — brancher oracle / xExchange (stub).`);
  }
});

if (!TOKEN) {
  console.error('Missing DISCORD_TOKEN');
  process.exit(1);
}

client.login(TOKEN).catch(err => {
  console.error('Login failed:', err.message);
  process.exit(1);
});
