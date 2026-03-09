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
    ApplicationCommandType
} = require('discord.js');
const { client, db, settings, dbCloseTicket, dbTickets } = require('../../index');
const moment = require('moment');

const { createEmbed } = require('../../function/function/Embed')


client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return
    if (interaction.customId == 'RedBull_Helber') {
        const selectedValue = interaction.values[0];
        if (selectedValue == 'فحص تكت') {
            if (!interaction.member.roles.cache.has(settings.Admins.DiscordLeader)) return await interaction.reply({ content: `**للعليا بس 🙂**`, ephemeral: true })

            const ModalBuilderCheck = new ModalBuilder()
                .setCustomId('CheckTickets')
                .setTitle('لفحص تكت')
                .setComponents()

            const Info = new TextInputBuilder()
                .setCustomId('Info')
                .setLabel('اي التكت الي عاوز تفحصه ؟')
                .setPlaceholder('حط ايدي التكت او ايدي صاحب التذكرة')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)

            const Type = new TextInputBuilder()
                .setCustomId('Type')
                .setLabel('نوع التكت ؟')
                .setPlaceholder('شكوي أو الدعم الفني أو قضاة أو مزاد أو الوساطه أو عجلة')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)

            const row = new ActionRowBuilder().addComponents(Info)
            const row2 = new ActionRowBuilder().addComponents(Type)

            await ModalBuilderCheck.addComponents(row, row2);
            await interaction.showModal(ModalBuilderCheck)

        }

    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId == 'CheckTickets') {
        const info = interaction.fields.getTextInputValue('Info');
        const Type = interaction.fields.getTextInputValue('Type');

        if (!['الدعم الفني', 'قضاة', 'مزاد', 'عجلة', 'الوساطه', 'شكوي'].includes(Type)) {
            const embed = createEmbed({
                interaction: interaction,
                title: `خطأ`,
                description: `يجب عليك تحديد نوع التكت الذي تود فحصه (قضاة أو الدعم الفني أو مزاد أو الوساطه أو عجلة أو شكوي)`
            });

            return await interaction.update({ embeds: [embed] });
        }
        const embed1 = createEmbed({
            interaction: interaction,
            title: `مراجعة البيانات`,
            description: `يرجى الانتظار جاري فحص البيانات بالكامل... ✅`
        });
        await interaction.update({ embeds: [embed1] });

        const data = await dbCloseTicket.get(Type === 'الدعم الفني' ? 'Tickets_Support' : Type === 'قضاة' ? 'Tickets_Tashher' : Type === 'مزاد' ? 'Tickets_Mzad' : Type === 'عجلة' ? 'Tickets_Spin' : Type === 'الوساطه' ? 'Tickets_Waset' : Type === 'شكوي' ? 'Tickets_complaints' : null);
        const ticketData = data?.find((t) => t.userid == info || t.Ticket == info);

        if (!ticketData) {
            const embed1 = createEmbed({
                interaction: interaction,
                title: `خطأ`,
                description: `لم يتم العثور علي اي بيانات خاصه بالايدي الذي وضعته ❌`
            });
            return await interaction.editReply({ embeds: [embed1] });
        }
        const ticketOptions = data.map(ticket => {
            const ticketDate = ticket.time;
            const timestamp = parseInt(ticketDate.match(/<t:(\d+):R>/)[1]);

            const formattedDate = moment.unix(timestamp).format('D/M/YYYY [الساعة] h:mm A');
            return {
                label: ticket.NameTicket,
                value: ticket.Ticket,
                description: `تاريخ التذكرة: ${formattedDate}`
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('TicketSelector')
            .setPlaceholder('اختار التكت الي عاوز تشوفه')
            .addOptions(ticketOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed2 = createEmbed({
            interaction: interaction,
            title: `اختر التكت`,
            description: `اختر التكت الذي تريد فحصه من السيلكت منيو`
        });
        const but = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('CancelButton')
                .setLabel('الغاء العملية ؟')
                .setStyle(ButtonStyle.Danger)
        )
        await interaction.editReply({ embeds: [embed2], components: [row, but] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId == 'TicketSelector') {
        const selectedTicketId = interaction.values[0];

        const selectedTicketData = await dbCloseTicket.get(`Tickets_Support` || `Tickets_Tashher || Tickets_Mzad || Tickets_Spin || Tickets_Waset || Tickets_complaints`);
        const exit = selectedTicketData?.find((t) => t.Ticket == selectedTicketId)
        if (!exit) {
            const errorEmbed = createEmbed({
                interaction: interaction,
                title: `خطأ`,
                description: `لم يتم العثور على بيانات للتكت المحدد`
            });
            return await interaction.update({ embeds: [errorEmbed] });
        }

        const ticketEmbed = createEmbed({
            interaction: interaction,
            title: `تفاصيل التذكرة`,
            fields: [
                { name: 'ايدي التذكرة', value: exit.Ticket },
                { name: 'صاحب التذكرة', value: `<@${exit.userid}>` },
                { name: 'الوقت', value: `${exit.time}`, inline: true },
                { name: 'الاستلام', value: exit.claim ? `<@${exit.claim}>` : 'لا يوجد' },
                { name: 'الترانسكريبت', value: exit.transcrept ? `[الترانسكريبت](${exit.transcrept})` : 'لا يوجد' },
                { name: 'عمليات الشراء', value: exit.Buys || 'لا يوجد' }
            ]
        });

        await interaction.update({ embeds: [ticketEmbed] });
    }
});
