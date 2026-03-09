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

const { client, db, dbTickets, settings } = require('../../index');
const { createEmbed } = require('../../function/function/Embed');
const checkCredits = require('../../function/function/checkCredits');
const Config = require('../../config/prices');

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(`${settings.prefix}give-spin`)) return;
    if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;

    const args = message.content.split(' ').slice(1);
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("يرجى منشن أو كتابة آيدي المستخدم بشكل صحيح.");

    const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`give_spin_select_${target.id}_${message.author.id}`)
            .setPlaceholder("اختار نوع العجلة")
            .addOptions([
                {
                    label: "Basic Spin",
                    description: "لفه عجلة حظ عاديه",
                    value: "Basic",
                },
                {
                    label: "Exclusive Spin",
                    description: "لفه عجلة حظ مميزه",
                    value: "Exclusive",
                }
            ])
    );

    const embed = new EmbedBuilder()
        .setColor(settings.لون_الامبيد || 'Blue')
        .setDescription(`**> Give Spin\nاهلا بك عزيزي الاداري ${message.author} .. \nيُرجى منك تحديد نوع العجلة المراد اعطائها لـ ${target} - من خلال القائمة بالاسفل .**`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    const sent = await message.channel.send({ embeds: [embed], components: [selectRow] });

    const filter = (i) => i.customId === `give_spin_select_${target.id}_${message.author.id}` && i.user.id === message.author.id;
    const collector = sent.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', async interaction => {
        if (!interaction.isStringSelectMenu()) return;
        await interaction.deferUpdate();

        const type = interaction.values[0]; // 'Basic' or 'Exclusive'
        const isBasic = type === 'Basic';
        const customId = isBasic ? 'SpinBasic' : 'SpinExclusive';
        const image = Config.Spin[type].SpinImage;

        const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(customId)
                .setLabel("لف العجلة")
                .setStyle(ButtonStyle.Primary)
        );

        const newEmbed = new EmbedBuilder()
            .setColor(settings.لون_الامبيد || 'Blue')
            .setDescription(`**اهلا عزيزي العميل ${target} - .. لقد تم اعطائك لفه عجلة حظ مجانية\nيُرجى منك ضغط الزر بالاسفل لإستلام الفه المجانية .**`)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .setImage(image)
            .setTimestamp();

        await sent.delete().catch(() => { });
        await message.channel.send({ embeds: [newEmbed], components: [newRow] });

        const logChannelID = settings.Rooms[isBasic ? 'LogSpin' : 'LogSpins'];
        const logChannel = message.guild.channels.cache.get(logChannelID);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('🎁 تم إعطاء لفه مجانية 🎁')
                .setColor(settings.EmbedColor || 'Green')
                .setDescription(`- الاداري : ${message.author}\n- المستخدم : ${target}\n- نوع العجلة : ${type}`)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setImage(image)
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] }).catch(() => { });
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && !collected.size) sent.delete().catch(() => { });
    });
});
