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
const { client, db, dbpoint, settings } = require('../../index');
const { createEmbed } = require('../../function/function/Embed');

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.content.startsWith(`${settings.prefix}نقاط`)) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;

        const mentionOrID = message.content.split(/\s+/)[1];
        const targetMember = message.mentions.members.first() || await message.guild.members.fetch(mentionOrID).catch(() => null);

        if (!targetMember) {
            return message.reply('منشن شخص أو حط الإيدي.');
        }

        const DataPoints = await dbpoint.get(`Points_Staff`) || [];
        const Exit = DataPoints.find((t) => t.userid == targetMember.id);

        const AllPoints = (Exit?.Warn || 0) + (Exit?.point || 0);
        const embed = createEmbed({
            interaction: message,
            title: `عرض نقاط`,
            fields: [
                {
                    name: `الاداري`,
                    value: `${targetMember}`,
                    inline: false,
                },
                {
                    name: `التكتات`,
                    value: `${Exit?.point || 0}`,
                    inline: true,
                },
                {
                    name: `التحذيرات`,
                    value: `${Exit?.Warn || 0}`,
                    inline: true,
                },
                {
                    name: `عدد نقاطه`,
                    value: `${AllPoints || 0}`,
                    inline: true,
                },
            ],
        });

        await message.reply({ embeds: [embed] });
    }
});
