const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    AttachmentBuilder, 
    Collection, 
    PermissionFlagsBits, 
    GatewayIntentBits, 
    Partials, 
    Client, 
    MessagePayload, 
    WebhookClient,
    ApplicationCommandType
} = require('discord.js');
const { client, db , settings} = require('../../index');
const { createEmbed  } = require('../../function/function/Embed')

client.on('messageCreate', async message => {
  if (message.content.startsWith(`${settings.prefix}log-delete`)) {
    if (!settings.Owners.includes(message.author.id)) return;

    const channelsToDelete = [
      "log-join-leave", "log-ban-unban", "log-kick", "log-messages", "log-pic",
      "log-roles", "log-links", "log-nickname", "log-channels", "log-vjoin-vexit",
      "log-move", "log-tmute-untmute", "log-bots"
    ];

    const statusMsg = await message.channel.send("Deleting logs...");

    let skipNext = false;

    for (let i = 0; i < channelsToDelete.length; i++) {
      const channelName = channelsToDelete[i];

      if (skipNext) {
        skipNext = false;
        continue;
      }

      const channel = message.guild.channels.cache.find(ch => ch.name === channelName && ch.type === 'GUILD_TEXT');

      if (channel) {
        await channel.delete();
        console.log(`Deleted channel: ${channel.name}`);
      } else {
        console.log(`Channel ${channelName} not found. Skipping deletion.`);
        skipNext = true;
      }
    }

    await statusMsg.edit("✅ Done deleted logs!");
  }
});
