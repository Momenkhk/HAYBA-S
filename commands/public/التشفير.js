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
    if (message.author.bot || !message.guild) return;
    if (message.content === `${settings.prefix}setup-tashfer`) {
        if (!settings.Owners.includes(message.author.id)) return;

        const mainColor = settings.لون_الامبيد || '#2B2D31';

        const embed = new EmbedBuilder()
            .setColor(mainColor)
            .setAuthor({
                name: `${settings.RBPrefix || message.guild.name} | تشفير المنشورات`,
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setDescription(`
**لتشفير منشورك قم بالضغط على الزر بالأسفل. 

>  قم بوضع منشورك وسوف يقوم البوت بتشفيره تلقائياً ليتخطى فلاتر الحماية.**
            `)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setImage(settings.ServerInfo.tashfer || 'https://media.discordapp.net/attachments/1448778333796962306/1466003654904643598/IMG_9522.png')
            .setFooter({
                text: `${message.guild.name} • Encryption System`,
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('Tashfeer')
                .setLabel('تشفير')
                .setStyle(ButtonStyle.Secondary),
        );

        await message.delete().catch(() => { });
        await message.channel.send({ embeds: [embed], components: [buttons] });
        if (settings.ServerInfo.line) await message.channel.send({ files: [settings.ServerInfo.line] }).catch(() => { });
    }
});

// Use replacements from settings if available, otherwise fallback
const wordReplacements = settings.wordReplacements || {
    "متجر": "متـgـر",
    "حساب": "7ـساب",
    "بيع": "بـيـ3",
    "شراء": "شـrـراء",
    "شوب": "شـ9ب",
    "ديسكورد": "ديسـkورد",
    "سعر": "سـ3ـر",
    "متوفر": "متـ9فر",
    "بوست": "بـ9ست",
    "نيترو": "نيـtـرو",
    "توكنات": "تـ9ـكنات ",
};

client.on('interactionCreate', async interaction => {
    if (interaction.isButton() && interaction.customId === 'Tashfeer') {
        const modal = new ModalBuilder()
            .setCustomId('TashfeerModalBuilder')
            .setTitle('تشفير المنشور');

        const postInput = new TextInputBuilder()
            .setCustomId('ThePost')
            .setLabel("المنشور المراد تشفيره")
            .setPlaceholder('ضع هنا المحتوى الذي تريد تشفيره...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(postInput));
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'TashfeerModalBuilder') {
        const originalPost = interaction.fields.getTextInputValue('ThePost');

        // Replace words using regex
        const modifiedPost = originalPost.replace(
            new RegExp(Object.keys(wordReplacements).join('|'), 'gi'),
            match => wordReplacements[match.toLowerCase()] || match
        );

        const responseEmbed = new EmbedBuilder()
            .setColor('Green')
            .setAuthor({ name: 'تم تشفير المنشور بنجاح', iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setDescription(`**المحتوى المشفر:**\n\`\`\`\n${modifiedPost}\n\`\`\``)
            .setFooter({ text: 'يمكنك الآن نسخ المنشور واستخدامه.' });

        await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
    }
});
