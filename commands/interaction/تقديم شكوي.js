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
const config = require('../../config/settings');
const { createEmbed } = require('../../function/function/Embed');
const fs = require('fs');
const path = require('path');

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'Complaint') {
        const modal = new ModalBuilder()
            .setCustomId('reportmodal')
            .setTitle('تقديم بلاغ علي اداري');

        const StaffID = new TextInputBuilder()
            .setCustomId('StaffID')
            .setLabel("ايدي الاداري")
            .setPlaceholder("حط هنا ايدي الاداري وليس يوزره")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const story = new TextInputBuilder()
            .setCustomId('story')
            .setLabel("القصة")
            .setPlaceholder("حط القصة هنا")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(StaffID);
        const secondActionRow = new ActionRowBuilder().addComponents(story);
        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'reportmodal') {
        const StaffID = interaction.fields.getTextInputValue('StaffID');
        const story = interaction.fields.getTextInputValue('story');

        const embed = createEmbed({
            interaction: interaction,
            title: 'بلاغ على اداري',
            color: settings.لون_الامبيد,
            description: `**
        - الاداري: <@${StaffID}> | (\`${StaffID}\`)
        
        \`\`\`${story}\`\`\`
        **`
        });

        // Footers are now objects
        embed.setFooter({ text: `تم التقديم بواسطة ${interaction.user.tag}` });

        const addStaffBtn = new ButtonBuilder()
            .setCustomId(`add_staff_${StaffID}`)
            .setLabel('اضافة الاداري')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(addStaffBtn);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('add_staff_')) {
        await interaction.deferUpdate().catch(console.error);

        const staffId = interaction.customId.split('add_staff_')[1];

        // Ensure DiscordLeader is an array or handle both
        const isLeader = Array.isArray(settings.Admins.DiscordLeader)
            ? settings.Admins.DiscordLeader.includes(interaction.user.id)
            : interaction.member.roles.cache.has(settings.Admins.DiscordLeader);

        if (!isLeader) {
            return interaction.followUp({ content: "ليس لديك صلاحية استخدام هذا الزر.", ephemeral: true });
        }

        try {
            await interaction.channel.permissionOverwrites.edit(staffId, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            const addedEmbed = new EmbedBuilder()
                .setColor(settings.لون_الامبيد || "Blue")
                .setDescription(`**تم اضافة الإداري <@${staffId}> إلى التذكرة بنجاح.**`)
                .setFooter({ text: `بواسطة: ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.channel.send({ embeds: [addedEmbed] });
        } catch (err) {
            console.error(err);
            return interaction.channel.send({ content: "حدث خطأ أثناء محاولة إضافة الإداري." });
        }
    }
});
