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
const { client, db, TC, dbTickets, settings } = require('../../index');

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'open_Waseet') return;

    const selectedValue = interaction.values[0];
    const wasetNumber = selectedValue.replace('Waseet', '');

    if (!['1', '2', '3', '4', '5'].includes(wasetNumber)) return;

    const categoryID = settings.Wasset[`wasset${wasetNumber}cat`];
    if (!categoryID) {
        return await interaction.reply({ content: `❌ لا يمكن العثور على التصنيف المناسب لهذا الاختيار.`, ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    // Safety check for message components
    try {
        if (interaction.message) {
            await interaction.message.edit({ components: interaction.message.components });
        }
    } catch (e) { }

    const blacklist = await db.get(`BlackList`);
    const isBlacklisted = blacklist?.find(t => t.userid === interaction.user.id && t.type === 'تكت');
    if (isBlacklisted) {
        return await interaction.editReply({ content: `**لديك بلاك ليست تكت , لا يمكنك انشاء تذكره | ❌**` });
    }

    const ticketKey = `waset${wasetNumber}`;
    const ticketDBKey = `Tickets_waset${wasetNumber}`;
    const DataCount = await TC.get(ticketKey);
    const DataTicket = await dbTickets.get(ticketDBKey);
    const existing = DataTicket?.find(t => t.userid === interaction.user.id);

    if (existing && existing.type === 'open') {
        const chan = interaction.guild.channels.cache.get(existing.Ticket);
        return await interaction.editReply({ content: `**لديك تذكرة بالفعل يجب إغلاقها أولا ${chan ? `<#${existing.Ticket}>` : `#معلومة-مفقودة`} | 😅**` });
    }

    await interaction.editReply({ content: `**جاري انشاء التذكرة الان | 🥰**` });

    const count = DataCount?.count || 1;
    const channel = await interaction.guild.channels.create({
        name: `med-${count}`,
        type: ChannelType.GuildText,
        parent: categoryID,
        permissionOverwrites: [
            {
                id: interaction.guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel],
                type: 'role'
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
                type: 'member'
            },
            {
                id: settings.Admins.DiscordStaff,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
                type: 'role'
            }
        ]
    });

    if (DataCount) {
        DataCount.count++;
        await TC.set(ticketKey, DataCount);
    } else {
        await TC.set(ticketKey, { count: 2 });
    }

    const embed = new EmbedBuilder()
        .setColor(settings.لون_الامبيد || 'Blue')
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setImage('https://media.discordapp.net/attachments/1207553954515255327/1207598850710183936/18.png')
        .setDescription(`**- مرحبا بك عزيزي العضو في تكت الوسيط. \n\n برجاء مليء البيان الذي في الاسفل لكي تتم عمليه الوساطه*`);

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('Byan')
            .setLabel('مليء البيانات')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`WasetHelp${wasetNumber}`)
            .setLabel('مساعد الوسيط')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('ClaimTicket')
            .setLabel('استلام التذكرة')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('CloseTicket')
            .setLabel('احذف التذكرة')
            .setStyle(ButtonStyle.Danger),
    );

    const ticketData = {
        userid: interaction.user.id,
        time: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        claim: null,
        transcrept: null,
        Buys: null,
        NameTicket: channel.name,
        Ticket: channel.id,
        type: selectedValue
    };

    if (Array.isArray(DataTicket)) {
        await dbTickets.push(ticketDBKey, ticketData);
    } else {
        await dbTickets.set(ticketDBKey, [ticketData]);
    }

    await channel.send({
        content: `${interaction.user} || <@&${settings.Admins.DiscordStaff}>`,
        embeds: [embed],
        components: [buttons]
    });

    if (interaction.message.attachments.size > 0) {
        const files = interaction.message.attachments.map(a => a.url);
        await channel.send({ files });
    }

    if (settings.ServerInfo.line) await channel.send({ files: [settings.ServerInfo.line] });

    await interaction.editReply({ content: `**تم انشاء التذكرة بنجاح ${channel} | ✅**` });
});
