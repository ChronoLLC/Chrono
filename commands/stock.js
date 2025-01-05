const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stock')
        .setDescription('Displays comprehensive stock availability'),
    async execute(interaction) {
        const freePath = path.join(__dirname, '../data/FreeGen');
        const premiumPath = path.join(__dirname, '../data/PremiumGen');
        const freeFiles = fs.readdirSync(freePath).filter(file => file.endsWith('.txt'));
        const premiumFiles = fs.readdirSync(premiumPath).filter(file => file.endsWith('.txt'));

        let freeStock = '';
        let premiumStock = '';

        if (freeFiles.length > 0) {
            freeFiles.forEach(file => {
                const service = file.replace('.txt', '');
                const accounts = fs.readFileSync(path.join(freePath, file), 'utf8').split('\n').filter(Boolean).length;
                freeStock += `${service}: ${accounts} accounts\n`;
            });
        } else {
            freeStock = 'No free services available at this time.';
        }

        if (premiumFiles.length > 0) {
            premiumFiles.forEach(file => {
                const service = file.replace('.txt', '');
                const accounts = fs.readFileSync(path.join(premiumPath, file), 'utf8').split('\n').filter(Boolean).length;
                premiumStock += `${service}: ${accounts} accounts\n`;
            });
        } else {
            premiumStock = 'No premium services available at this time.';
        }

        const stockOverview = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('Stock Availability')
            .setDescription('Free and premium stock levels for our services.')
            .addFields(
                { name: '**__Free Stock__**', value: '```\n' + freeStock + '```', inline: true },
                { name: '**__Premium Stock__**', value: '```\n' + premiumStock + '```', inline: true }
            )
            .setFooter({ text: 'Credits to Chrono' });
        
        await interaction.reply({ embeds: [stockOverview] });
    },
};