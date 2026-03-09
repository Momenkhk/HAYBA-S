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
    WebhookClient
} = require('discord.js');
const { client, db, settings } = require('../../index');

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    if (message.content == `${settings.prefix}setup-order`) {
        if (!settings.Owners.includes(message.author.id)) return;

        const mainColor = settings.لون_الامبيد || '#2B2D31';
        const serverPrefix = settings.RBPrefix || message.guild.name.split(' ')[0] || 'Server';

        const embed = new EmbedBuilder()
            .setColor(mainColor)
            .setAuthor({
                name: `${serverPrefix} Orders • الطلبات`,
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setDescription(`
**يرجى اختيار المكان المناسب لطلبك عبر القائمة في الأسفل**

**منتجات :**
**• مثل : نيترو , حسابات , بوستات , عملات الخ ..**

**تصاميم :**
**• مثل صورة , بنر , صورة بروفايل الخ ..**

**برمجيات :**
**• مثل : بوت , كود , بروجكت الخ ..**

**يرجى اخذ رتب المنشن لكي يصلك كل الطلبات.**
**https://discord.com/channels/1449742136600690822/1459941927813382275**
`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setImage(settings.ServerInfo.Orders || 'https://media.discordapp.net/attachments/1207553954515255327/1207598850710183936/18.png')
            .setFooter({
                text: `${message.guild.name} • Ordering Panel`,
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('SelectOrderType')
                .setPlaceholder('اختار المكان الصحيح لطلبك')
                .addOptions([
                    { label: 'منتجات', value: 'Montgat', emoji: '🛒' },
                    { label: 'تصاميم', value: 'Tsamem', emoji: '🎨' },
                    { label: 'برمجيات', value: 'Devss', emoji: '🤖' }
                ])
        );

        try {
            await message.delete().catch(() => { });
        } catch (e) { }

        await message.channel.send({ embeds: [embed], components: [selectMenu] });
        if (settings.ServerInfo.line) await message.channel.send({ files: [settings.ServerInfo.line] }).catch(() => { });
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'SelectOrderType') {
            const orderType = interaction.values[0];
            const titles = {
                'Montgat': 'منتجات',
                'Tsamem': 'تصاميم',
                'Devss': 'برمجيات'
            };

            const modal = new ModalBuilder()
                .setCustomId(`OrderModalBuilder_${orderType}`)
                .setTitle(`إكمال طلب ${titles[orderType]}`);

            const request = new TextInputBuilder()
                .setCustomId('request')
                .setLabel("ما هو طلبك بالتفصيل؟")
                .setPlaceholder('اكتب ماذا تريد هنا...')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(request));
            await interaction.showModal(modal);

        } else if (interaction.customId.startsWith('MuteReason_')) {
            const userId = interaction.customId.split('_')[1];
            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            if (!member) return interaction.reply({ content: 'لم أتمكن من العثور على العضو.', ephemeral: true });

            const reason = interaction.values[0];
            const muteTime = settings.Orders.Time[reason];
            if (!muteTime) return interaction.reply({ content: 'مدة الميوت غير معرفة في الإعدادات.', ephemeral: true });

            await member.roles.add(settings.MuteRoles.orderMute).catch(() => { });

            setTimeout(async () => {
                await member.roles.remove(settings.MuteRoles.orderMute).catch(() => { });
            }, muteTime);

            await interaction.update({
                content: '**✅ تم معاقبة العضو بنجاح وتطبيق الميوت.**',
                components: [],
                embeds: [],
            });

            const logChannel = await interaction.guild.channels.fetch(settings.Rooms.LogOrders).catch(() => null);
            if (logChannel) {
                const targetUser = `<@${userId}> (\`${userId}\`)`;
                const staffUser = `<@${interaction.user.id}> (\`${interaction.user.id}\`)`;

                let orderContent = 'لم يتم استخراج الطلب.';

                if (interaction.message.embeds[0]) {
                    const embedDesc = interaction.message.embeds[0].description || '';
                    const match = embedDesc.match(/```([^`]*)```/);
                    if (match) orderContent = match[1];
                }

                const reasons = {
                    wrong_channel: 'طلب بروم غلط',
                    ads: 'طلب اعضاء أو بارتنرز',
                    adult: 'طلب منتجات 18+',
                    forbidden: 'طلب ممنوع',
                    selling: 'بيع داخل الطلب'
                };

                const logEmbed = new EmbedBuilder()
                    .setTitle('🔇 Mute Order Issued')
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setColor("Red")
                    .addFields(
                        { name: 'العضو المٌعاقب', value: targetUser, inline: true },
                        { name: 'الإداري المسؤول', value: staffUser, inline: true },
                        { name: 'السبب', value: reasons[reason] || 'غير معروف', inline: true },
                        { name: 'الطلب المخالف', value: `\`\`\`${orderContent}\`\`\``, inline: false }
                    )
                    .setTimestamp();

                logChannel.send({ embeds: [logEmbed] }).catch(() => { });
            }
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('OrderModalBuilder_')) {
            const orderType = interaction.customId.replace('OrderModalBuilder_', '');
            const Order = interaction.fields.getTextInputValue('request');

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ **تم إرسال طلبك بنجاح إلى الإدارة المختصة. يرجى الانتظار حتى يتواصل معك أحد المسؤولين.**`);

            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

            const titles = { 'Montgat': 'منتجات', 'Tsamem': 'تصاميم', 'Devss': 'برمجيات' };

            const embed = new EmbedBuilder()
                .setColor(settings.لون_الامبيد || 'Blue')
                .setAuthor({ name: `طلب جديد | ${titles[orderType] || orderType}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`**صاحب الطلب:** ${interaction.user} (\`${interaction.user.id}\`)\n**نوع الطلب:** ${titles[orderType] || orderType}\n\n**الطلب:**\n\`\`\`${Order}\`\`\``)
                .setFooter({ text: `قسم الطلبات • ${interaction.guild.name}` })
                .setTimestamp();

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('DeleteOrder')
                    .setLabel('حذف ومعاقبة')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Secondary),
            );

            const config = settings.Orders[orderType.toLowerCase()];
            if (config) {
                const Log = await interaction.guild.channels.fetch(config.room).catch(() => null);
                if (Log) {
                    await Log.send({ content: `<@&${config.role}>`, embeds: [embed], components: [buttons] });
                    if (settings.ServerInfo.line) await Log.send({ files: [settings.ServerInfo.line] }).catch(() => { });
                }
            }
        }
    }

    if (interaction.isButton() && interaction.customId === 'DeleteOrder') {
        if (!interaction.member.roles.cache.has(settings.Admins.DiscordStaff)) {
            return interaction.reply({ content: 'ليس لديك صلاحية لاستخدام هذا الزر.', ephemeral: true });
        }

        const userId = interaction.message.embeds[0]?.description?.match(/<@!?(\d+)>/)?.[1];
        if (!userId) return interaction.reply({ content: 'تعذر العثور على صاحب الطلب.', ephemeral: true });

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'إدارة مخالفات الطلبات', iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setDescription(`**أهلاً بك يا ${interaction.user}، يرجى اختيار سبب الميوت للعضو <@${userId}>**`)
            .setColor("Yellow")
            .setFooter({ text: 'سيتم حذف الطلب وتطبيق الميوت فور اختيار السبب.' });

        const select = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`MuteReason_${userId}`)
                .setPlaceholder('اختر سبب الميوت')
                .addOptions([
                    { label: 'طلب بروم غلط', value: 'wrong_channel', emoji: '📍' },
                    { label: 'طلب اعضاء أو بارتنرز', value: 'ads', emoji: '📢' },
                    { label: 'طلب منتجات 18+', value: 'adult', emoji: '🔞' },
                    { label: 'طلب ممنوع', value: 'forbidden', emoji: '🚫' },
                    { label: 'بيع داخل الطلب', value: 'selling', emoji: '💰' },
                ])
        );

        await interaction.reply({ embeds: [embed], components: [select], ephemeral: true });
        await interaction.message.delete().catch(() => { });
    }
});
