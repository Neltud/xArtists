/**
 * LIA v6 - xArtists Discord Bot
 * Main entry point
 */

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MVX_API = 'https://api.multiversx.com';
const RAW_BASE = 'https://raw.githubusercontent.com/Neltud/xArtists/main';
const TRO_TOKEN = 'TRO-94c925';
const LIA_WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6';

interface BonData {
  score?: number;
  rank_estimate?: string;
  dao_active?: boolean;
  recommended_pair?: string;
  total_votes_cast?: number;
  timestamp?: string;
}

interface XArtistsData {
  health?: string;
  timestamp?: string;
  staking?: { nft_staking_active?: boolean; tro_staking_active?: boolean };
  collections?: { total_mainnet?: number; nfts_in_wallet?: number };
}

/** Fetch with a timeout, returning null on error. */
async function safeFetch<T>(url: string, timeoutMs = 5000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

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
  console.log(`✅ LIA v6 Discord Bot logged in as ${client.user?.tag}`);
  console.log(`🎯 Serving ${client.guilds.cache.size} guild(s)`);
});

// Message event
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!lia')) {
    return;
  }

  // Split on spaces; skip the first token ('!lia') since we already matched it above
  const [, ...args] = message.content.split(' ');
  const subcommand = args[0] || 'help';

  try {
    switch (subcommand) {
      case 'status': {
        const [xaData, bonData] = await Promise.all([
          safeFetch<XArtistsData>(`${RAW_BASE}/data/xartists_onchain.json`),
          safeFetch<BonData>(`${RAW_BASE}/data/battle_of_nodes.json`),
        ]);
        const health = xaData?.health ?? 'UNKNOWN';
        const nftStaking = xaData?.staking?.nft_staking_active ? '✅ Actif' : '⏸️ Standby';
        const troStaking = xaData?.staking?.tro_staking_active ? '✅ Actif' : '⏸️ Standby';
        const score = bonData?.score ?? 'N/A';
        const rank = bonData?.rank_estimate ?? 'N/A';
        const daoActive = bonData?.dao_active ? '🟢 Actif' : '⏸️ Standby';
        const lastUpdate = xaData?.timestamp ?? 'N/A';
        await message.reply(
          `📊 **xArtists — LIA v6 Status**\n` +
          `✅ Contracts: ${health}\n` +
          `🔒 NFT Staking: ${nftStaking}\n` +
          `🗳️ TRO Governance: ${troStaking}\n` +
          `⚔️ Battle of Nodes Score: ${score}/100 (${rank})\n` +
          `🗳️ DAO: ${daoActive}\n` +
          `🕐 Dernière MAJ: ${lastUpdate}`
        );
        break;
      }

      case 'tro': {
        const [tokenData, bonData] = await Promise.all([
          safeFetch<{ price?: number; marketCap?: number; supply?: string }>(`${MVX_API}/tokens/${TRO_TOKEN}`),
          safeFetch<BonData>(`${RAW_BASE}/data/battle_of_nodes.json`),
        ]);
        const price = tokenData?.price ? `$${tokenData.price.toFixed(8)}` : 'N/A';
        const pair = bonData?.recommended_pair ?? 'TRO/WEGLD';
        await message.reply(
          `💰 **$TRO Token Info** (TRO-94c925)\n` +
          `💵 Prix: ${price}\n` +
          `🔵 Meilleure pool: ${pair}\n` +
          `🛒 Acheter: https://xexchange.com/swap/USDC-c76f1f/TRO-94c925\n` +
          `🔗 Explorer: https://explorer.multiversx.com/tokens/TRO-94c925`
        );
        break;
      }

      case 'dao': {
        const bonData = await safeFetch<BonData>(`${RAW_BASE}/data/battle_of_nodes.json`);
        const active = bonData?.dao_active ? '🟢 Active' : '⏸️ En standby';
        const pair = bonData?.recommended_pair ?? 'TRO/WEGLD';
        const votes = bonData?.total_votes_cast ?? 0;
        const score = bonData?.score ?? 0;
        await message.reply(
          `🗳️ **Gouvernance DAO xArtists**\n` +
          `Statut: ${active}\n` +
          `Recommandation LIA: **${pair}**\n` +
          `Total votes: ${votes.toFixed(2)} TRO\n` +
          `Score on-chain: ${score}/100\n` +
          `Contrat: \`erd1qqq...0ca8\`\n` +
          `Stakez vos TRO pour voter !`
        );
        break;
      }

      case 'wallet': {
        const [econData, tokenData] = await Promise.all([
          safeFetch<{ price?: number }>(`${MVX_API}/economics`),
          safeFetch<{ price?: number }>(`${MVX_API}/tokens/${TRO_TOKEN}`),
        ]);
        const egldPrice = econData?.price?.toFixed(4) ?? 'N/A';
        const troPrice = tokenData?.price ? `$${tokenData.price.toFixed(8)}` : 'N/A';
        await message.reply(
          `👛 **LIA v6 Wallet — Mainnet**\n` +
          `Adresse: \`${LIA_WALLET.slice(0, 20)}...${LIA_WALLET.slice(-6)}\`\n` +
          `EGLD Prix: $${egldPrice}\n` +
          `$TRO Prix: ${troPrice}\n` +
          `🔗 https://explorer.multiversx.com/accounts/${LIA_WALLET}`
        );
        break;
      }

      case 'bridge': {
        await message.reply(
          `🌉 **sBTC ↔ $TRO Bridge**\n` +
          `Le bridge Bitcoin ↔ MultiversX est en développement.\n` +
          `LIA v6 intègre wBTC via xExchange (stratégie LIABrain TP +15%).\n` +
          `Suivez les mises à jour sur https://github.com/Neltud/xArtists`
        );
        break;
      }

      case 'art': {
        await message.reply(
          `🎨 **Collections xArtists — Tuduri Original**\n` +
          `11 collections NFT sur MultiversX Mainnet:\n` +
          `• NFTuduri (NFTUDURI-2990b6)\n` +
          `• XAR (XAR-cee2e0)\n` +
          `• Agreste (AGR-9bd53e)\n` +
          `• Alistor (ALISTOR-a646bc)\n` +
          `• Et 7 autres collections...\n` +
          `🖼️ Galerie: https://xoxno.com/creator/${LIA_WALLET}\n` +
          `🌐 dApp: https://neltud.github.io/xArtists`
        );
        break;
      }

      case 'stake': {
        await message.reply(
          `🎯 **Guide Staking xArtists**\n` +
          `**NFT Staking:**\n` +
          `1. Connectez votre wallet xPortal/DeFi\n` +
          `2. Envoyez vos NFTs au contrat: \`erd1qqq...xr8cl\`\n` +
          `3. Claim rewards avec claimRewards()\n\n` +
          `**TRO Governance Staking:**\n` +
          `1. Achetez $TRO sur xExchange (TRO-94c925)\n` +
          `2. Stakez sur: \`erd1qqq...0ca8\`\n` +
          `3. Votez sur les proposals DAO\n` +
          `4. LIA réinvestit 50% des profits dans la paire gagnante !`
        );
        break;
      }

      case 'help':
      default: {
        await message.reply(
          `🤖 **LIA v6 Commands**\n` +
          `\`!lia status\` — Statut live du système\n` +
          `\`!lia tro\` — Prix $TRO en temps réel\n` +
          `\`!lia dao\` — Gouvernance DAO & votes\n` +
          `\`!lia wallet\` — Wallet LIA v6 mainnet\n` +
          `\`!lia bridge\` — Info bridge Bitcoin ↔ MVX\n` +
          `\`!lia art\` — Collections NFT xArtists\n` +
          `\`!lia stake\` — Guide staking\n` +
          `\`!lia help\` — Cette aide\n\n` +
          `🌐 dApp: https://neltud.github.io/xArtists`
        );
        break;
      }
    }
  } catch (error) {
    console.error('Error handling command:', error);
    await message.reply('❌ Une erreur est survenue. Réessayez dans quelques instants.');
  }
});

// Login
client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 LIA v6 Bot shutting down...');
  client.destroy();
  process.exit(0);
});
