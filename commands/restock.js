const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { restockChannelId } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restock')
        .setDescription('Notifies the server that the service has been restocked.')
        .addStringOption(option => 
            option.setName('service')
                .setDescription('The name of the service')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('type')
                .setDescription('Type of stock (Free or Premium)')
                .setRequired(true)
                .addChoices(
                    { name: 'Free Stock', value: 'Free Stock' },
                    { name: 'Premium Stock', value: 'Premium Stock' }
                ))
        .addIntegerOption(option => 
            option.setName('count')
                .setDescription('Number of accounts added (optional)')
                .setRequired(false)),
    adminOnly: true,
    async execute(interaction) {
        const service = interaction.options.getString('service');
        const count = interaction.options.getInteger('count');
        const type = interaction.options.getString('type');
        const restockChannel = interaction.guild.channels.cache.get(restockChannelId);

        let description = `The service **${service}** (${type}) has been restocked by an admin.`;
        if (count !== null && !isNaN(count)) {
            description += `\nAccounts added: ${count}`;
        } else {
            description += '\nService has been restocked.';
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Service Restocked')
            .setImage('https://cdn.discordapp.com/attachments/1314077375499075624/1324932090839437397/Evia.png?ex=6779f2aa&is=6778a12a&hm=e21cb41307cc927f2c770c2ce4a96061201b6e50dbc77a24868ba4892918082c&')
            .setDescription(description)
            .setFooter({ text: 'Credits to Chrono' });

        if (restockChannel) {
            restockChannel.send({ content: '@everyone', embeds: [embed] });
        } else {
            await interaction.reply({ content: 'Restock channel not found.', ephemeral: true });
            return;
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};