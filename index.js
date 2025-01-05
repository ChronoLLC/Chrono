const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const figlet = require('figlet');
const colors = require('colors');
require('dotenv').config();

const {
    clientId,
    guildId,
    genChannelId,
    freegenroleid,
    premiumgenroleid,
    restockChannelId,
    adminRoleId,
    vanityLink,
    premiumGenChannelId,
    cooldowns: cooldownConfig
} = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.cooldowns = new Collection();

function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('getData' in command && 'execute' in command) {
            client.commands.set(command.getData().name, command);
        } else if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

async function registerCommands() {
    const commands = [];
    for (const command of client.commands.values()) {
        if ('getData' in command) {
            commands.push(command.getData().toJSON());
        } else {
            commands.push(command.data.toJSON());
        }
    }
    
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
    );
}

// Initialize data directories
const freeGenPath = path.join(__dirname, 'data/FreeGen');
const premiumGenPath = path.join(__dirname, 'data/PremiumGen');

if (!fs.existsSync(freeGenPath)) {
    fs.mkdirSync(freeGenPath, { recursive: true });
}
if (!fs.existsSync(premiumGenPath)) {
    fs.mkdirSync(premiumGenPath, { recursive: true });
}

// Watch for file changes silently
fs.watch(freeGenPath, (eventType, filename) => {
    if (filename && filename.endsWith('.txt')) {
        loadCommands();
        registerCommands().catch(console.error);
    }
});

fs.watch(premiumGenPath, (eventType, filename) => {
    if (filename && filename.endsWith('.txt')) {
        loadCommands();
        registerCommands().catch(console.error);
    }
});

async function checkForVanityRole(presence) {
    if (!presence?.activities) return;

    const hasVanityLink = presence.activities.some(activity =>
        activity.state && activity.state.includes(vanityLink)
    );

    const member = presence.member;
    if (!member) return;
    
    const role = presence.guild.roles.cache.get(freegenroleid);
    if (!role) return;

    try {
        if (hasVanityLink && !member.roles.cache.has(freegenroleid)) {
            await member.roles.add(role);
        } else if (!hasVanityLink && member.roles.cache.has(freegenroleid)) {
            await member.roles.remove(role);
        }
    } catch (error) {
        console.error(colors.red(`Error managing role for ${member.user.tag}:`), error);
    }
}

async function checkAllMembersForVanity() {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    try {
        await guild.members.fetch();
        guild.members.cache.forEach(member => {
            if (member.presence) {
                checkForVanityRole(member.presence);
            }
        });
    } catch (error) {
        console.error(colors.red('Error fetching members:'), error);
    }
}

function displayStartupInfo() {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const version = packageJson.version;
    const author = packageJson.author;
    
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    const stockFiles = fs.readdirSync('./data').filter(file => file.endsWith('.txt'));
    
    const asciiArt = figlet.textSync('Chrono', { font: 'Slant' }).trimRight();
    const userTag = client.user.tag;
    const lines = asciiArt.split('\n');
    const longestLineLength = Math.max(...lines.map(line => line.length));

    const paddedLines = lines.map((line, index) => {
        let infoLine = '';
        if (index === 0) infoLine = userTag;
        else if (index === 1) infoLine = `Version: ${version}`;
        else if (index === 2) infoLine = `Total Stocks: ${stockFiles.length}`;
        else if (index === 3) infoLine = `Total Commands: ${commandFiles.length}`;
        else if (index === 4) infoLine = `Vanity Link: ${vanityLink}`;
        else if (index === 5) infoLine = `Developer: ${author}`;
        return line + ' '.repeat(longestLineLength - line.length) + '   ' + infoLine;
    });

    paddedLines.forEach(line => console.log(colors.green(line)));
}

function rotateStatus() {
    const freeFiles = fs.readdirSync('./data/FreeGen').filter(file => file.endsWith('.txt'));
    const premiumFiles = fs.readdirSync('./data/PremiumGen').filter(file => file.endsWith('.txt'));

    let statusIndex = 0;
    const statuses = [...freeFiles, ...premiumFiles].map(file => ({
        type: ActivityType.Watching,
        name: file.replace('.txt', '')
    }));

    setInterval(() => {
        if (statuses.length > 0) {
            const status = statuses[statusIndex];
            client.user.setActivity(status.name, { type: status.type });
            statusIndex = (statusIndex + 1) % statuses.length;
        }
    }, 10000);
}

client.once('ready', async () => {
    loadCommands();
    await registerCommands();
    displayStartupInfo();
    rotateStatus();
    await checkAllMembersForVanity();
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
    checkForVanityRole(newPresence);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (command.adminOnly && !interaction.member.roles.cache.has(adminRoleId)) {
        return interaction.reply({ 
            content: 'You do not have permission to use this command.', 
            ephemeral: true 
        });
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(colors.red('Error executing command:'), error);
        await interaction.reply({ 
            content: 'There was an error while executing this command!', 
            ephemeral: true 
        });
    }
});

process.on('unhandledRejection', error => {
    console.error(colors.red('Unhandled promise rejection:'), error);
});

process.on('uncaughtException', error => {
    console.error(colors.red('Uncaught exception:'), error);
});

client.login(process.env.TOKEN);
