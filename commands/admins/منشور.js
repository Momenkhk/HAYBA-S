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
    if (!message.content.startsWith(settings.prefix + 'setup-posts')) return;
    if (!settings.Owners.includes(message.author.id)) return;

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('selectPostType')
            .setPlaceholder('اختر نوع المنشن')
            .addOptions([
                { label: 'Mention Here', value: 'here' },
                { label: 'Mention Everyone', value: 'everyone' }
            ])
    );

    const embed = new EmbedBuilder()
        .setTitle('Posts control')
        .setThumbnail(message.guild.iconURL({ dynamic: true }))
        .setDescription(`> **Mention Here** :\nلـ نشر منشور في : <#${settings.Rooms.RoomPosts}> بـ منشن للاونلاين(هير) !\n\n> **Mention Everyone** :\nلـ نشر منشور في : <#${settings.Rooms.RoomPosts}> بـ منشن للكل(ايفريون) !`);

    await message.channel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'selectPostType') {
        const mentionType = interaction.values[0];
        const mpostmodal = new ModalBuilder()
            .setCustomId(`PostModalBuilder_${mentionType}`)
            .setTitle('معلومات المنشور');

        const userIdInput = new TextInputBuilder()
            .setCustomId('UserId')
            .setLabel('User ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const postInput = new TextInputBuilder()
            .setCustomId('ThePost')
            .setLabel('Post')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const reasonInput = new TextInputBuilder()
            .setCustomId('Reason')
            .setLabel('Reason?!')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        mpostmodal.addComponents(
            new ActionRowBuilder().addComponents(userIdInput),
            new ActionRowBuilder().addComponents(postInput),
            new ActionRowBuilder().addComponents(reasonInput)
        );

        await interaction.showModal(mpostmodal);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (!interaction.customId.startsWith('PostModalBuilder_')) return;

    const mentionType = interaction.customId.split('_')[1];

    try {
        const userId = interaction.fields.getTextInputValue('UserId');
        const postContent = interaction.fields.getTextInputValue('ThePost');
        const reason = interaction.fields.getTextInputValue('Reason');

        if (postContent.includes('@here') || postContent.includes('@everyone')) {
            return await interaction.reply({ content: `ضع منشورك مرة اخرى ولكن بدون منشن !`, ephemeral: true });
        }

        const RoomPostID = settings.Rooms.RoomPosts;
        const RoomPost = interaction.guild.channels.cache.get(RoomPostID);
        const mention = mentionType === 'here' ? '@here' : '@everyone';

        if (!RoomPost) {
            return await interaction.reply({ content: 'روم المنشورات غير موجود.', ephemeral: true });
        }

        const sentMessage = await RoomPost.send(`${postContent}\n\nتواصلوا مع: <@${userId}>\n${mention}`);
        await RoomPost.send('**المنشور دا مدفوع ونخلي مسؤليتنا من يلي يصير بينكم**');
        if (settings.ServerInfo.line) await RoomPost.send({ files: [settings.ServerInfo.line] });

        const logEmbed = new EmbedBuilder()
            .setTitle('منشور جديد!')
            .addFields([
                { name: 'الإداري:', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'العضو:', value: `<@${userId}>`, inline: true },
                { name: 'النوع:', value: mention, inline: true },
                { name: 'السبب:', value: reason },
                { name: 'المنشور:', value: `[رابط المنشور](${sentMessage.url})` }
            ])
            .setColor(settings.لون_الامبيد || 'Blue')
            .setTimestamp();

        const LogChannelID = settings.Rooms.LogPosts;
        const LogChannel = interaction.guild.channels.cache.get(LogChannelID);
        if (LogChannel) await LogChannel.send({ embeds: [logEmbed] }).catch(() => { });

        const successEmbed = new EmbedBuilder()
            .setColor("Green")
            .setTitle('Done posted successfully')
            .setDescription(`[Post](${sentMessage.url})`)
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });

    } catch (error) {
        console.error('ModalBuilder processing error:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'حدث خطأ أثناء معالجة المودال ❌', ephemeral: true });
        }
    }
});
