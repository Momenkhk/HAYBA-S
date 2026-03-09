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
const { RBPrefix } = require('../../config/settings');

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.content === `${settings.prefix}apply`) {
        if (!settings.Owners.includes(message.author.id)) return;

        const staffSettings = settings.Apply.staff;
        // const KdaaSettings = settings.Apply.Kdaa; // Removed as per instruction
        // const WasetSettings = settings.Apply.Waset; // Removed as per instruction

        // const options = { // Removed as per instruction
        //     TitleEm: `تقديم على ادارة سيرفر ${message.guild.name}`,
        //     ImageEm: settings.ServerInfo.ApplyImage,
        //     colorEm: settings.لون_الامبيد,
        //     DesEm: `**الشعار اجباري و ليس اختياري
        // تقدم مرتين بدون شعار = @♜ || ممنوع من التقديم :
        // ملاحظات :
        // يوجد رواتب ( 2500 كريدت على كل تكت - 1500 كريدت على كل تحذير )
        // يوجد رتبه بيـع خاصة بالادارة طول فترة تواجدك
        // يوجد منشورات مميزة كل 30 تكت تكملها
        // يوجد رتبه افصل اداري اسبوعيا..**`,
        //     FiledsEm : []
        // };

        //const embed = createEmbed(message, options.TitleEm, options.ImageEm, options.colorEm, options.DesEm , options.FiledsEm);
        const embed = createEmbed(
            {
                interaction: message,
                title: `تقديم على ادارة سيرفر ${message.guild.name}`,
                image: settings.ServerInfo.ApplyImage,
                color: settings.لون_الامبيد,
                description: `**الشعار اجباري و ليس اختياري
    تقدم مرتين بدون شعار = @♜ || ممنوع من التقديم :
    ملاحظات :
    يوجد رواتب ( 2500 كريدت على كل تكت - 1500 كريدت على كل تحذير )
    يوجد رتبه بيـع خاصة بالادارة طول فترة تواجدك
    يوجد منشورات مميزة كل 30 تكت تكملها
    يوجد رتبه افصل اداري اسبوعيا..**`,
            }
        );


        const staffButton = new ButtonBuilder()
            .setCustomId('staffButton')
            .setLabel('تقديم اداري')
            .setStyle(staffSettings.type ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(!staffSettings.type);


        const row = new ActionRowBuilder().addComponents(staffButton);

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

///////// اداري 
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId == 'staffButton') {

        if (!interaction.user.displayName.startsWith(RBPrefix) &&
            !interaction.user.displayName.startsWith(`!${RBPrefix}`) &&
            !interaction.user.displayName.startsWith(`! ${RBPrefix}`)) {
            return await interaction.reply({
                content: `**لازم تحط شعارك الاول زي كدا ${RBPrefix} | اسمك**`,
                ephemeral: true
            });
        }
        const nameInput = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('اسمك اي ؟')
            .setPlaceholder('مثال : محمد')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const ageInput = new TextInputBuilder()
            .setCustomId('age')
            .setLabel('كام عمرك ؟')
            .setPlaceholder('مثال : 18')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const countryInput = new TextInputBuilder()
            .setCustomId('country')
            .setLabel('انت منين ؟')
            .setPlaceholder('مثال : مصر')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const hoursInput = new TextInputBuilder()
            .setCustomId('hours')
            .setLabel('كام عدد ساعات تفاعلك؟')
            .setPlaceholder('مثال : 14 ساعه فاليوم')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);


        const infoInput = new TextInputBuilder()
            .setCustomId('info')
            .setLabel('ازاي هتقدر تفيدنا؟')
            .setPlaceholder('مثال : بعرف استلم تكتات واتعامل فيها , براقب رومات البيع')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(nameInput);
        const row2 = new ActionRowBuilder().addComponents(ageInput);
        const row3 = new ActionRowBuilder().addComponents(countryInput);
        const row4 = new ActionRowBuilder().addComponents(hoursInput);
        const row5 = new ActionRowBuilder().addComponents(infoInput);


        const modal = new ModalBuilder()
            .setCustomId('staffModalBuilder')
            .setTitle('املأ الاستبيان');

        modal.addComponents(row1, row2, row3, row4, row5);


        await interaction.showModal(modal);
    }
});
