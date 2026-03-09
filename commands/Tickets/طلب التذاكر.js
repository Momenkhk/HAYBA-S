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
    if (interaction.customId !== 'open_Ticket') return;

    const selectedValue = interaction.values[0];

    // Mapping for different ticket types
    const ticketTypes = {
        'TicketMzad': {
            name: 'مزاد',
            category: settings.CetagryTicket.Mzad,
            staffRole: settings.Admins.Mzad,
            countKey: 'Mzad',
            dbKey: 'Tickets_Mzad',
            description: '**- مرحباً بك في تذكرة المزاد.\n\nيرجى ملء البيانات المطلوبة لضمان سير المزاد بشكل صحيح وموثق.**',
            image: settings.ServerInfo.MzadImage,
            color: '#FFD700'
        },
        'TicketTashher': {
            name: 'قضاة',
            category: settings.CetagryTicket.Tasher,
            staffRole: settings.Admins.Kdaa,
            countKey: 'Tashher',
            dbKey: 'Tickets_Tashher',
            description: '**- مرحباً بك في تذكرة طلب قاضي.\n\nيرجى الضغط على زر "تقديم بلاغ" وتعبئة النموذج بالكامل مع إرسال الدلائل المطلوبة.**',
            image: settings.ServerInfo.ApplyImage,
            color: '#FF4500'
        },
        'TicketComplain': {
            name: 'شكوى',
            category: settings.CetagryTicket.complain,
            staffRole: settings.Admins.DiscordLeader,
            countKey: 'complaints',
            dbKey: 'Tickets_complaints',
            description: '**- مرحباً بك في قسم الشكاوى الإدارية.\n\nيرجى تعبئة استبيان الشكوى بوضوح تام وإرفاق كافة الأدلة والروابط المطلوبة.**',
            image: settings.ServerInfo.Orders,
            color: '#FF0000'
        },
        'TicketSupport': {
            name: 'support',
            category: settings.CetagryTicket.support,
            staffRole: settings.Admins.DiscordStaff,
            countKey: 'Supp',
            dbKey: 'Tickets_Support',
            description: `
**اهلا وسهلا في تكت الدعم الفني **

**• يمكنك شراء شي معين اذا كنت عضو من خلال الازرار بالاسفل**
            `,
            image: settings.ServerInfo.TicketImage,
        },
        'TicketSpin': {
            name: 'spin',
            category: settings.CetagryTicket.spin,
            staffRole: settings.Admins.DiscordStaff,
            countKey: 'spin',
            dbKey: 'Tickets_Spin',
            description: '**\n__مرحبا بك في عجلة الحظ__\n\n- للمشاركه في عجلة الحظ قم بالضغط على زر (شراء عجلة حظ) الموجود بالأسفل \n\n- يمكنك الاختيار عجلة حظ : Normal او vip\n**',
            image: settings.ServerInfo.SpinImage,
            color: '#FF1493'
        }
    };

    const config = ticketTypes[selectedValue];
    if (!config) return;

    await interaction.deferReply({ ephemeral: true });

    const blacklistData = await db.get(`BlackList`);
    const isBlacklisted = blacklistData?.find(t => t.userid === interaction.user.id && t.type === 'تكت');
    if (isBlacklisted) {
        const blEmbed = new EmbedBuilder().setColor('Red').setDescription('- **للأسف، أنت مدرج في القائمة السوداء ولا يمكنك فتح تذاكر حالياً.**');
        return await interaction.editReply({ embeds: [blEmbed] });
    }

    const DataTicketList = await dbTickets.get(config.dbKey) || [];
    const existingTicket = DataTicketList.find(t => t.userid === interaction.user.id && t.type === 'open');

    if (existingTicket) {
        let chan = interaction.guild.channels.cache.get(existingTicket.Ticket);
        if (!chan) {
            try {
                chan = await interaction.guild.channels.fetch(existingTicket.Ticket).catch(() => null);
            } catch (e) { }
        }

        if (chan) {
            const existEmbed = new EmbedBuilder().setColor('Yellow').setDescription(`- **لديك تذكرة مفتوحة بالفعل في قسم ${config.name} : <#${existingTicket.Ticket}>**`);
            return await interaction.editReply({ embeds: [existEmbed] });
        } else {
            const filteredList = DataTicketList.filter(t => t.Ticket !== existingTicket.Ticket);
            await dbTickets.set(config.dbKey, filteredList);
        }
    }

    const loadEmbed = new EmbedBuilder().setColor(config.color || settings.لون_الامبيد || 'Blue').setDescription('- **جاري تهيئة تذكرتك، يرجى الانتظار ثوانٍ معدودة...**');
    await interaction.editReply({ embeds: [loadEmbed] });

    const DataCount = await TC.get(config.countKey);
    const count = (DataCount?.count || 0) + 1;

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return await interaction.editReply({ content: '- **البوت يفتقد لصلاحية `إدارة القنوات` (Manage Channels) لإنشاء التذكرة.**' });
    }

    let TicketChannel;
    try {
        TicketChannel = await interaction.guild.channels.create({
            name: `${config.name}-${count}`,
            type: ChannelType.GuildText,
            parent: config.category,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel], type: 'role' },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles], type: 'member' },
                { id: config.staffRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles], type: 'role' },
                { id: settings.Admins.DiscordLeader, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles], type: 'role' }
            ]
        });
    } catch (error) {
        console.error("Ticket Creation Error:", error);
        return await interaction.editReply({ content: '- **فشل إنشاء التذكرة. تأكد من صلاحيات البوت.**' });
    }

    await TC.set(config.countKey, { count: count });

    const guildName = interaction.guild.name;
    const guildIcon = interaction.guild.iconURL({ dynamic: true });

    // --- Unified Container Style for ALL Tickets ---
    const mainEmbed = new EmbedBuilder()
        .setColor(settings.لون_الامبيد || config.color)
        .setDescription(config.description)
        .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
        .setThumbnail(guildIcon)
        .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon });

    const buttons = new ActionRowBuilder();

    if (selectedValue === 'TicketMzad') {
        buttons.addComponents(
            new ButtonBuilder().setCustomId('Mzad').setLabel('شراء مزاد').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ClaimTicket').setLabel('استلام التذكرة').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('MzadHelp').setLabel('مساعد الادارة').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('CloseTicket').setLabel('احذف التذكرة').setStyle(ButtonStyle.Danger)
        );
    } else if (selectedValue === 'TicketTashher') {
        buttons.addComponents(
            new ButtonBuilder().setCustomId('Apply_Blag').setLabel('تقديم بلاغ').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ClaimTicket_Tashher').setLabel('استلام التذكرة').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('KdaaHelp').setLabel('مساعد الادارة').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('CloseTicket').setLabel('احذف التذكرة').setStyle(ButtonStyle.Danger)
        );
    } else if (selectedValue === 'TicketComplain') {
        buttons.addComponents(
            new ButtonBuilder().setCustomId('Complaint').setLabel('تقديم شكوى').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('AdminssHelp').setLabel('مساعد الادارة').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('CloseTicket').setLabel('احذف التذكرة').setStyle(ButtonStyle.Danger)
        );
    } else if (selectedValue === 'TicketSupport') {
        buttons.addComponents(
            new ButtonBuilder().setCustomId('BuyShop').setLabel('الشراء').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ClaimTicket').setLabel('استلام التذكرة').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('AdminsHelp').setLabel('مساعد الادارة').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('CloseTicket').setLabel('احذف التذكرة').setStyle(ButtonStyle.Danger)
        );
    } else if (selectedValue === 'TicketSpin') {
        buttons.addComponents(
            new ButtonBuilder().setCustomId('BuySpin').setLabel('شراء عجلة').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('SpinHelp').setLabel('مساعد الادارة').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('CloseTicket').setLabel('احذف التذكرة').setStyle(ButtonStyle.Danger)
        );
    }

    const ticketData = {
        userid: interaction.user.id,
        time: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        claim: null,
        transcrept: null,
        NameTicket: TicketChannel.name,
        Ticket: TicketChannel.id,
        type: 'open'
    };

    if (Array.isArray(DataTicketList)) {
        await dbTickets.push(config.dbKey, ticketData);
    } else {
        await dbTickets.set(config.dbKey, [ticketData]);
    }

    const mentionContent = selectedValue === 'TicketSupport'
        ? `${interaction.user} || <@&${settings.Admins.DiscordStaff}>`
        : `**${interaction.user} || <@&${config.staffRole}>**`;

    await TicketChannel.send({
        content: mentionContent,
        embeds: [mainEmbed],
        components: [buttons]
    });

    if (settings.ServerInfo.line) {
        await TicketChannel.send({ files: [settings.ServerInfo.line] }).catch(() => { });
    }

    const successEmbed = new EmbedBuilder().setColor('Green').setDescription(`✅ **تم إنشاء تذكرتك بنجاح برقم #${count}**\n📍 **رومات التذكرة : ${TicketChannel}**`);
    await interaction.editReply({ embeds: [successEmbed] });
});
