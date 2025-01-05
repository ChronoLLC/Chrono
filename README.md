# Chrono Discord Bot

A feature-rich Discord bot for managing free and premium account generation services with vanity role management and customizable commands.

## Features

- 🎮 Free and Premium account generation
- 🔄 Automatic stock monitoring and updates
- 👑 Vanity role management system
- ⚡ Slash command support
- 🔒 Admin-only commands
- 🕒 Cooldown system
- 📊 Status rotation displaying available stocks

## Prerequisites

- Node.js v16.9.0 or higher
- Discord Bot Token
- Discord Server (Guild)

## Installation

1. Clone the repository
```bash
git clone https://github.com/ChronoLLC/Chrono.git]
cd Chrono
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory and add your bot token:
```env
TOKEN=your_discord_bot_token_here
```

4. Configure the `config.json` file with your Discord server settings:
```json
{
  "clientId": "your_client_id",
  "guildId": "your_guild_id",
  "genChannelId": "generation_channel_id",
  "freegenroleid": "free_generation_role_id",
  "premiumgenroleid": "premium_generation_role_id",
  "restockChannelId": "restock_channel_id",
  "adminRoleId": "admin_role_id",
  "vanityLink": "your_vanity_link",
    "premiumGenChannelId": "premium_generation_channel_id",
        "cooldowns": {
        "freegen": 300, 
        "premiumgen": 600, 
        "global": 5
    }

}
```

## Project Structure

```
├── commands/           # Command files
├── data/              # Stock data
│   ├── FreeGen/      # Free generation stock files
│   └── PremiumGen/   # Premium generation stock files
├── index.js           # Main bot file
├── config.json        # Bot configuration
└── .env              # Environment variables
```


### Account Generation
- Separate systems for free and premium users
- Automatic stock monitoring
- Stock restock notifications

### Vanity System
- Automatic role assignment based on vanity link in status
- Continuous monitoring of user presence
- Automatic role removal when vanity is removed

### Command System
- Slash command support
- Admin-only commands
- Cooldown management
- Error handling

## Commands

The bot automatically loads commands from the `commands` directory. Each command file should export:
- `getData()` or `data` - Command definition
- `execute()` - Command execution logic

## Running the Bot

```bash
node index.js
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Author
    3z4k 

## Support

For support, join our Discord server: https://discord.gg/jzqwBG8284

## Acknowledgments

- discord.js
- @discordjs/rest
- figlet
- colors
