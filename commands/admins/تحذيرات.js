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
    ChannelType,
    ComponentType,
    MessageFlags
} = require('discord.js');
const { client, settings, dbpoint, db } = require('../../index');
const { createEmbed } = require('../../function/function/Embed');
const Roles = require('../../config/Roles')
const RolesSellers = Roles.RolesSellers
const RoleWarns = Roles.WarnsRole
const warn25 = RoleWarns[0].Warn25
const warn50 = RoleWarns[0].warn50
const warn100 = RoleWarns[0].warn100;

const defaultReasons = [
    'منشن ايفري > سحب رتبه',
    'سحب رتبة بدون سبب > سحب رتبه',
    'بيع كريديت > سحب رتبه',
    'بيع طريقة عن طريق دخول سيرفر > سحب رتبه',
    'اشياء +18 > سحب رتبه',
    'طلب/الاستهبال برومات البيع > سحب رتبه',
    'ذكر اسماء سيرفرات > سحب رتبه',
    'نسخ منشور شخص اخر > سحب رتبه',
    'شراء سلعه واعادة بيعها بدون موافقه البائع > سحب رتبه',
    'نشر 3 مرات او اكثر دون انتظار ساعة > سحب رتبه',
    'طرق نيترو > سحب رتبه',
    'طرق كريديت > سحب رتبه',
    'ادوات اختراق/تهكير > سحب رتبه',
    'نشر بطاقة قوقل بسياسات > سحب رتبه',
    'نشر شي يخص الديس بروم غير الديس > تحذير',
    'عدم تشفير بشكل صحيح > تحذير',
    'مخالفه حد الصور > تحذير',
    'نشر بروم غلط > تحذير',
    'نشر مرتين دون انتظار ساعة > تحذير',
    'مخالفة قوانين الرتبه > تحذير',
];

