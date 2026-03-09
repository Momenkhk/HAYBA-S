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
    if (message.content.startsWith(`${settings.prefix}come`)) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordStaff)) return;

        const mentionOrID = message.content.split(/\s+/)[1];
        const targetMember = message.mentions.members.first() || await message.guild.members.fetch(mentionOrID).catch(() => null);

        if (!targetMember) {
            return message.reply('منشن شخص أو حط الإيدي 😶');
        }

        const embed = createEmbed({
            interaction: message,
            title: 'استدعاء عضو',
            description: `تم استدعاء العضو بنجاح ${targetMember}`
        });

        const msg = await message.reply({ embeds: [embed] });
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('اضغط هنا')
                .setURL(`https://discord.com/channels/${message.guildId}/${message.channelId}/${msg.id}`)
                .setStyle(ButtonStyle.Link),
        );

        const embed2 = createEmbed({
            interaction: message,
            description: `**مرحبا ${targetMember} تم استدعائك من قبل ${message.author} , اضغط علي الزر بالاسفل**`
        });

        await targetMember.send({ embeds: [embed2], components: [buttons] }).catch(() => { });
    }
});
