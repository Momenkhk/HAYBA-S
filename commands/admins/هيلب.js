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
const { client, db, dbpoint, settings } = require('../../index');



function createLocalEmbed({ interaction, title, fields }) {
    return new EmbedBuilder()
        .setTitle(title)
        .addFields(fields)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `${interaction.member.displayName}`, iconURL: interaction.member.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(settings.prefix + 'help')) {

        const isOwner = settings.Owners.includes(message.author.id);
        const hasLeaderRole = message.member.roles.cache.has(settings.Admins.DiscordLeader);

        if (!isOwner && !hasLeaderRole) {
            return message.channel.send("**- ليس لديك صلاحيات كافية لاستخدام هذا الأمر.**");
        }

        const owners = settings.Owners.map(id => `<@${id}>`).join(' - ');

        const mainEmbed = new EmbedBuilder()
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setTitle('مركز المساعدة والدعم')
            .setDescription(`**أهلاً بك في نظام الإدارة الشامل لـ ${message.guild.name}**\n\n` +
                `** معلومات البوت الأساسية:**\n` +
                `> • **Prefix:** \`${settings.prefix}\`\n` +
                `> • **Owners:** ${owners}\n` +
                `> • **Bank ID:** <@${settings.BankID}>\n\n` +
                `** كيفية الاستخدام:**\n` +
                `يرجى اختيار فئة الأوامر التي تود استكشافها من القائمة المنسدلة أدناه. كل قسم يحتوي على شرح مفصل لكل أمر.`)
            .setColor(settings.لون_الامبيد || '#2B2D31')
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setFooter({ text: `Requested by ${message.member.displayName}`, iconURL: message.member.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_menu')
                .setPlaceholder('اختر نوع الأوامر')
                .addOptions([
                    {
                        label: 'اوامر اداريه',
                        value: 'admin_commands',
                    },
                    {
                        label: 'اوامر عليا',
                        value: 'high_commands',

                    },
                    {
                        label: 'اوامر اونارات',
                        value: 'owner_commands',
                    },
                    {
                        label: 'اختصارات الاداره',
                        value: 'shortcuts',
                    }
                ])
        );

        const msg = await message.channel.send({ embeds: [mainEmbed], components: [selectMenu] });

        const filter = (i) => i.customId === 'help_menu' && i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (!interaction.isStringSelectMenu()) return;

            if (interaction.values[0] === 'admin_commands') {
                const embed = createLocalEmbed({
                    interaction,
                    title: 'اوامر إدارية',
                    fields: [
                        { name: settings.prefix + 'come', value: 'لأستدعاء عضو', inline: false },
                        { name: settings.prefix + 'helper', value: 'مساعد الادارة', inline: false }
                    ]
                });
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (interaction.values[0] === 'high_commands') {
                const embed = createLocalEmbed({
                    interaction,
                    title: 'اوامر العليا',
                    fields: [
                        { name: settings.prefix + 'embed', value: 'لأنشاء امبيد', inline: false },
                        { name: settings.prefix + 'say', value: 'لأنشاء كلام من خلال البوت', inline: false },
                        { name: settings.prefix + 'blacklist', value: 'لأعطاء احد بلاك ليست', inline: false },
                        { name: settings.prefix + 'remove-blacklist', value: 'لأزالة بلاك ليست من شخص', inline: false },
                        { name: settings.prefix + 'تصفير', value: 'لتصفير جميع التحذيرات والتكتات', inline: false },
                        { name: settings.prefix + 'mr', value: 'لفحص اعضاء رتبة معينه', inline: false },
                        { name: settings.prefix + 'نقاط', value: 'لعرض بيانات الاداري مثل عدد تكتاته وتحذيراته', inline: false },
                        { name: settings.prefix + 'فحص', value: 'لعرض بيانات جميع الاداره مثل عدد تكتاته وتحذيراته', inline: false },
                        { name: settings.prefix + 'help', value: 'لأنشاء امبيد الاوامر', inline: false },
                        { name: settings.prefix + 'edit', value: 'لتعديل علي رسايل البوت', inline: false },
                        { name: settings.prefix + 'dm', value: 'لارسال رساله في خاص العضو', inline: false },
                        { name: settings.prefix + 'sub', value: 'لانشاء روم خاصة', inline: false },
                        { name: settings.prefix + 'give-spin', value: 'لاعطاء لفه مجانيه', inline: false },
                        { name: settings.prefix + 'remove', value: 'لازاله شخص من قايمه النصابين', inline: false }
                    ]
                });
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (interaction.values[0] === 'shortcuts') {
                const embed = createLocalEmbed({
                    interaction,
                    title: 'اختصارات الاداره',
                    fields: [
                        { name: 'الردود التلقايا', value: 'شعار - حول - خمول - منشور - شفر - بروبوت - دلائل', inline: false }
                    ]
                });
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            if (interaction.values[0] === 'owner_commands') {
                const embed = createLocalEmbed({
                    interaction,
                    title: 'اوامر اونارات',
                    fields: [
                        { name: settings.prefix + 'log-create', value: 'لانشاء رومات اللوج', inline: false },
                        { name: settings.prefix + 'log-delete', value: 'لحذف رومات اللوج', inline: false },
                        { name: settings.prefix + 'setup-rules', value: 'لارسال قايمه القوانين', inline: false },
                        { name: settings.prefix + 'set-rules', value: 'لتعديل علي قوانين', inline: false },
                        { name: settings.prefix + 'setup-info', value: 'لارسال قايمه المعلومات', inline: false },
                        { name: settings.prefix + 'set-info', value: 'لتعديل علي المعلومات', inline: false },
                        { name: settings.prefix + 'setup-ticket', value: 'لانشاء نظام التذاكر', inline: false },
                        { name: settings.prefix + 'setup-spin', value: 'لانشاء نظام التذاكر عجلة الحظ', inline: false },
                        { name: settings.prefix + 'setup-scam', value: 'لانشاء بانل مخصصه للنصابين', inline: false },
                        { name: settings.prefix + 'setup-ads', value: 'لانشاء بانل الاعلانات', inline: false },
                        { name: settings.prefix + 'setup-posts', value: 'لأنشاء بانل منشورات مميزه', inline: false },
                        { name: settings.prefix + 'setup-tashfer', value: 'لأنشاء بانل تشفير كلمات الممنوعه', inline: false },
                        { name: `- ${settings.prefix}setup-order`, value: 'لأنشاء بانل الطلبات الجديد', inline: false },
                        { name: `- ${settings.prefix}setup-noti`, value: 'لأنشاء بانل اشعارات البائعين', inline: false },
                        { name: `- ${settings.prefix}apply`, value: 'لأرسال بانل التقديم', inline: false },
                        { name: `- ${settings.prefix}setup-wseet`, value: 'لانشاء نظام تذاكر الوسيط', inline: false },




                    ]
                });
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        });

        collector.on('end', () => {

            msg.edit({ components: [] }).catch(() => { });

        });

    }

});
