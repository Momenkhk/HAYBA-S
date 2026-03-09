const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} = require('discord.js');
const { client, db, settings } = require('../../index');

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'BuyShop') {

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_Buy')
                .setPlaceholder(`حابب تشتري اي ؟ ${interaction.member.displayName}`)
                .addOptions([
                    {
                        label: "الرتب",
                        description: "لـ شراء الرتب العامة او ازالة تحذير او نقل رتب",
                        value: "Buy_Role",
                    },
                    {
                        label: "الأعلانات",
                        description: "لـ شراء اعلان لسيرفرك",
                        value: "Buy_Ads_Mention",
                    },
                    {
                        label: "المنشورات المميزة",
                        description: "لـ شراء منشور مميز",
                        value: "Buy_Post",
                    },
                    {
                        label: "الرومات الخاصة",
                        description: "لـ شراء روم خاص او تجديد روم خاص",
                        value: "Buy_Privte_Room",
                    },
                ])
        );

        const but = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('CancelButton')
                .setLabel('الغاء العملية ؟')
                .setStyle(ButtonStyle.Danger)
        );

        const guildName = interaction.guild.name;
        const guildIcon = interaction.guild.iconURL({ dynamic: true });

        // Container Builder Style
        const Emmed = new EmbedBuilder()
            .setColor(settings.لون_الامبيد || '#2B2D31')
            .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
            .setThumbnail(guildIcon)
            .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon })
            .setDescription(`
**اهلا بك في قائمة الشراء**

**• الرتب :** شراء الرتب العامة او ازالة تحذيرات او نقل الرتب
**• المنشورات المميزة :** شراء منشور مميز
**• الاعلانات :** شراء اعلان لسيرفرك
**• الرومات الخاصة :** شراء روم خاص لنشر منتجاتك
            `);

        await interaction.reply({
            embeds: [Emmed],
            components: [row, but]
        });
    }
});
