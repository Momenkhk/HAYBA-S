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
    if (message.channel.id == settings.Rooms.Sug) {
        if (message.author.bot) return;

        let SuggestContent = message.content;
        await message.delete().catch(() => { });

        const embed = createEmbed({
            interaction: message,
            title: `اقتراح جديد`,
            description: `**- اقتراح من : ${message.author}\n\n\`\`\`${SuggestContent}\`\`\`**`
        });

        const T = await message.channel.send({ embeds: [embed] });
        if (settings.ServerInfo.line) await message.channel.send({ files: [settings.ServerInfo.line] });

        // Reactions (handled by custom emojis, usually works fine)
        await T.react(`<:Like:1208038716539539456>`).catch(() => { });
        await T.react(`<:Dislike:1208038718259335198>`).catch(() => { });
    }
});
