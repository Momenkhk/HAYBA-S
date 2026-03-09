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
const messageLinkMap = new Map();

// أمر تعديل الرسالة
client.on("messageCreate", async (message) => {
    if (message.content.startsWith(settings.prefix + 'edit')) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) {
            return message.channel.send("**ليس لديك صلاحيات كافية لإرسال الرسالة.**");
        }
        const args = message.content.split(' ').slice(1);
        const channelId = args[0]?.replace(/<#|>/g, '');

        const messageId = args[1];

        if (!channelId || !messageId) return message.reply('يرجى استخدام الأمر هكذا: `-edit <channelId> <messageId>`');

        const channel = client.channels.cache.get(channelId);
        if (!channel || channel.type !== ChannelType.GuildText) return message.reply('لم يتم العثور على الروم.');

        let targetMsg;
        try {
            targetMsg = await channel.messages.fetch(messageId);
        } catch (err) {
            return message.reply('لم يتم العثور على الرسالة.');
        }

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`edit-${message.author.id}-${channelId}-${messageId}`)
                .setLabel('تعديل الرسالة')
                .setStyle(ButtonStyle.Primary)
        );

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setDescription('**برجاء الضغط علي الزر لتعديل الرساله**');

        const sent = await message.channel.send({ embeds: [embed], components: [button] });
        messageLinkMap.set(messageId, { buttonMsgId: sent.id, channelId: sent.channel.id });
    }
});

// التعامل مع الضغط على الزر والمودال
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        const customIdParts = interaction.customId.split('-');
        if (customIdParts[0] !== 'edit') return;
        const [action, userId, channelId, messageId] = customIdParts;

        if (interaction.user.id !== userId) return interaction.reply({ content: 'هذا الزر ليس لك.', ephemeral: true });

        const channel = client.channels.cache.get(channelId);
        if (!channel) return interaction.reply({ content: 'تعذر الوصول إلى الروم.', ephemeral: true });

        let targetMsg;
        try {
            targetMsg = await channel.messages.fetch(messageId);
        } catch {
            return interaction.reply({ content: 'تعذر الوصول إلى الرسالة.', ephemeral: true });
        }

        const editmodal = new ModalBuilder()
            .setCustomId(`modaledit-${channelId}-${messageId}`)
            .setTitle('تعديل الرسالة');

        const input = new TextInputBuilder()
            .setCustomId('newContent')
            .setLabel('محتوى الرسالة الجديد')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setValue(targetMsg.content || '');

        const row = new ActionRowBuilder().addComponents(input);
        editmodal.addComponents(row);

        await interaction.showModal(editmodal);
    }

    if (interaction.isModalSubmit()) {
        const customIdParts = interaction.customId.split('-');
        if (customIdParts[0] !== 'modaledit') return;
        const [_, channelId, messageId] = customIdParts;

        const newContent = interaction.fields.getTextInputValue('newContent');

        const channel = client.channels.cache.get(channelId);
        if (!channel) return interaction.reply({ content: 'لم يتم العثور على الروم.', ephemeral: true });

        try {
            const targetMsg = await channel.messages.fetch(messageId);
            await targetMsg.edit(newContent);

            const doneEmbed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(`**تم تعديل الرسالة بنجاح.**\n-# **تم التعديل بواسطة: ${interaction.user}**`);

            await interaction.reply({ embeds: [doneEmbed] });

            const link = messageLinkMap.get(messageId);
            if (link) {
                try {
                    const btnChannel = client.channels.cache.get(link.channelId);
                    const btnMsg = await btnChannel.messages.fetch(link.buttonMsgId);
                    if (btnMsg) await btnMsg.delete().catch(() => { });
                } catch (e) { }
                messageLinkMap.delete(messageId);
            }

        } catch (err) {
            if (!interaction.replied) {
                interaction.reply({ content: 'حدث خطأ أثناء تعديل الرسالة.', ephemeral: true });
            }
        }
    }
});

// حذف زر التعديل لو الرسالة الأصلية انحذفت
client.on('messageDelete', async (deletedMsg) => {
    const link = messageLinkMap.get(deletedMsg.id);
    if (!link) return;

    try {
        const btnChannel = client.channels.cache.get(link.channelId);
        if (btnChannel) {
            const btnMsg = await btnChannel.messages.fetch(link.buttonMsgId).catch(() => null);
            if (btnMsg) await btnMsg.delete().catch(() => { });
        }
    } catch { }

    messageLinkMap.delete(deletedMsg.id);
});
