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
const fs = require('fs');
const path = require('path');

const scamDBPath = path.join(__dirname, '../../database/scamdb.json');

client.on('messageCreate', async message => {
    if (!message.content.startsWith(settings.prefix || '$') || message.author.bot) return;

    const prefix = settings.prefix || '$';
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const user = userMember?.user;

    if (command === 'check') {
        if (!user) {
            return message.channel.send("برجاء منشن الشخص او وضع الايدي");
        }

        const userID = user.id;
        let scamDB = [];
        try {
            scamDB = JSON.parse(fs.readFileSync(scamDBPath, 'utf8'));
        } catch (e) {
            scamDB = [];
        }
        const report = scamDB.find(entry => entry.scammerID === userID);

        const embed = new EmbedBuilder()
            .setTitle('فحص النصاب')
            .setColor(report ? "Red" : "Green")
            .setDescription(report
                ? `**⚠️ هذا الشخص نصاب!**\n\n- **اسم النصاب:** ${user.tag}\n- **ID النصاب:** ${userID} \n\n- **برجاء عدم التعامل معه!**`
                : `**✅ هذا الشخص ليس نصاباً!**\n\n- **اسم المستخدم:** ${user.tag}\n- **ID المستخدم:** ${userID} \n\n- **ولاك هذا لا يعني انه مضمون!**`
            )
            .setThumbnail(user.displayAvatarURL());

        message.channel.send({ embeds: [embed] });
    }

    if (command === 'remove') {
        if (!user) {
            return message.channel.send("برجاء منشن الشخص او وضع الايدي");
        }

        if (!message.member.roles.cache.has(config.Admins.DiscordLeader)) {
            return message.channel.send("ليس لديك الصلاحيات اللازمة لرفع البلاغ.");
        }

        const reason = args.slice(1).join(' ');
        if (!reason) {
            return message.channel.send("برجاء تقديم سبب لإزالة النصاب.");
        }

        const userID = user.id;

        let scamDB = [];
        try {
            scamDB = JSON.parse(fs.readFileSync(scamDBPath, 'utf8'));
        } catch (e) {
            scamDB = [];
        }
        const index = scamDB.findIndex(entry => entry.scammerID === userID);

        if (index === -1) {
            return message.channel.send("هذا الشخص ليس في قائمة النصابين.");
        }

        scamDB.splice(index, 1);
        fs.writeFileSync(scamDBPath, JSON.stringify(scamDB, null, 2), 'utf8');

        const roleID = config.ReportSettings.ScammerRoleID;
        if (roleID) {
            const role = message.guild.roles.cache.get(roleID);
            if (role) {
                const member = await message.guild.members.fetch(userID).catch(() => null);
                if (member) {
                    await member.roles.remove(role).catch(() => { });
                } else {
                    console.error('لم يتم العثور على العضو.');
                }
            } else {
                console.error('لم يتم العثور على الدور.');
            }
        } else {
            console.error('لم يتم العثور على ID الدور في ملف الإعدادات.');
        }

        const embed = new EmbedBuilder()
            .setTitle('تمت إزالة النصاب')
            .setColor("Green")
            .setDescription(`**تمت إزالة النصاب بنجاح!**\n\n- **اسم النصاب:** ${user.tag}\n- **ID النصاب:** ${userID}`)
            .setThumbnail(user.displayAvatarURL());

        message.channel.send({ embeds: [embed] });

        const logChannel = message.guild.channels.cache.get(config.Rooms.Logscammers);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('سجل إزالة نصاب')
                .setColor("Red")
                .setDescription(`**النصاب:** ${user.tag} (\`${userID}\`)\n- **المسؤول عن الإزالة:** ${message.author.tag}\n- **سبب الإزالة:** ${reason}`)
                .setThumbnail(message.author.displayAvatarURL())
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        } else {
            console.error('لم يتم العثور على قناة السجل.');
        }
    }
});
