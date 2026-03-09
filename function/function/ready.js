const { ActivityType } = require('discord.js');
const registerWarnCommand = require('../../SlashCommands/SlashCommand');
module.exports = (client, chalk) => {
    client.on('clientReady', async () => {
        console.log(chalk.yellow(`${client.user.tag} is ready`));
        client.user.setPresence({
            status: 'idle',
            activities: [{
                name: 'by : @.er_. & @_7rz_',
                type: ActivityType.Watching
            }]
        });
    });
}
