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
const { client, settings } = require('../../index');

client.on('messageCreate', async (message) => {
    if (message.content.startsWith(`${settings.prefix}setup-noti`)) {
        if (!settings.Owners.includes(message.author.id)) return;

        const embed = new EmbedBuilder()
            .setColor(settings.لون_الامبيد || 'Blue')
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setDescription(
                `**
#-${message.guild.name} | اشعارات السيلرز

لإشعارات طلبات منتجات إضغط على طلبات منتجات

لإشعارات طلبات تصاميم اضغط على طلبات تصاميم

لإشعارات طلبات البرمجيات إضغط على طلبات برمجيات

و إذا حصلت أي مشكله أو لم يتم إعطاؤك الرتب الرجاء التوجه إلى الدعم الفني.
                **`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('montgat')
                .setLabel('طلبات منتجات')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('tsamem')
                .setLabel('طلبات تصاميم')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('devss')
                .setLabel('طلبات برمجيات')
                .setStyle(ButtonStyle.Secondary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const { member, customId } = interaction;

    // Ensure the custom ID matches one of the configured roles
    if (!settings.Orders[customId]) return;

    const roleId = settings.Orders[customId].role;
    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) {
        return interaction.reply({ content: 'الرتبة غير موجودة.', ephemeral: true });
    }

    try {
        // Toggle the role for the user
        if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId);
            await interaction.reply({ content: `تم إزالة رتبة ${role.name} بنجاح.`, ephemeral: true });
        } else {
            await member.roles.add(roleId);
            await interaction.reply({ content: `تم إعطاؤك رتبة ${role.name} بنجاح.`, ephemeral: true });
        }
    } catch (error) {
        console.error('Error handling button interaction:', error);
        // Fallback response in case of an error
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'حدث خطأ أثناء معالجة طلبك.', ephemeral: true });
        }
    }
});

