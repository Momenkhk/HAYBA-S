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

const moment = require('moment');
const { createEmbed } = require('../../function/function/Embed');

const but = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId('CancelButton')
        .setLabel('الغاء العملية ؟')
        .setStyle(ButtonStyle.Danger)
);

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'RedBull_Helber') {
        const selectedValue = interaction.values[0];

        if (selectedValue === 'فحص تحذير') {
            if (!interaction.member.roles.cache.has(settings.Admins.DiscordStaff)) {
                return await interaction.reply({ content: `**انت ادارة ؟؟؟ 😅**`, ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId('CheckWarns')
                .setTitle('لفحص تحذير');

            const infoRow = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('Info')
                    .setLabel('اي التحذير الي عاوز تفحصه ؟')
                    .setPlaceholder('حط ايدي العضو')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            );

            modal.addComponents(infoRow);
            await interaction.showModal(modal);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId === 'CheckWarns') {
        const info = interaction.fields.getTextInputValue('Info');

        const embed1 = createEmbed({
            interaction: interaction,
            title: `مراجعة البيانات`,
            description: `يرجى الانتظار جاري فحص البيانات بالكامل... ✅`
        });

        await interaction.update({ embeds: [embed1] });

        const data = await db.get("Data_Warns") || [];
        const warnData = data.filter((t) => t.userid == info);

        if (!warnData || warnData.length === 0) {
            const errorEmbed = createEmbed({
                interaction: interaction,
                title: `خطأ`,
                description: `لم يتم العثور على اي بيانات خاصه بالايدي الذي وضعته ❌`
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        const warnOptions = warnData.map(warn => {
            const timestamp = moment(warn.time, 'X').isValid() ? moment(warn.time, 'X').unix() : 0;
            const formattedDate = timestamp !== 0 ? moment.unix(timestamp).format('D/M/YYYY [الساعة] h:mm A') : 'تاريخ غير معروف';

            return {
                label: `تحذير رقم ${warn.warn}`,
                value: String(warn.time),
                description: `تاريخ التحذير: ${formattedDate}`
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('WarnSelector')
            .setPlaceholder('اختار التحذير الذي تريد فحصه')
            .addOptions(warnOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed2 = createEmbed({
            interaction: interaction,
            title: `اختر التحذير`,
            description: `اختر التحذير الذي تريد فحصه من السيلكت منيو`
        });

        await interaction.editReply({ embeds: [embed2], components: [row, but] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'WarnSelector') {
        const selectedWarnId = interaction.values[0];

        const selectedWarnData = await db.get("Data_Warns") || [];
        const selectedWarn = selectedWarnData.find((w) => w.time == selectedWarnId);

        if (!selectedWarn) {
            const errorEmbed = createEmbed({
                interaction: interaction,
                title: `خطأ`,
                description: `لم يتم العثور على بيانات للتحذير المحدد`
            });
            return await interaction.update({ embeds: [errorEmbed] });
        }
        const images = (selectedWarn.image || []).flat();

        const warnEmbed = createEmbed({
            interaction: interaction,
            title: `تفاصيل التحذير`,
            fields: [
                { name: 'العضو', value: `<@${selectedWarn.userid}>` },
                { name: 'الاداري', value: `<@${selectedWarn.staff}>` },
                { name: 'الوقت', value: `${selectedWarn.time}`, inline: true },
                { name: 'السبب', value: selectedWarn.reason || 'لا يوجد سبب' },
                { name: 'محتوى الرسالة', value: selectedWarn.info || 'لا يوجد محتوى' }
            ],
        });

        await interaction.update({ embeds: [warnEmbed] });
        if (images.length > 0) {
            await interaction.channel.send({
                content: `**# دي الدلائل :**`,
                files: images.map(img => ({ attachment: img, name: 'image.png' }))
            }).catch(() => { });
        }
    }
});

