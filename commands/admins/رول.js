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
const { client, settings } = require('../../index');
const RolesConfig = require('../../config/Roles');

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(settings.prefix + 'رول')) return;

    // Check permission
    const canControl = message.member.roles.cache.has(settings.Admins.RoleControl) || settings.Owners.includes(message.author.id);
    if (!canControl) {
        return; // Silent fail as per admin command standards or send a message
    }

    const args = message.content.split(/\s+/);
    const targetMember = message.mentions.members.first() || await message.guild.members.fetch(args[1]).catch(() => null);

    if (!targetMember) {
        const errorEmbed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(`**⚠️ الاستخدام الصحيح : \`${settings.prefix}رول\` <@member/id>**`);
        return message.reply({ embeds: [errorEmbed] });
    }

    const mainColor = settings.لون_الامبيد || '#2C2F33';

    const embed = new EmbedBuilder()
        .setColor(mainColor)
        .setDescription(`**يرجى تحديد نوع الرتبة للمستخدم ${targetMember}**`);

    // 1. Rare Roles Menu
    const rareOptions = RolesConfig.Rare_Roles.map(r => {
        const role = message.guild.roles.cache.get(r.roleID);
        return {
            label: role ? role.name : 'Unknown Role',
            value: r.roleID
        };
    }).filter(opt => opt.value);

    const rareRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`v2_role_rare_${targetMember.id}`)
            .setPlaceholder('Rare Roles | الرتب النادرة')
            .addOptions(rareOptions.length > 0 ? rareOptions : [{ label: 'Empty', value: 'null' }])
            .setDisabled(rareOptions.length === 0)
    );

    // 2. Shop Roles Menu
    const shopOptions = RolesConfig.Roles.slice(0, 25).map(r => {
        const role = message.guild.roles.cache.get(r.roleID);
        return {
            label: role ? role.name : 'Unknown Role',
            value: r.roleID
        };
    }).filter(opt => opt.value);

    const shopRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`v2_role_shop_${targetMember.id}`)
            .setPlaceholder('Shop Roles | رتب المتجر')
            .addOptions(shopOptions.length > 0 ? shopOptions : [{ label: 'Empty', value: 'null' }])
            .setDisabled(shopOptions.length === 0)
    );

    // 3. Warns and Addons Menu
    const warnData = RolesConfig.WarnsRole[0];
    const warnOptions = Object.entries(warnData).map(([key, roleID]) => {
        const role = message.guild.roles.cache.get(roleID);
        return {
            label: role ? role.name : key,
            value: roleID
        };
    }).filter(opt => opt.value);

    const warnRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`v2_role_warn_${targetMember.id}`)
            .setPlaceholder('Management | الإضافات والتحذيرات')
            .addOptions(warnOptions.length > 0 ? warnOptions : [{ label: 'Empty', value: 'null' }])
            .setDisabled(warnOptions.length === 0)
    );

    // 4. Action Buttons
    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('v2_role_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ components: [rareRow, shopRow, warnRow, actionRow] });
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'v2_role_cancel') {
        const canControl = interaction.member.roles.cache.has(settings.Admins.RoleControl) || settings.Owners.includes(interaction.user.id);
        if (!canControl) {
            return interaction.reply({ content: '❌ ليس لديك صلاحية استخدام هذا الزر.', ephemeral: true });
        }
        return interaction.message.delete().catch(() => { });
    }

    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith('v2_role_')) return;

    // Check permission
    const canControl = interaction.member.roles.cache.has(settings.Admins.RoleControl) || settings.Owners.includes(interaction.user.id);
    if (!canControl) {
        return interaction.reply({ content: '❌ ليس لديك صلاحية تعديل الرتب.', ephemeral: true });
    }

    const parts = interaction.customId.split('_');
    const targetID = parts[3];
    const roleID = interaction.values[0];

    if (roleID === 'null') return interaction.deferUpdate();

    const targetMember = await interaction.guild.members.fetch(targetID).catch(() => null);
    if (!targetMember) {
        return interaction.reply({ content: '❌ تعذر العثور على هذا العضو.', ephemeral: true });
    }

    const role = interaction.guild.roles.cache.get(roleID);
    if (!role) {
        return interaction.reply({ content: '❌ تعذر العثور على الرتبة المحددة.', ephemeral: true });
    }

    // Permission check for the bot itself
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({ content: '❌ رتبة البوت أقل من الرتبة المراد تعديلها.', ephemeral: true });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({ content: '❌ البوت لا يملك صلاحية `Manage Roles`.', ephemeral: true });
    }

    try {
        const hasRole = targetMember.roles.cache.has(roleID);
        if (hasRole) {
            await targetMember.roles.remove(roleID);
            const removeEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`✅ تم سحب رتبة **${role.name}** من ${targetMember}`);
            await interaction.reply({ embeds: [removeEmbed], ephemeral: true });
        } else {
            await targetMember.roles.add(roleID);
            const addEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ تم منح رتبة **${role.name}** إلى ${targetMember}`);
            await interaction.reply({ embeds: [addEmbed], ephemeral: true });
        }

        // Reset the selection in the original message
        await interaction.message.edit({ components: interaction.message.components }).catch(() => { });
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ حدث خطأ أثناء محاولة تعديل الرتبة.', ephemeral: true });
    }
});
