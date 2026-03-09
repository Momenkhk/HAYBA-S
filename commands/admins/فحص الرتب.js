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
const { createEmbed } = require('../../function/function/Embed');
const moment = require('moment');

client.on('messageCreate', async message => {
    if (message.content.startsWith(settings.prefix + 'mr')) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) {
            return message.reply("ليس لديك صلاحية لاستخدام هذا الأمر.");
        }
        try {
            let role;
            if (message.mentions.roles.size > 0) {
                role = message.mentions.roles.first();
            } else {
                const roleId = message.content.split(/\s+/)[1];
                if (!roleId) return message.reply("يرجى منشن رتبة أو وضع الأيدي الخاص بها.");
                role = message.guild.roles.cache.get(roleId);
                if (!role) return message.reply("هذه الرتبة غير موجودة.");
            }

            await message.guild.members.fetch();
            let membersList = role.members.map(rr => `**<@${rr.id}> (${rr.id})**`).join("\n");

            if (membersList.length > 3500) {
                membersList = membersList.substring(0, 3500) + "\n... وغيرهم الكثير";
            }

            const embed = createEmbed({
                interaction: message,
                title: `معلومات عن رتبة \`${role.name}\` `,
                description: `**عدد الأعضاء الذين يمتلكون هذه الرتبة:** \`${role.members.size}\`\n
                **الأعضاء :**\n
                ${membersList}\n
                **تاريخ إنشاء الرتبة :** \`${moment(role.createdAt).format('DD/MM/YYYY h:mm')}\``
            });

            await message.reply({ embeds: [embed] });

        } catch (err) {
            console.error("An error occurred:", err);
            message.reply("حدث خطأ أثناء تنفيذ الأمر.");
        }
    }
});
