const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays help information.'),
    async execute(interaction) {
        const ping = Math.round(interaction.client.ws.ping);
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle(`Information about ${interaction.client.user.username}`)
            .setDescription('An advanced service bot for managing and generating accounts.')
            .addFields(
                { name: '__My Features__', value: '* Manage and generate accounts.\n* Notify server restocks.\n* Display available stocks.\n* View bot statistics and more!', inline: false },
                { name: '__How do you use me?__', value: 'Use the following commands to interact with me:\n\n`/create` - Create a new service.\n`/add` - Add an account to a service.\n`/gen` - Generate an account from a service and send it to DMs.\n`/freegen` - Generate a free account from a service and send it to DMs.\n`/premiumgen` - Generate a premium account from a service and send it to DMs.\n`/restock` - Notify the server of a service restock.\n`/stock` - Display available stocks.\n`/help` - Display this help menu.', inline: false },
                { name: '__STATS:__', value: `* Developer: ${packageJson.author}\n* Ping: ${ping}ms\n* Version: ${packageJson.version}\n* [SourceCode](https://github.com/3z4k/Chrono-GenBot)`, inline: false }
            )
            .setImage('https://cdn.discordapp.com/attachments/1314077375499075624/1324932090839437397/Evia.png?ex=6779f2aa&is=6778a12a&hm=e21cb41307cc927f2c770c2ce4a96061201b6e50dbc77a24868ba4892918082c&')
            .setFooter({ text: 'Credits to Chrono' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};