const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require('discord.js');
const { client, db, settings } = require('../../index');

client.on('messageCreate', async message => {
    if (message.content === settings.prefix + 'setup-ticket') {
        if (!settings.Owners.includes(message.author.id)) return;

        const guildName = message.guild.name;
        const guildIcon = message.guild.iconURL({ dynamic: true });

        const imageEmbed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setImage(settings.ServerInfo.TicketImage || 'https://i.postimg.cc/pT2QCf9p/Untitled553-20251104174502.png');

        const contentEmbed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
            .setDescription(`
**اذا عندك سؤال , عايز تشتري رتبة / اعلان / منشور مميز الخ.. اختار الدعم الفني**

**ملاحظات :**

**تفتح شكوى و تكون على حد مش من طاقم الادارة = مخالفة**
**استهبال بالتكتات = مخالفة**
**تفتح تكت ملهاش علاقة بالي عايزه , مثال : تفتح شكوى و عايز تشتري رتبة = مخالفة**

**المخالفة تختلف حسب الغلطة الي سويتها**
            `)
            .setThumbnail(guildIcon)
            .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon });

        const options = [];

        if (settings.Tickets?.TicketSupport) {
            options.push({
                label: 'الدعم الفني',
                description: 'لشراء الرتب، الإعلانات، والمنشورات المميزة',
                value: 'TicketSupport',
            });
        }

        if (settings.Tickets?.TicketComplain) {
            options.push({
                label: 'شكوى ',
                description: 'لتقديم بلاغ رسمي ضد أحد أعضاء الإدارة',
                value: 'TicketComplain',
            });
        }
        if (settings.Tickets?.TicketsKdaa) {
            options.push({
                label: 'طلب قاضي',
                description: 'للتحكيم والتبليغ عن عمليات النصب',
                value: 'TicketTashher',
            });
        }
        if (settings.Tickets?.TicketsMzad) {
            options.push({
                label: 'طلب مزاد',
                description: 'لبدء مزاد جديد على سلعة معينة',
                value: 'TicketMzad',
            });
        }

        if (options.length === 0) {
            return message.reply("❌ **لا يوجد أي خيار مفعل في الإعدادات لإظهار قائمة التكتات.**");
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('open_Ticket')
                    .setPlaceholder('حابب تفتح تكت ؟')
                    .addOptions(options)
            );

        await message.delete().catch(() => { });
        await message.channel.send({ embeds: [imageEmbed, contentEmbed], components: [row] });
    }
});
