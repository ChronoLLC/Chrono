const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { 
    genChannelId, 
    freegenroleid, 
    premiumgenroleid, 
    premiumGenChannelId,
    cooldowns: cooldownConfig 
} = require('../config.json');

function getServiceChoices() {
    const freeGenPath = path.join(__dirname, '../data/FreeGen');
    const premiumGenPath = path.join(__dirname, '../data/PremiumGen');

    if (!fs.existsSync(freeGenPath)) {
        fs.mkdirSync(freeGenPath, { recursive: true });
    }
    if (!fs.existsSync(premiumGenPath)) {
        fs.mkdirSync(premiumGenPath, { recursive: true });
    }

    const freeServices = fs.readdirSync(freeGenPath)
        .filter(file => file.endsWith('.txt'))
        .map(file => ({ name: file.replace('.txt', ''), value: file.replace('.txt', '') }));

    const premiumServices = fs.readdirSync(premiumGenPath)
        .filter(file => file.endsWith('.txt'))
        .map(file => ({ name: file.replace('.txt', ''), value: file.replace('.txt', '') }));

    return { freeServices, premiumServices };
}

module.exports = {
    getData() {
        const { freeServices, premiumServices } = getServiceChoices();
        return new SlashCommandBuilder()
            .setName('gen')
            .setDescription('Generates the first account of the service and sends it to DMs.')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('free')
                    .setDescription('Generate account from free services.')
                    .addStringOption(option =>
                        option.setName('service')
                            .setDescription('The name of the free service')
                            .setRequired(true)
                            .addChoices(...freeServices)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('premium')
                    .setDescription('Generate account from premium services.')
                    .addStringOption(option =>
                        option.setName('service')
                            .setDescription('The name of the premium service')
                            .setRequired(true)
                            .addChoices(...premiumServices)));
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const service = interaction.options.getString('service');
        const filePath = path.join(__dirname, `../data/${subcommand === 'free' ? 'FreeGen' : 'PremiumGen'}/${service}.txt`);

        // Channel check
        if (subcommand === 'free' && interaction.channelId !== genChannelId) {
            return interaction.reply({
                content: `This command can only be used in the <#${genChannelId}> channel.`,
                ephemeral: true
            });
        }

        if (subcommand === 'premium' && interaction.channelId !== premiumGenChannelId) {
            return interaction.reply({
                content: `This command can only be used in the <#${premiumGenChannelId}> channel.`,
                ephemeral: true
            });
        }

        if (subcommand === 'free') {
            if (!interaction.member.roles.cache.has(freegenroleid)) {
                return interaction.reply({
                    content: 'You need the free generator role to use this command.',
                    ephemeral: true
                });
            }
        }

        if (subcommand === 'premium') {
            if (!interaction.member.roles.cache.has(premiumgenroleid)) {
                return interaction.reply({
                    content: 'You need the premium generator role to use this command.',
                    ephemeral: true
                });
            }
        }

        let embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setFooter({ text: 'Credits to Chrono' });

        if (fs.existsSync(filePath)) {
            const accounts = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
            if (accounts.length > 0) {
                const account = accounts.shift();
                fs.writeFileSync(filePath, accounts.join('\n'), 'utf8');

                const [username, password] = account.split(':');
                const accountDisplay = password ? `${username}:${password}` : username;
                const dmEmbed = new EmbedBuilder()
                    .setColor('#2B2D31')
                    .setTitle('Generated Account')
                    .addFields(
                        { name: 'Service Name', value: `\`\`\`${service}\`\`\``, inline: true },
                        { name: 'Account Credentials', value: `\`\`\`${accountDisplay}\`\`\``, inline: true }
                    )
                    .setFooter({ text: 'Credits to Chrono' });

                try {
                    await interaction.user.send({ embeds: [dmEmbed] });
                    embed.setTitle('Account Generated')
                        .setDescription('Account has been sent to your DMs.')
                        .setImage('https://cdn.discordapp.com/attachments/1314077375499075624/1324932090839437397/Evia.png?ex=6779f2aa&is=6778a12a&hm=e21cb41307cc927f2c770c2ce4a96061201b6e50dbc77a24868ba4892918082c&');
                } catch (error) {
                    console.error('Error sending DM:', error);
                    embed.setTitle('DM Failed')
                        .setDescription('Failed to send the account to your DMs. Please check your DM settings and try again.');
                }
            } else {
                embed.setTitle('No Accounts Available')
                    .setDescription(`No accounts available for **${service}**.`);
            }
        } else {
            embed.setTitle('Service Not Found')
                .setDescription(`Service **${service}** does not exist.`);
        }

        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};