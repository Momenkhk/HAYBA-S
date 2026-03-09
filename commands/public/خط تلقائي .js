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
    ChannelType
} = require('discord.js');
const { client, db, settings } = require('../../index');

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (Array.isArray(settings.AutoLine) && settings.AutoLine.includes(message.channel.id)) {
        if (settings.ServerInfo.line) {
            await message.channel.send({ files: [settings.ServerInfo.line] }).catch(() => { });
        }
    }
});
