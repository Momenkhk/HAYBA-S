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
const { client, db, settings } = require('../../index');

const moment = require('moment');
const { createEmbed } = require('../../function/function/Embed');

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId == 'RedBull_Helber') {
        const selectedValue = interaction.values[0];


        if (selectedValue == 'فحص بوست') {
            if (!interaction.member.roles.cache.has(settings.Admins.DiscordStaff)) return await interaction.reply({ content: `**انت ادارة ؟؟؟ 😅**`, ephemeral: true })

            const ModalBuilderCheck = new ModalBuilder()
                .setCustomId('CheckBosts')
                .setTitle('لفحص بوست')
                .setComponents();

            const Info = new TextInputBuilder()
                .setCustomId('Info')
                .setLabel('اي البوست الي عاوز تفحصه ؟')
                .setPlaceholder('حط ايدي العضو')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(Info);

            await ModalBuilderCheck.addComponents(row);
            await interaction.showModal(ModalBuilderCheck);
        }
    }
});
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId == 'CheckBosts') {
        const userId = interaction.fields.getTextInputValue('Info');

        const guildId = interaction.guild.id;
        const guild = await client.guilds.fetch(guildId);

        const member = await guild.members.fetch(userId);

        const isBooster = member.premiumSince !== null;

        if (isBooster) {
            const boostDate = moment(member.premiumSince);
            const now = moment();

            const duration = moment.duration(now.diff(boostDate));
            const weeksPassed = Math.floor(duration.asWeeks());

            const remainingDays = 7 - (weeksPassed % 7);

            const boosterEmbed = createEmbed({
                interaction: interaction,
                title: `تفاصيل الـ Boost`,
                description: `العضو <@${userId}> قام بعمل Boost للسيرفر.`,
                fields: [
                    { name: 'تاريخ الـ Boost', value: boostDate.format('YYYY-MM-DD HH:mm:ss') },
                    { name: 'مضى على الـ Boost', value: `${weeksPassed} أسبوعًا و ${duration.days()} يومًا` },
                    { name: 'الوقت المتبقي للاسبوع القادم', value: `${remainingDays} أيام` },
                ],
            });
            await interaction.update({ embeds: [boosterEmbed] });
        } else {
            const notBoosterEmbed = createEmbed({
                interaction: interaction,
                title: `تفاصيل الـ Boost`,
                description: `العضو <@${userId}> لم يقم بعمل Boost للسيرفر`,
            });
            await interaction.update({ embeds: [notBoosterEmbed] });
        }
    }
});
