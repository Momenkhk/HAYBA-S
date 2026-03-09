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
const { createEmbed } = require('../../function/function/Embed');

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.content.startsWith(`${settings.prefix}embed`)) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;

        const content = message.content.slice(`${settings.prefix}embed`.length).trim();
        let image = null;

        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            image = attachment.url;
        }

        const embed = createEmbed({
            interaction: message,
            description: content,
            image: image,
        });

        await message.delete().catch(() => { });
        await message.channel.send({ embeds: [embed] });
        if (settings.ServerInfo.line) await message.channel.send({ files: [settings.ServerInfo.line] });
    }
});
