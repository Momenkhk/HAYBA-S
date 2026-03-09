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
    if (interaction.customId === 'kadyModalBuilder') {

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
                { name: 'التفاعل', value: `\`\`\`${hours}\`\`\``, inline: true },
                { name: 'الشرح', value: `\`\`\`${info}\`\`\``, inline: true },
            ],
        };

        const embed = createEmbed(embedData);
        const Log = await interaction.guild.channels.cache.get(settings.Apply.Kdaa.Room)

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('Yes_Kdaa')
                .setLabel('قبول الشخص')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId('No_Kdaa')
                .setLabel('رفض الشخص')
                .setStyle(ButtonStyle.Secondary),
        )

        await Log.send({ content: `${interaction.user}`, embeds: [embed], components: [buttons] })
        await Log.send({ files: [settings.ServerInfo.line] })

        await interaction.reply({ content: `**تم ارسال تقديمك بنجاح ✅**`, ephemeral: true })
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const canManage = () => {
        if (settings.Owners.includes(interaction.user.id)) return true;
        if (interaction.member.roles.cache.has(settings.Apply.MasoulKbool)) return true;
        if (interaction.user.id === settings.Apply.MasoulKbool) return true;
        return false;
    };

    if (interaction.customId === 'Yes_Kdaa') {
        if (!canManage()) return;

        const Role = await interaction.guild.roles.cache.get(settings.Apply.Kdaa.Role)
        const memberID = interaction.message.content;
        const memberId = memberID.replace(/[<@!>]/g, '');
        const member = await interaction.guild.members.fetch(memberId).catch(() => null);

        if (!member) return interaction.reply({ content: '❌ تعذر العثور على هذا العضو.', ephemeral: true });

        await member.roles.add(Role.id).catch(() => { });

        const acceptEmbed = createEmbed({
            interaction: interaction,
            title: `تم قبولك بنجاح`,
            description: `مرحبا عزيزي ${member} تم قبولك ك قاضي في ${interaction.guild.name}`
        })
        await member.send({ embeds: [acceptEmbed] }).catch(() => { });

        const components = interaction.message.components.map(row => {
            const newRow = new ActionRowBuilder();
            row.components.forEach(comp => {
                const btn = ButtonBuilder.from(comp);
                if (comp.customId === 'Yes_Kdaa') {
                    btn.setDisabled(true).setStyle(ButtonStyle.Success);
                } else if (comp.customId === 'No_Kdaa') {
                    btn.setDisabled(true);
                }
                newRow.addComponents(btn);
            });
            return newRow;
        });

        await interaction.update({ content: `تم قبول ${member} من قبل ${interaction.user} ✅`, components: components });

        const nategaChannelId = settings.Apply.Kdaa.Natega || settings.Apply.Kdaa.Room;
        const channel = await interaction.guild.channels.cache.get(nategaChannelId);

        if (channel) {
            const Sembed = createEmbed({
                interaction: interaction,
                title: `> Apply Result:`,
                description: `  ${member} تم قبولك ك قاضي في ${interaction.guild.name}`
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('accepted_done_kdaa')
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

    if (interaction.customId === 'No_Kdaa') {
        if (!canManage()) return;

        const memberID = interaction.message.content;
        const memberId = memberID.replace(/[<@!>]/g, '');
        const member = await interaction.guild.members.fetch(memberId).catch(() => null);

        const rejectEmbed = createEmbed({
            interaction: interaction,
            title: `تم رفضك `,
            description: `مرحبا عزيزي ${member || 'العضو'} تم رفضك ك قاضي في ${interaction.guild.name} `
        })
        if (member) await member.send({ embeds: [rejectEmbed] }).catch(() => { });

        const components = interaction.message.components.map(row => {
            const newRow = new ActionRowBuilder();
            row.components.forEach(comp => {
                const btn = ButtonBuilder.from(comp);
                if (comp.customId === 'No_Kdaa') {
                    btn.setDisabled(true).setStyle(ButtonStyle.Danger);
                } else if (comp.customId === 'Yes_Kdaa') {
                    btn.setDisabled(true);
                }
                newRow.addComponents(btn);
            });
            return newRow;
        });

        await interaction.update({ content: `تم رفض ${member || 'العضو'} من قبل ${interaction.user} ❌`, components: components });

        const nategaChannelId = settings.Apply.Kdaa.Natega || settings.Apply.Kdaa.Room;
        const channel = await interaction.guild.channels.cache.get(nategaChannelId);

        if (channel) {
            const Fembed = createEmbed({
                interaction: interaction,
                title: `> Apply Result:`,
                description: `  ${member || 'العضو'} تم رفضك ك قاضي في ${interaction.guild.name}`
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('rejected_done_kdaa')
                    .setLabel('Rejected')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );

            channel.send({
                content: `${member || ''}`,
                embeds: [Fembed],
                components: [row]
            }).catch(() => { });
        }
    }
});
