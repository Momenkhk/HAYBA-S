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
    Events
} = require('discord.js');
const { client, db, settings } = require('../../index');
const { createEmbed } = require('../../function/function/Embed');
const { default: chalk } = require('chalk');

client.on('messageCreate', async message => {
    if (message.content.startsWith(`${settings.prefix}blacklist`)) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;
        const mentionedUser = message.mentions.members.first() || message.guild.members.cache.get(message.content.split(/\s+/)[1]);

        if (!mentionedUser) {
            return message.reply('منشن الشخص');
        }

        const reason = message.content.split(/\s+/).slice(2).join(' ') || 'غير محدد';

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('blacklist_select')
            .setPlaceholder('اختر نوع البلاك ليست')
            .addOptions([
                {
                    label: 'مزاد',
                    description: 'Blacklist for مزاد',
                    value: 'مزاد',
                },
                {
                    label: 'تكت',
                    description: 'Blacklist for تكت',
                    value: 'تكت',
                },
                {
                    label: 'ادارة',
                    description: 'Blacklist for ادارة',
                    value: 'ادارة',
                },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await message.reply({
            content: 'اختر نوع البلاك ليست:',
            components: [row],
        });

        const filter = (interaction) => interaction.customId === 'blacklist_select' && interaction.user.id === message.author.id;
        const collector = message.channel.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, time: 60000 });

        collector.on('collect', async (interaction) => {
            const blacklistType = interaction.values[0];
            const role = blacklistType === 'مزاد' ? settings.blacklist.mazad :
                blacklistType === 'تكت' ? settings.blacklist.tickets :
                    blacklistType === 'ادارة' ? settings.blacklist.staff : null;

            const data = await db.get(`BlackList`);
            const e = data?.find((t) => t.userid == mentionedUser.id);

            if (!e) {
                await db.push(`BlackList`, {
                    userid: mentionedUser.id,
                    type: blacklistType,
                    role: role,
                    reason: reason
                });

                if (role) await mentionedUser.roles.add(role).catch(() => { });

                const embed = createEmbed({
                    interaction: message,
                    title: 'بلاك ليست',
                    description: `**- العضو : ${mentionedUser}\n- الاداري : ${message.author}\n- نوع البلاك : ${blacklistType}\n- السبب : ${reason}**`
                });

                await interaction.update({ embeds: [embed], components: [] });
            } else {
                await interaction.update({ content: 'هذا العضو موجود بالفعل في البلاك ليست.', components: [] });
            }
        });
    }
});

client.on('messageCreate', async message => {
    if (message.content.startsWith(`${settings.prefix}remove-blacklist`)) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;
        const mentionedUser = message.mentions.members.first() || message.guild.members.cache.get(message.content.split(/\s+/)[1]);

        if (!mentionedUser) {
            return message.reply('منشن الشخص');
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('remove_blacklist_select')
            .setPlaceholder('اختر نوع البلاك ليست لإزالته')
            .addOptions([
                {
                    label: 'مزاد',
                    description: 'Remove blacklist for مزاد',
                    value: 'مزاد',
                },
                {
                    label: 'تكت',
                    description: 'Remove blacklist for تكت',
                    value: 'تكت',
                },
                {
                    label: 'ادارة',
                    description: 'Remove blacklist for ادارة',
                    value: 'ادارة',
                },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await message.reply({
            content: 'اختر نوع البلاك ليست لإزالته:',
            components: [row],
        });

        const filter = (interaction) => interaction.customId === 'remove_blacklist_select' && interaction.user.id === message.author.id;
        const collector = message.channel.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, time: 60000 });

        collector.on('collect', async (interaction) => {
            const blacklistType = interaction.values[0];
            const role = blacklistType === 'مزاد' ? settings.blacklist.mazad :
                blacklistType === 'تكت' ? settings.blacklist.tickets :
                    blacklistType === 'ادارة' ? settings.blacklist.staff : null;

            const data = await db.get(`BlackList`);
            const e = data?.find((t) => t.userid == mentionedUser.id);

            if (e) {
                const updatedData = data.filter((Data) => !(Data.userid === mentionedUser.id && Data.type === blacklistType));
                await db.set(`BlackList`, updatedData);

                if (role) await mentionedUser.roles.remove(role).catch(() => { });

                const embed = createEmbed({
                    interaction: message,
                    title: 'ازالة بلاك ليست',
                    description: `**- العضو : ${mentionedUser}\n- الاداري : ${message.author}\n- تم ازالة بلاك ليست بنوع : ${blacklistType}**`
                });

                await interaction.update({ embeds: [embed], components: [] });
            } else {
                await interaction.update({ content: 'هذا العضو غير موجود في البلاك ليست.', components: [] });
            }
        });
    }
});

client.on('guildMemberAdd', async member => {
    const data = await db.get(`BlackList`);
    const ex = data?.find((t) => t.userid == member.id);

    if (ex && ex.role) {
        await member.roles.add(ex.role).catch(() => { });
        console.log(chalk.red(`Role BlackList Add To ${member.displayName}`));
    }
});
