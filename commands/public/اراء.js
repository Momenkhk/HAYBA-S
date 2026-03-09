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
    if (message.channel.id == settings.Rooms.Feedback) {
        if (message.author.bot) return;

        let FeedbackContent = message.content;
        await message.delete().catch(() => { });

        const embed = createEmbed({
            interaction: message,
            title: `نشكرك على مشاركة رأيك`,
            description: `**- ${message.author}\n- FeedBack : ${FeedbackContent}**`
        });

        await message.channel.send({ embeds: [embed] });
        if (settings.ServerInfo.line) await message.channel.send({ files: [settings.ServerInfo.line] });
    }
});