client.on('interactionCreate', async interaction => {
    if (!interaction.isMessageContextMenuCommand()) return;
    if (interaction.commandName == 'Warn seller') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!interaction.member.roles.cache.has(settings.Admins.DiscordStaff)) return interaction.editReply({ content: 'ليس لديك صلاحية لاستخدام هذا الأمر.' });

        // Fetch reasons from DB or initialize defaults
        let reasons = await db.get('WarnReasons');
        if (!reasons || reasons.length === 0) {
            reasons = defaultReasons.map(r => {
                const type = r.includes('تحذير') ? 'تحذير' : 'سحب رتبه';
                return { text: r, type: type };
            });
            await db.set('WarnReasons', reasons);
        }

        const embed = createEmbed({
            interaction: interaction,
            title: `تحذير بائع جديد`,
            description: `انت على وشك تحذير ${interaction.targetMessage.author} يرجى اختيار سبب التحذير من الأسفل`,
        });

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('selectReason')
                .setPlaceholder(`${interaction.user.displayName} اي سبب التحذير ؟`)
                .addOptions(reasons.map((r, i) => ({ label: r.text.substring(0, 100), value: i.toString() })))
        );

        const replyMessage = await interaction.editReply({ embeds: [embed], components: [row] });

        const filter = i => i.customId === 'selectReason' && i.user.id === interaction.user.id;

        const collector = replyMessage.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, time: 120000 });
        collector.on('collect', async i => {
            await i.deferUpdate().catch(() => { });

            const index = parseInt(i.values[0]);
            const selectedReasonObj = reasons[index];

            if (!selectedReasonObj) return interaction.followUp({ content: 'حدث خطأ في تحديد السبب.', ephemeral: true });

            const selectedReason = selectedReasonObj.text;
            const warningType = selectedReasonObj.type;

            const Room = interaction.guild.channels.cache.get(settings.Rooms.Warns);

            const sellerName = interaction.targetMessage.author;
            const adminName = interaction.user;
            const images = interaction.targetMessage.attachments.map(attachment => attachment.url) || [];
            const attachments = [];

            for (const photoUrl of images) {
                const attachment = new AttachmentBuilder(photoUrl);
                attachments.push(attachment);
            }


            const guildMember = await interaction.guild.members.fetch(interaction.targetMessage.author.id).catch(() => null);
            if (!guildMember) return interaction.followUp({ content: 'تعذر العثور على العضو في السيرفر.', ephemeral: true });

            if (warningType === 'تحذير') {
                if (!guildMember.roles.cache.has(warn25)) {
                    await guildMember.roles.add(warn25).catch(console.error);
                } else if (guildMember.roles.cache.has(warn25) && !guildMember.roles.cache.has(warn50)) {
                    await guildMember.roles.add(warn50).catch(console.error);
                } else if (guildMember.roles.cache.has(warn50) && !guildMember.roles.cache.has(warn100)) {
                    await guildMember.roles.add(warn100).catch(console.error);
                } else if (guildMember.roles.cache.has(warn100)) {
                    await guildMember.roles.remove([warn25, warn50, warn100]).catch(console.error);
                    for (const roleId of RolesSellers) {
                        if (guildMember.roles.cache.has(roleId)) {
                            await guildMember.roles.remove(roleId).catch(console.error);
                        }
                    }
                }
            } else if (warningType === 'سحب رتبه') {
                const rolesToRemove = [warn25, warn50, warn100, ...RolesSellers];
                await guildMember.roles.remove(rolesToRemove).catch(console.error);
            }

            const warnEmbed = createEmbed({
                interaction: interaction,
                title: `تحذير جديد`,
                fields: [
                    { name: `البائع`, value: `${sellerName}`, inline: true },
                    { name: `الاداري`, value: `${adminName}`, inline: true },
                    { name: `التحذير`, value: `${selectedReason}`, inline: true },
                    { name: `الروم`, value: `${interaction.channel}`, inline: true },
                    { name: `وقت نشر المنشور`, value: `<t:${Math.floor(interaction.targetMessage.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: `وقت التحذير`, value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    {
                        name: `الدلائل`,
                        value: interaction.targetMessage.content ? `\`\`\`${interaction.targetMessage.content.slice(0, 1000)}${interaction.targetMessage.content.length > 1000 ? '...' : ''}\`\`\`` : "لا يوجد نص",
                        inline: false
                    },
                ],
            });

            if (Room) {
                await Room.send({ content: ` ${sellerName} ` });
                const T = await Room.send({ embeds: [warnEmbed] });

                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setDescription(`لقد تم تحذير البائع ${sellerName} بنجاح ✅\n- https://discord.com/channels/${interaction.guild.id}/${Room.id}/${T.id}`)
                        .setColor("Green")
                    ],
                    components: []
                });

                if (attachments.length > 0) {
                    await Room.send({ files: attachments });
                }

                if (settings.ServerInfo && settings.ServerInfo.line) {
                    await Room.send({ files: [settings.ServerInfo.line] });
                }
            } else {
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setDescription(`لقد تم تحذير البائع ${sellerName} بنجاح ✅ (ملاحظة: روم اللوج غير موجود)`)
                        .setColor("Green")
                    ],
                    components: []
                });
            }

            const DataPoints = await dbpoint.get(`Points_Staff`)
            const Exit = DataPoints?.find((t) => t.userid == interaction.user.id)
            if (Exit) {
                Exit.Warn++
                await dbpoint.set(`Points_Staff`, DataPoints)
            } else {
                await dbpoint.push(`Points_Staff`, {
                    userid: interaction.user.id,
                    Warn: 1,
                    point: 0,
                })
            }

            await db.push(`Data_Warns`, {
                userid: interaction.targetMessage.author.id,
                staff: interaction.user.id,
                time: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                reason: selectedReason,
                warn: warningType,
                info: interaction.targetMessage.content,
                image: images || []
            })

            try {
                await interaction.targetMessage.delete();
            } catch (e) { }

            collector.stop()
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                interaction.editReply({
                    embeds: [new EmbedBuilder().setDescription(`انتهى الوقت , اعد مرة اخرى لاحقنا`).setColor("Red")],
                    components: []
                });
            }
        });
    }
});
