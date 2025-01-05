const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adminRoleId, restockChannelId } = require('../config.json');

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

function createEmbed(service, serviceType, stockCount, isError = false) {
    const embed = new EmbedBuilder()
        .setColor(isError ? '#ff0000' : '#2B2D31')
        .setFooter({ text: 'Credits to Chrono' });

    if (isError) {
        embed.setTitle('Error')
            .setDescription(`Failed to add account to **${service}** (${serviceType})`);
    } else {
        embed.setTitle('Account Added')
            .setDescription(`Successfully added account to **${service}** (${serviceType})`)
            .addFields({ name: 'Current Stock', value: stockCount.toString(), inline: true });
    }

    return embed;
}

function createRestockEmbed(service, serviceType, stockCount) {
    return new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('New Stock Added')
        .setDescription(`New account added to **${service}** (${serviceType})`)
        .addFields({ name: 'Current Stock', value: stockCount.toString(), inline: true })
        .setFooter({ text: 'Credits to Chrono' });
}

async function addAccount(filePath, credentials) {
    await fs.promises.appendFile(filePath, `${credentials}\n`, 'utf8');
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content.split('\n').filter(line => line.trim()).length;
}

module.exports = {
    getData() {
        const { freeServices, premiumServices } = getServiceChoices();
        const command = new SlashCommandBuilder()
            .setName('add')
            .setDescription('Adds an account to the service file.')
            .addStringOption(option =>
                option.setName('servicetype')
                    .setDescription('The type of service (free or premium)')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Free', value: 'Free' },
                        { name: 'Premium', value: 'Premium' }
                    ));

        command.addStringOption(option => {
            const baseOption = option
                .setName('service')
                .setDescription('The name of the service')
                .setRequired(true);

            [...freeServices, ...premiumServices].forEach(service => {
                baseOption.addChoices(service);
            });

            return baseOption;
        });

        command.addStringOption(option =>
            option.setName('credentials')
                .setDescription('The account credentials')
                .setRequired(true));

        return command;
    },

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const credentials = interaction.options.getString('credentials');
        const service = interaction.options.getString('service');
        const serviceType = interaction.options.getString('servicetype');
        const folderPath = path.join(__dirname, `../data/${serviceType}Gen`);
        const filePath = path.join(folderPath, `${service}.txt`);

        try {
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            const stockCount = await addAccount(filePath, credentials);

            const embed = createEmbed(service, serviceType, stockCount);
            await interaction.reply({ embeds: [embed], ephemeral: true });

            if (restockChannelId) {
                const restockChannel = interaction.client.channels.cache.get(restockChannelId);
                if (restockChannel) {
                    const restockEmbed = createRestockEmbed(service, serviceType, stockCount);
                    await restockChannel.send({ embeds: [restockEmbed] });
                }
            }

        } catch (error) {
            console.error('Error in add command:', error);
            const errorEmbed = createEmbed(service, serviceType, 0, true);
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
