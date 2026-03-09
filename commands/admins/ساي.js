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
    const prefix = settings.prefix;
    const command = `${prefix}say`;
    if (message.content.startsWith(command)) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;

        const content = message.content.slice(command.length).trim();
        let files = [];

        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            files.push(attachment.url);
        }

        try {
            await message.delete();
        } catch (e) { }

        if (content || files.length > 0) {
            await message.channel.send({ content: content || "", files: files });
        }
    }
});
