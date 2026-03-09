const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const { client, db, settings } = require('../../index');

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

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.content === settings.prefix + 'setup-warn') {
        if (!settings.Owners.includes(message.author.id)) return;

        // Initialize defaults if empty
        const currentReasons = await db.get('WarnReasons');
        if (!currentReasons || currentReasons.length === 0) {
            const reasons = defaultReasons.map(r => {
                const type = r.includes('تحذير') ? 'تحذير' : 'سحب رتبه';
                return { text: r, type: type };
            });
            await db.set('WarnReasons', reasons);
        }

        const mainEmbed = new EmbedBuilder()
            .setColor(settings.لون_الامبيد || 'Blue')
            .setTitle('إعدادات قائمة التحذيرات')
            .setDescription('**تحكم في أسباب التحذيرات والإجراءات المترتبة عليها (تحذير / سحب رتبة).**');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('AddWarnReason').setLabel('إضافة سبب').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('EditWarnReason').setLabel('تعديل سبب').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('RemoveWarnReason').setLabel('حذف سبب').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ListWarnReasons').setLabel('عرض القائمة').setStyle(ButtonStyle.Secondary)
        );

        await message.reply({ embeds: [mainEmbed], components: [row] });
    }
});

client.on('interactionCreate', async interaction => {
    // Handling Modal Opening
    if (interaction.isButton()) {
        if (interaction.customId === 'AddWarnReason') {
            const modal = new ModalBuilder()
                .setCustomId('AddWarnReasonModal')
                .setTitle('إضافة سبب تحذير جديد');

            const reasonInput = new TextInputBuilder()
                .setCustomId('reasonText')
                .setLabel("السبب")
                .setPlaceholder('اكتب سبب التحذير هنا...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'ListWarnReasons') {
            const reasons = await db.get('WarnReasons') || [];
            if (reasons.length === 0) return interaction.reply({ content: '❌ لا توجد أسباب محفوظة قيد التشغيل.', flags: MessageFlags.Ephemeral });

            const chunked = [];
            for (let i = 0; i < reasons.length; i += 10) chunked.push(reasons.slice(i, i + 10));

            const generateEmbed = (pageIndex) => {
                const chunk = chunked[pageIndex];
                return new EmbedBuilder()
                    .setColor(settings.لون_الامبيد || 'Blue')
                    .setTitle(`قائمة الأسباب (صفحة ${pageIndex + 1}/${chunked.length})`)
                    .setDescription(chunk.map((r, i) => `**${(pageIndex * 10) + i + 1}.** ${r.text} \n> ⛔ **الاجراء:** ${r.type}`).join('\n\n'));
            }

            const getButtons = (pageIndex) => {
                const row = new ActionRowBuilder();
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('السابق')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pageIndex === 0),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('التالي')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pageIndex === chunked.length - 1)
                );
                return row;
            }

            let currentPage = 0;
            await interaction.reply({
                embeds: [generateEmbed(currentPage)],
                components: [getButtons(currentPage)],
                flags: MessageFlags.Ephemeral
            });
            const response = await interaction.fetchReply();

            if (chunked.length > 1) {
                const filter = i => ['prev_page', 'next_page'].includes(i.customId) && i.user.id === interaction.user.id;
                const collector = response.createMessageComponentCollector({ filter, time: 120000 });

                collector.on('collect', async i => {
                    if (i.customId === 'prev_page') {
                        currentPage > 0 ? currentPage-- : currentPage = 0;
                    } else if (i.customId === 'next_page') {
                        currentPage < chunked.length - 1 ? currentPage++ : currentPage = chunked.length - 1;
                    }
                    await i.update({ embeds: [generateEmbed(currentPage)], components: [getButtons(currentPage)] });
                });
            }
        }

        if (interaction.customId === 'RemoveWarnReason') {
            const reasons = await db.get('WarnReasons') || [];
            if (reasons.length === 0) return interaction.reply({ content: '❌ لا توجد أسباب لحذفها.', flags: MessageFlags.Ephemeral });

            const options = reasons.map((r, i) => ({
                label: r.text.substring(0, 90),
                description: `الاجراء: ${r.type}`,
                value: i.toString()
            })).slice(0, 25);

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('SelectRemoveWarnReason')
                    .setPlaceholder('اختر السبب لحذفه')
                    .addOptions(options)
            );

            await interaction.reply({ content: 'اختر السبب الذي تريد حذفه:', components: [row], flags: MessageFlags.Ephemeral });
        }

        // Handle Edit Reason Button - Show select menu to choose reason to edit
        if (interaction.customId === 'EditWarnReason') {
            const reasons = await db.get('WarnReasons') || [];
            if (reasons.length === 0) return interaction.reply({ content: '❌ لا توجد أسباب لتعديلها.', flags: MessageFlags.Ephemeral });

            const options = reasons.map((r, i) => ({
                label: r.text.substring(0, 90),
                description: `الاجراء: ${r.type}`,
                value: i.toString()
            })).slice(0, 25);

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('SelectEditWarnReason')
                    .setPlaceholder('اختر السبب لتعديله')
                    .addOptions(options)
            );

            await interaction.reply({ content: 'اختر السبب الذي تريد تعديله:', components: [row], flags: MessageFlags.Ephemeral });
        }
    }

    // Handling Modal Submit (Adding Reason Step 1)
    if (interaction.isModalSubmit() && interaction.customId === 'AddWarnReasonModal') {
        const text = interaction.fields.getTextInputValue('reasonText');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`Type_Warn`).setLabel('تحذير').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`Type_Pull`).setLabel('سحب رتبة').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
            content: `**السبب:** ${text}\n**اختر الإجراء المترتب على هذا السبب:**`,
            components: [row],
            flags: MessageFlags.Ephemeral
        });
        const reply = await interaction.fetchReply();

        const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('Type_');
        const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000, max: 1 });

        collector.on('collect', async i => {
            const type = i.customId === 'Type_Warn' ? 'تحذير' : 'سحب رتبه';

            // Push to DB
            // We use 'push' if supported by st.db for arrays, or get/set
            // Assuming .push works for array values, otherwise get/set
            const current = await db.get('WarnReasons') || [];
            current.push({ text: text, type: type });
            await db.set('WarnReasons', current);

            await i.update({ content: `✅ **تم إضافة السبب بنجاح!**\n\n📝 **السبب:** ${text}\n⛔ **الاجراء:** ${type}`, components: [] });
        });
    }

    // Handling Remove Selection
    if (interaction.isStringSelectMenu() && interaction.customId === 'SelectRemoveWarnReason') {
        const index = parseInt(interaction.values[0]);
        const reasons = await db.get('WarnReasons') || [];

        if (index >= 0 && index < reasons.length) {
            const removed = reasons.splice(index, 1);
            await db.set('WarnReasons', reasons);
            await interaction.update({ content: `✅ تم حذف السبب: **${removed[0].text}**`, components: [] });
        } else {
            await interaction.update({ content: '❌ حدث خطأ، لم يتم العثور على العنصر.', components: [] });
        }
    }

    // Handling Edit Selection - Show modal to edit the text
    if (interaction.isStringSelectMenu() && interaction.customId === 'SelectEditWarnReason') {
        const index = interaction.values[0];
        const reasons = await db.get('WarnReasons') || [];
        const reason = reasons[parseInt(index)];

        if (!reason) {
            return interaction.reply({ content: '❌ حدث خطأ، لم يتم العثور على السبب.', flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
            .setCustomId(`EditWarnReasonModal_${index}`)
            .setTitle('تعديل سبب التحذير');

        const reasonInput = new TextInputBuilder()
            .setCustomId('editReasonText')
            .setLabel('السبب الجديد')
            .setValue(reason.text)
            .setPlaceholder('اكتب السبب المعدل هنا...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        await interaction.showModal(modal);
    }

    // Handling Edit Modal Submit
    if (interaction.isModalSubmit() && interaction.customId.startsWith('EditWarnReasonModal_')) {
        const index = parseInt(interaction.customId.split('_')[1]);
        const newText = interaction.fields.getTextInputValue('editReasonText');
        const reasons = await db.get('WarnReasons') || [];

        if (index < 0 || index >= reasons.length) {
            return interaction.reply({ content: '❌ حدث خطأ، لم يتم العثور على السبب.', flags: MessageFlags.Ephemeral });
        }

        const currentType = reasons[index].type;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`EditType_Warn_${index}`).setLabel('تحذير').setStyle(currentType === 'تحذير' ? ButtonStyle.Success : ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`EditType_Pull_${index}`).setLabel('سحب رتبة').setStyle(currentType === 'سحب رتبه' ? ButtonStyle.Success : ButtonStyle.Danger)
        );

        await interaction.reply({
            content: `**السبب الجديد:** ${newText}\n**الاجراء الحالي:** ${currentType}\n\n**اختر الإجراء المترتب على هذا السبب:**`,
            components: [row],
            flags: MessageFlags.Ephemeral
        });
        const reply = await interaction.fetchReply();

        const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('EditType_');
        const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000, max: 1 });

        collector.on('collect', async i => {
            const parts = i.customId.split('_');
            const type = parts[1] === 'Warn' ? 'تحذير' : 'سحب رتبه';
            const idx = parseInt(parts[2]);

            const currentReasons = await db.get('WarnReasons') || [];
            if (idx >= 0 && idx < currentReasons.length) {
                currentReasons[idx] = { text: newText, type: type };
                await db.set('WarnReasons', currentReasons);
                await i.update({ content: `✅ **تم تعديل السبب بنجاح!**\n\n📝 **السبب:** ${newText}\n⛔ **الاجراء:** ${type}`, components: [] });
            } else {
                await i.update({ content: '❌ حدث خطأ أثناء التعديل.', components: [] });
            }
        });
    }
});
