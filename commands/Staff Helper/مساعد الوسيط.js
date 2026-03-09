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
const { client, dbTickets, settings } = require('../../index');

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

    const ticketGroupMatch = interaction.channel?.id && (await Promise.all(
        [1, 2, 3, 4, 5].map(async i => {
            const data = await dbTickets.get(`Tickets_waset${i}`);
            const found = data?.find(t => t.Ticket === interaction.channel.id);
            return found ? { index: i, data: found } : null;
        })
    )).find(Boolean);

    if (!ticketGroupMatch) return;

    const groupNumber = ticketGroupMatch.index;
    const TicketData = ticketGroupMatch.data;

    if (interaction.isButton() && interaction.customId === `WasetHelp${groupNumber}`) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`ticketActions_${groupNumber}`)
            .setPlaceholder('اختر إجراءً')
            .addOptions([
                { label: 'استدعاء صاحب التذكرة', value: 'callOwner' },
                { label: 'تغيير اسم التذكرة', value: 'renameTicket' },
                { label: 'إضافة شخص إلى التذكرة', value: 'addPerson' },
                { label: 'إزالة شخص من التذكرة', value: 'removePerson' },
                { label: 'استدعاء عليا', value: 'callLeader' },
                { label: 'إعادة ضبط القائمة', value: 'resetMenu' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ content: 'اختر إجراءً من القائمة:', components: [row], ephemeral: true });
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('ticketActions_')) {
        switch (interaction.values[0]) {
            case 'callOwner': {
                const ticketOwner = await interaction.guild.members.fetch(TicketData.userid).catch(() => null);
                if (!ticketOwner) return interaction.reply({ content: 'تعذر العثور على صاحب التذكرة.', ephemeral: true });

                const embedDM = new EmbedBuilder()
                    .setTitle('استدعاء صاحب التذكرة')
                    .setDescription(`**مرحبا <@${ticketOwner.id}>
يرجى التوجه إلى https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id} في أقرب وقت !
المُستدعي : <@${interaction.member.id}>
سبب الإستدعاء : ينفع احذر اداري ؟**`)
                    .setColor("Blue");

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('افتح التذكرة')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
                );

                await ticketOwner.send({ embeds: [embedDM], components: [row] }).catch(() => {
                    interaction.reply({ content: 'تعذر إرسال رسالة لصاحب التذكرة.', ephemeral: true });
                });

                const embed = new EmbedBuilder()
                    .setTitle('استدعاء العضو')
                    .setDescription(`لقد تم استدعاء <@${ticketOwner.id}> بنجاح`)
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .setColor("Blue");

                await interaction.channel.send({ content: `<@${interaction.user.id}> || <@${ticketOwner.id}>`, embeds: [embed] });
                await interaction.channel.send({ files: [settings.ServerInfo.line] });
                await interaction.reply({ content: `تم استدعاء <@${ticketOwner.id}> بنجاح`, ephemeral: true });
                break;
            }

            case 'renameTicket': {
                const modal = new ModalBuilder()
                    .setCustomId(`renameTicketModalBuilder_waset${groupNumber}`)
                    .setTitle('تغيير اسم التذكرة')
                    .addComponents(new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('newTicketName')
                            .setLabel('اسم التذكرة الجديد')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ));
                await interaction.showModal(modal);
                break;
            }

            case 'addPerson': {
                const modal = new ModalBuilder()
                    .setCustomId(`addPersonModalBuilder_waset${groupNumber}`)
                    .setTitle('إضافة شخص إلى التذكرة')
                    .addComponents(new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('personId')
                            .setLabel('أدخل ID الشخص')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ));
                await interaction.showModal(modal);
                break;
            }

            case 'removePerson': {
                const modal = new ModalBuilder()
                    .setCustomId(`removePersonModalBuilder_waset${groupNumber}`)
                    .setTitle('إزالة شخص من التذكرة')
                    .addComponents(new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('personIdRemove')
                            .setLabel('أدخل ID الشخص')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ));
                await interaction.showModal(modal);
                break;
            }

            case 'callLeader': {
                const modal = new ModalBuilder()
                    .setCustomId(`CallLeaderModalBuilder_waset${groupNumber}`)
                    .setTitle('سبب استدعاء عليا')
                    .addComponents([
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('reasonText')
                                .setLabel('اكتب سبب الاستدعاء')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        )
                    ]);
                await interaction.showModal(modal);
                break;
            }

            case 'resetMenu': {
                await interaction.message.edit({ components: [] });
                await interaction.reply({ content: 'تمت إعادة ضبط القائمة.', ephemeral: true });
                break;
            }
        }
    }

    if (interaction.isModalSubmit()) {
        const dbMatch = interaction.customId.match(/_(waset\d)$/);
        const dbKey = dbMatch?.[1];

        if (!dbKey || !interaction.channel) {
            return interaction.reply({ content: 'تعذر العثور على بيانات التذكرة.', ephemeral: true });
        }

        const allData = await dbTickets.get(`Tickets_${dbKey}`);
        const ticketData = allData?.find(t => t.Ticket === interaction.channel.id);

        if (!ticketData) {
            return interaction.reply({ content: 'تعذر العثور على بيانات التذكرة.', ephemeral: true });
        }

        if (interaction.customId.startsWith('renameTicketModalBuilder')) {
            const newName = interaction.fields.getTextInputValue('newTicketName');
            await interaction.channel.setName(newName).catch(() => {
                return interaction.reply({ content: 'تعذر تغيير الاسم.', ephemeral: true });
            });

            const embed = new EmbedBuilder()
                .setTitle('تغيير اسم التذكرة')
                .setDescription(`تم تغيير اسم التذكرة إلى \`${newName}\``)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setColor("Blue");

            await interaction.reply({ embeds: [embed] });
            await interaction.channel.send({ files: [settings.ServerInfo.line] });
            return;
        }

        if (interaction.customId.startsWith('addPersonModalBuilder')) {
            const personId = interaction.fields.getTextInputValue('personId');
            const member = await interaction.guild.members.fetch(personId).catch(() => null);
            if (!member) return interaction.reply({ content: 'تعذر العثور على الشخص.', ephemeral: true });

            await interaction.channel.permissionOverwrites.create(member, { ViewChannel: true, SendMessages: true });

            const embed = new EmbedBuilder()
                .setTitle('إضافة عضو إلى التذكرة')
                .setDescription(`لقد تم إضافة العضو <@${member.id}> إلى التذكرة`)
                .setColor("Green");

            await interaction.reply({ content: `<@${interaction.user.id}> || <@${member.id}>`, embeds: [embed] });
            return;
        }

        if (interaction.customId.startsWith('removePersonModalBuilder')) {
            const personId = interaction.fields.getTextInputValue('personIdRemove');
            const member = await interaction.guild.members.fetch(personId).catch(() => null);
            if (!member) return interaction.reply({ content: 'تعذر العثور على الشخص.', ephemeral: true });

            await interaction.channel.permissionOverwrites.delete(member);

            const embed = new EmbedBuilder()
                .setTitle('إزالة عضو من التذكرة')
                .setDescription(`لقد تم إزالة العضو <@${member.id}> من التذكرة`)
                .setColor("Red");

            await interaction.reply({ content: `<@${interaction.user.id}> || <@${member.id}>`, embeds: [embed] });
            return;
        }

        if (interaction.customId.startsWith('CallLeaderModalBuilder')) {
            const reason = interaction.fields.getTextInputValue('reasonText');
            await interaction.channel.setName('مطلوب عليا');

            const embed = new EmbedBuilder()
                .setTitle('استدعاء عليا')
                .setDescription(`الاداري: <@${interaction.user.id}>
السبب: ${reason}
\nملاحظة برجاء الانتظار بدون منشن!`)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setColor("DarkRed");

            await interaction.reply({ content: `<@${interaction.user.id}> || <@&${settings.RoleCoOwner}>`, embeds: [embed] });
            await interaction.channel.send({ files: [settings.ServerInfo.line] });
        }
    }
});
