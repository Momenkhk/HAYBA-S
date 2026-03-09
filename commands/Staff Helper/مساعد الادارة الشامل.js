const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const { client, settings, dbTickets } = require('../../index');

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

    // 1. Handling the initial button click to show the menu
    const helpButtons = ['KdaaHelp', 'MzadHelp', 'SpinHelp', 'AdminsHelp', 'AdminssHelp'];
    if (interaction.isButton() && helpButtons.includes(interaction.customId)) {
        const guildName = interaction.guild.name;
        const guildIcon = interaction.guild.iconURL({ dynamic: true });

        // Container Style Embed
        const embed = new EmbedBuilder()
            .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
            .setDescription('**مرحبا بك ايها الاداري في قائمة مساعد الادارة\nبرجاء اختيار المساعدة التي تريدها من القائمة بالاسفل**')
            .setColor(settings.لون_الامبيد || '#2B2D31')
            .setThumbnail(guildIcon)
            .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon });

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('UniversalAdminHelpMenu')
                .setPlaceholder('اختر نوع المساعده')
                .addOptions([
                    { label: 'استدعاء صاحب التذكره', value: 'call_owner' },
                    { label: 'اضافة شخص', value: 'add_user' },
                    { label: 'ازالة شخص', value: 'remove_user' },
                    { label: 'تغيير اسم التذكره', value: 'rename_ticket' },
                    { label: 'استدعاء عليا', value: 'call_leader' },
                    { label: 'اعاده تعيين القايمه', value: 'reset_menu' },
                ])
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        return;
    }

    // 2. Handling the select menu choices
    if (interaction.isStringSelectMenu() && interaction.customId === 'UniversalAdminHelpMenu') {
        const action = interaction.values[0];
        const guildName = interaction.guild.name;
        const guildIcon = interaction.guild.iconURL({ dynamic: true });

        if (action === 'call_owner') {
            // Find which table the ticket belongs to
            const tables = ['Tickets_Support', 'Tickets_Tashher', 'Tickets_Mzad', 'Tickets_complaints', 'Tickets_Spin', 'Tickets_waset1', 'Tickets_waset2', 'Tickets_waset3', 'Tickets_waset4', 'Tickets_waset5'];
            let ticket = null;

            for (const table of tables) {
                const data = await dbTickets.get(table);
                if (Array.isArray(data)) {
                    ticket = data.find(t => t.Ticket === interaction.channel.id);
                    if (ticket) break;
                }
            }

            if (!ticket) return interaction.reply({ content: '❌ لم يتم العثور على بيانات التذكرة في قاعدة البيانات.', ephemeral: true });

            const owner = ticket.userid; // This is the user ID correctly

            // Container Style DM Embed
            const dmEmbed = new EmbedBuilder()
                .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
                .setColor(settings.لون_الامبيد || '#2B2D31')
                .setDescription(`
**استدعاء للتذكرة**

**مرحباً <@${owner}>**
**تم استدعائك من قبل الإدارة في تذكرتك.**
**يرجى التوجه إليها في أقرب وقت.**

**المُستدعي :** <@${interaction.member.id}>
**رابط التذكرة :** [اضغط هنا](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id})
                `)
                .setThumbnail(guildIcon)
                .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon });

            const dmRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('الذهاب للتذكرة')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
            );

            const user = await client.users.fetch(owner).catch(() => null);
            if (user) await user.send({ embeds: [dmEmbed], components: [dmRow] }).catch(() => { });

            await interaction.reply({ content: `**تم استدعاء <@${owner}> بنجاح**`, ephemeral: true });

            // Container Style Log in the ticket
            const logEmbed = new EmbedBuilder()
                .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
                .setColor(settings.لون_الامبيد || '#2B2D31')
                .setDescription(`
**تم استدعاء العضو**

**لقد تم ارسال رسالة خاصة للعضو <@${owner}> لتنبيهه بالرد.**
                `)
                .setThumbnail(guildIcon)
                .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon });

            await interaction.channel.send({ content: `<@${interaction.user.id}> || <@${owner}>`, embeds: [logEmbed] });
            if (settings.ServerInfo?.line) await interaction.channel.send({ files: [settings.ServerInfo.line] });

        } else if (['add_user', 'remove_user'].includes(action)) {
            const modal = new ModalBuilder()
                .setCustomId(action === 'add_user' ? 'UniversalAddUserModalBuilder' : 'UniversalRemoveUserModalBuilder')
                .setTitle(action === 'add_user' ? 'اضافة عضو' : 'ازالة عضو')
                .addComponents([
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('targetUser')
                            .setLabel('اكتب ايدي العضو')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                ]);
            await interaction.showModal(modal);

        } else if (action === 'rename_ticket') {
            const modal = new ModalBuilder()
                .setCustomId('UniversalRenameTicketModalBuilder')
                .setTitle('تغيير اسم التذكره')
                .addComponents([
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('newName')
                            .setLabel('اكتب الاسم الجديد')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                ]);
            await interaction.showModal(modal);

        } else if (action === 'call_leader') {
            const modal = new ModalBuilder()
                .setCustomId('UniversalCallLeaderModalBuilder')
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

        } else if (action === 'reset_menu') {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
                .setDescription('**مرحبا بك ايها الاداري في قائمة مساعد الادارة\nبرجاء اختيار المساعدة التي تريدها من القائمة بالاسفل**')
                .setColor(settings.لون_الامبيد || '#2B2D31')
                .setThumbnail(guildIcon)
                .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon });

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('UniversalAdminHelpMenu')
                    .setPlaceholder('اختر نوع المساعده')
                    .addOptions([
                        { label: 'استدعاء صاحب التذكره', value: 'call_owner' },
                        { label: 'اضافة شخص', value: 'add_user' },
                        { label: 'ازالة شخص', value: 'remove_user' },
                        { label: 'تغيير اسم التذكره', value: 'rename_ticket' },
                        { label: 'استدعاء عليا', value: 'call_leader' },
                        { label: 'اعاده تعيين القايمه', value: 'reset_menu' },
                    ])
            );

            await interaction.update({ embeds: [embed], components: [row] });
        }
    }

    // 3. Handling ModalBuilder Submissions
    if (interaction.isModalSubmit()) {
        const guildName = interaction.guild.name;
        const guildIcon = interaction.guild.iconURL({ dynamic: true });

        if (interaction.customId === 'UniversalAddUserModalBuilder' || interaction.customId === 'UniversalRemoveUserModalBuilder') {
            const userid = interaction.fields.getTextInputValue('targetUser');
            const member = await interaction.guild.members.fetch(userid).catch(() => null);
            if (!member) return interaction.reply({ content: '❌ لم يتم العثور علي العضو.', ephemeral: true });

            if (interaction.customId === 'UniversalAddUserModalBuilder') {
                await interaction.channel.permissionOverwrites.create(member, {
                    ViewChannel: true,
                    SendMessages: true,
                    AttachFiles: true
                });
            } else {
                await interaction.channel.permissionOverwrites.delete(member);
            }

            const action = interaction.customId === 'UniversalAddUserModalBuilder' ? 'اضافة' : 'ازالة';
            const embed = new EmbedBuilder()
                .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
                .setDescription(`**تم ${action === 'اضافة' ? 'اضافة العضو' : 'ازالة العضو'} <@${userid}> بنجاح**`)
                .setColor(action === 'اضافة' ? 'Green' : 'Red')
                .setThumbnail(guildIcon)
                .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon });

            await interaction.reply({ content: `<@${interaction.user.id}> || <@${userid}>`, embeds: [embed] });
        }

        if (interaction.customId === 'UniversalRenameTicketModalBuilder') {
            const newName = interaction.fields.getTextInputValue('newName');
            await interaction.channel.setName(newName);
            const embed = new EmbedBuilder()
                .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
                .setColor(settings.لون_الامبيد || '#2B2D31')
                .setDescription(`**تم تغيير اسم التذكرة بنجاح إلى** \`${newName}\``)
                .setThumbnail(guildIcon)
                .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (interaction.customId === 'UniversalCallLeaderModalBuilder') {
            const reason = interaction.fields.getTextInputValue('reasonText');
            await interaction.channel.setName('مطلوب عليا');

            const embed = new EmbedBuilder()
                .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
                .setDescription(`
**طلب استدعاء عليا**

**• الاداري :** <@${interaction.user.id}>
**• السبب :** 
\`\`\`${reason}\`\`\`
**• ملاحظة :** برجاء الانتظار بدون منشن!
                `)
                .setColor(settings.لون_الامبيد || '#2B2D31')
                .setThumbnail(guildIcon)
                .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon });

            await interaction.reply({ content: `<@${interaction.user.id}> || <@&${settings.RoleCoOwner}>`, embeds: [embed] });
            if (settings.ServerInfo?.line) await interaction.channel.send({ files: [settings.ServerInfo.line] });
        }
    }
});
