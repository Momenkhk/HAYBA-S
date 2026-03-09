const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');
const { client, settings } = require('../../index');

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Check prefix and command name
    const prefix = settings.prefix;
    if (!message.content.startsWith(prefix + 'اداره')) return;

    // Check permission (Same as role command or adjust as needed)
    const isOwner = settings.Owners.includes(message.author.id);
    const hasControlRole = message.member.roles.cache.has(settings.Admins.RoleControl);
    const hasLeaderRole = message.member.roles.cache.has(settings.Admins.DiscordLeader);

    if (!isOwner && !hasControlRole && !hasLeaderRole) {
        return; // Silent fail or message
    }

    const args = message.content.split(/\s+/);
    const targetMember = message.mentions.members.first() || await message.guild.members.fetch(args[1]).catch(() => null);

    if (!targetMember) {
        const errorEmbed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(`**- الاستخدام الصحيح : \`${prefix}اداره\` <@member/id>**`);
        return message.reply({ embeds: [errorEmbed] });
    }

    const staffRoles = settings.StaffRoles || [];
    const staffPerms = settings.StaffPerms || [];

    const roleOptions = staffRoles.map(r => {
        const role = message.guild.roles.cache.get(r.roleId);
        return {
            label: r.label || (role ? role.name : 'Unknown'),
            value: role ? role.id : 'null'
        };
    }).filter(opt => opt.value !== 'null');

    const permOptions = staffPerms.map(r => {
        const role = message.guild.roles.cache.get(r.roleId);
        return {
            label: r.label || (role ? role.name : 'Unknown'),
            value: role ? role.id : 'null'
        };
    }).filter(opt => opt.value !== 'null');

    const embed = new EmbedBuilder()
        .setColor(settings.لون_الامبيد || '#2B2D31')
        .setDescription(`**يرجى تحديد رتبة أو صلاحية الإدارة للمستخدم ${targetMember}**`);

    const roleRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`staff_role_select_${targetMember.id}`)
            .setPlaceholder('Staff Roles | رتب الإدارة')
            .addOptions(roleOptions.length > 0 ? roleOptions : [{ label: 'Empty', value: 'null' }])
            .setDisabled(roleOptions.length === 0)
    );

    const permRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`staff_perm_select_${targetMember.id}`)
            .setPlaceholder('Staff Perms | صلاحيات الإدارة')
            .addOptions(permOptions.length > 0 ? permOptions : [{ label: 'Empty', value: 'null' }])
            .setDisabled(permOptions.length === 0)
    );

    const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('staff_role_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ components: [roleRow, permRow, btnRow] });
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'staff_role_cancel') {
        const isOwner = settings.Owners.includes(interaction.user.id);
        const hasControlRole = interaction.member.roles.cache.has(settings.Admins.RoleControl);
        if (!isOwner && !hasControlRole) return interaction.reply({ content: '❌ لا تملك صلاحية استخدام هذا الزر.', ephemeral: true });
        return interaction.message.delete().catch(() => { });
    }

    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith('staff_role_select_') && !interaction.customId.startsWith('staff_perm_select_')) return;

    const isOwner = settings.Owners.includes(interaction.user.id);
    const hasControlRole = interaction.member.roles.cache.has(settings.Admins.RoleControl);
    const hasLeaderRole = interaction.member.roles.cache.has(settings.Admins.DiscordLeader);

    if (!isOwner && !hasControlRole && !hasLeaderRole) {
        return interaction.reply({ content: '❌ لا تملك صلاحية التحكم في الرتب الإدارية.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const targetId = interaction.customId.split('_')[3];
    const roleId = interaction.values[0];
    const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);

    if (!targetMember) return interaction.editReply({ content: '❌ هذا العضو لم يعد موجوداً في السيرفر.' });

    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) return interaction.editReply({ content: '❌ هذه الرتبة لم تعد موجودة.' });

    // Bot Permission Check
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.editReply({ content: '❌ رتبة البوت أقل من الرتبة المراد منحها. يرجى رفع رتبة البوت.' });
    }

    try {
        if (targetMember.roles.cache.has(roleId)) {
            await targetMember.roles.remove(roleId);
            await interaction.editReply({ content: `✅ تم سحب رتبة **${role.name}** من ${targetMember} بنجاح.` });
        } else {
            await targetMember.roles.add(roleId);
            await interaction.editReply({ content: `✅ تم منح رتبة **${role.name}** إلى ${targetMember} بنجاح.` });
        }

        // Reset the selection in the original message
        await interaction.message.edit({ components: interaction.message.components }).catch(() => { });
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: '❌ حدث خطأ أثناء محاولة تعديل الرتبة.' });
    }
});
