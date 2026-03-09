const { client, db } = require('../index');
const { ApplicationCommandType } = require('discord.js');

client.on('ready', async () => {
  await client.application.commands.set([
    {
      name: 'Warn seller',
      type: ApplicationCommandType.Message
    },


  ])
})
