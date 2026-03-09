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
const { createEmbed } = require('../../function/function/Embed');

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId === 'staffModalBuilder') {

        const name = interaction.fields.getTextInputValue('name');
        const age = interaction.fields.getTextInputValue('age');
        const country = interaction.fields.getTextInputValue('country');
        const hours = interaction.fields.getTextInputValue('hours');
        const info = interaction.fields.getTextInputValue('info');

        const embedData = {
            interaction: interaction,
            title: 'تقديم جديد',
            image: settings.ServerInfo.ApplyImage,
            color: settings.لون_الامبيد,
            fields: [
                { name: 'اسم الشخص', value: `\`\`\`${name}\`\`\``, inline: true },
                { name: 'العمر', value: `\`\`\`${age}\`\`\``, inline: true },
                { name: 'البلد', value: `\`\`\`${country}\`\`\``, inline: true },
                { name: 'عدد ساعات التفاعل', value: `\`\`\`${hours}\`\`\``, inline: true },
                { name: 'كيف بيقدر يساعدنا', value: `\`\`\`${info}\`\`\``, inline: true },
            ],
        };

        const embed = createEmbed(embedData);
        const LogId = settings.Apply.staff.Room;
        const Log = await interaction.guild.channels.cache.get(LogId);

        if (!Log) return interaction.reply({ content: '❌ روم التقديمات غير موجود في السيرفر، يرجى التحقق من الملف المبرمج.', ephemeral: true });

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('Yes_staff')
                .setLabel('قبول الشخص')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId('No_staff')
                .setLabel('رفض الشخص')
                .setStyle(ButtonStyle.Secondary),
        );

        await Log.send({ content: `${interaction.user}`, embeds: [embed], components: [buttons] })
        await Log.send({ files: [settings.ServerInfo.line] }).catch(() => { });

        await interaction.reply({ content: `**تم ارسال تقديمك بنجاح ✅**`, ephemeral: true })
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // Permission Check function
    const canManage = () => {
        if (settings.Owners.includes(interaction.user.id)) return true;
        if (interaction.member.roles.cache.has(settings.Apply.MasoulKbool)) return true;
        if (interaction.user.id === settings.Apply.MasoulKbool) return true;
        return false;
    };

    if (interaction.customId === 'Yes_staff') {
        if (!canManage()) return interaction.reply({ content: '❌ لا تملك صلاحية قبول أو رفض التقديمات.', ephemeral: true });

        const roleId = settings.Apply.staff.Role;
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ content: '❌ رتبة الإدارة غير موجودة في السيرفر، تأكد من الإعدادات.', ephemeral: true });

        const memberMention = interaction.message.content;
        const memberId = memberMention.replace(/[<@!>]/g, '');
        const member = await interaction.guild.members.fetch(memberId).catch(() => null);

        if (!member) return interaction.reply({ content: '❌ تعذر العثور على هذا العضو في السيرفر.', ephemeral: true });

        try {
            await member.roles.add(role.id);
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: '❌ فشل منح الرتبة للعضو، تأكد من رتبة البوت.', ephemeral: true });
        }

        const acceptEmbed = createEmbed({
            interaction: interaction,
            title: `تم قبولك بنجاح`,
            description: `مرحبا عزيزي ${member} تم قبولك ك اداري في ${interaction.guild.name}`
        });
        await member.send({ embeds: [acceptEmbed] }).catch(() => { });

        // Update Buttons
        const components = interaction.message.components.map(row => {
            const newRow = new ActionRowBuilder();
            row.components.forEach(comp => {
                const btn = ButtonBuilder.from(comp);
                if (comp.customId === 'Yes_staff') {
                    btn.setDisabled(true).setStyle(ButtonStyle.Success);
                } else if (comp.customId === 'No_staff') {
                    btn.setDisabled(true);
                }
                newRow.addComponents(btn);
            });
            return newRow;
        });

        await interaction.update({ content: `تم قبول ${member} من قبل ${interaction.user} ✅`, components: components });

        const nategaChannelId = settings.Apply.staff.Natega || settings.Apply.staff.Room;
        const channel = await interaction.guild.channels.cache.get(nategaChannelId);

        if (channel) {
            const Sembed = createEmbed({
                interaction: interaction,
                title: `> Apply Result:`,
                description: `  ${member} تم قبولك ك اداري في ${interaction.guild.name}`
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('accepted_done_staff')
                    .setLabel('Accepted')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
            );

            channel.send({
                content: `${member}`,
                embeds: [Sembed],
                components: [row]
            }).catch(() => { });
        }
    }

    if (interaction.customId === 'No_staff') {
        if (!canManage()) return interaction.reply({ content: '❌ لا تملك صلاحية قبول أو رفض التقديمات.', ephemeral: true });

        const memberMention = interaction.message.content;
        const memberId = memberMention.replace(/[<@!>]/g, '');
        const member = await interaction.guild.members.fetch(memberId).catch(() => null);

        const rejectEmbed = createEmbed({
            interaction: interaction,
            title: `تم رفضك `,
            description: `مرحبا عزيزي ${member || 'العضو'} تم رفضك ك اداري في ${interaction.guild.name} `
        })
        if (member) await member.send({ embeds: [rejectEmbed] }).catch(() => { });

        // Update Buttons
        const components = interaction.message.components.map(row => {
            const newRow = new ActionRowBuilder();
            row.components.forEach(comp => {
                const btn = ButtonBuilder.from(comp);
                if (comp.customId === 'No_staff') {
                    btn.setDisabled(true).setStyle(ButtonStyle.Danger);
                } else if (comp.customId === 'Yes_staff') {
                    btn.setDisabled(true);
                }
                newRow.addComponents(btn);
            });
            return newRow;
        });

        await interaction.update({ content: `تم رفض ${member || 'العضو'} من قبل ${interaction.user} ❌`, components: components });

        const nategaChannelId = settings.Apply.staff.Natega || settings.Apply.staff.Room;
        const channel = await interaction.guild.channels.cache.get(nategaChannelId);

        if (channel) {
            const Fmbed = createEmbed({
                interaction: interaction,
                title: `> Apply Result:`,
                description: `  ${member || 'العضو'} تم رفضك ك اداري في ${interaction.guild.name}`
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('rejected_done_staff')
                    .setLabel('Rejected')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );

            channel.send({
                content: `${member || ''}`,
                embeds: [Fmbed],
                components: [row]
            }).catch(() => { });
        }
    }
});
