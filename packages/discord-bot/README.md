```markdown
# 🤖 LIA v6 — Discord Bot

**LIA v6** is an autonomous AI agent integrated into Discord, providing real-time monitoring and interaction with the xArtists ecosystem on **MultiversX** and **Stacks**.

## 🚀 Features

- **Live Wallet Status** — Monitor $TRO balance and sBTC staking in real-time
- **Token Information** — Get $TRO price, market cap, and 24h stats
- **Staking Guide** — Help users navigate NFT and governance staking
- **Art Discovery** — Browse latest Tuduri artworks on MultiversX
- **Bridge Status** — Track sBTC to $TRO bridge operations
- **Governance Alerts** — Notifications for active proposals and voting

## 📋 Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!lia status` | Live wallet status & staking info | `!lia status` |
| `!lia bridge` | sBTC → $TRO bridge guide | `!lia bridge` |
| `!lia tro` | $TRO token information | `!lia tro` |
| `!lia art` | Latest Tuduri artworks | `!lia art` |
| `!lia stake` | Staking guide & tutorial | `!lia stake` |
| `!lia help` | Show all available commands | `!lia help` |

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- Discord Bot Token
- MultiversX wallet address
- Stacks wallet address

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Neltud/xArtists.git
   cd xArtists/packages/discord-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your credentials:
   - `DISCORD_TOKEN` — Your Discord bot token
   - `MULTIVERSX_ADDRESS` — Your MultiversX wallet
   - `STACKS_ADDRESS` — Your Stacks wallet

4. **Build and run**
   ```bash
   npm run build
   npm start
   ```

   Or for development with hot reload:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```
packages/discord-bot/
├── src/
│   ├── index.ts              # Main bot entry point
│   ├── commands/             # Command implementations
│   ├── events/               # Event handlers
│   └── services/
│       ├── multiversx.ts     # MultiversX integration
│       └── stacks.ts         # Stacks/sBTC integration
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
├── README.md
└── .env.example
```

## 🔗 Integrations

### MultiversX
- Real-time $TRO balance queries
- NFT staking status
- Governance voting info
- Price & market data via Coingecko

### Stacks (Bitcoin L2)
- sBTC staking monitoring
- Stacking APY information
- Bridge transaction status
- Pool information

## 📊 Monitoring & Logging

LIA v6 includes comprehensive logging:

```bash
npm run dev     # Development with verbose logging
npm start       # Production with info-level logging
```

Environment variable: `LOG_LEVEL=debug|info|warn|error`

## 🔒 Security

- **Never commit** `.env` file with real credentials
- Use environment variables for all sensitive data
- Implement rate limiting on public bot commands
- Validate all user inputs before processing

## 📈 Future Enhancements

- [ ] Slash commands support
- [ ] Advanced AI trading insights
- [ ] Notification system for price alerts
- [ ] User dashboard integration
- [ ] Multi-chain support (Ethereum, Arbitrum)
- [ ] Custom user portfolios

## 🤝 Contributing

Contributions welcome! Please:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📞 Support

- **Discord**: Join our community server
- **GitHub Issues**: Report bugs or request features
- **Email**: nelson@xartists.com

## 📄 License

MIT License — See LICENSE file for details

---

**Built with ❤️ by Nelson Tuduri & LIA v6**
```
