const { client, db, settings } = require('../../index');

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefixes = [settings.prefix, '$'];
    let usedPrefix = null;
    for (const p of prefixes) {
        if (message.content.startsWith(p + 'دخول')) {
            usedPrefix = p;
            break;
        }
    }

    if (!usedPrefix) return;

    const isOwner = settings.Owners.includes(message.author.id);
    const isCoOwner = message.member.roles.cache.has(settings.RoleCoOwner);

    if (!isOwner && !isCoOwner) return;

    const args = message.content.slice((usedPrefix + 'دخول').length).trim().split(/\s+/);
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    const welcomeText = args.slice(1).join(' ');

    if (!channel || !welcomeText) {
        return message.reply(`**الاستخدام الصحيح : \`${usedPrefix}دخول\` <#channel> <message>**`);
    }

    let configs = await db.get('WelcomeConfig') || [];
    if (!Array.isArray(configs)) configs = [configs]; // Migration for old single config

    const index = configs.findIndex(c => c.channelId === channel.id);
    if (index !== -1) {
        configs[index].message = welcomeText;
    } else {
        configs.push({
            channelId: channel.id,
            message: welcomeText
        });
    }

    await db.set('WelcomeConfig', configs);

    return message.reply(`** تم ضبط نظام الدخول بنجاح!**\n**القناة:** ${channel}\n**الرسالة:** ${welcomeText}\n**عدد الأنظمة المفعلة حالياً:** ${configs.length}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefixes = [settings.prefix, '$'];
    let usedPrefix = null;
    for (const p of prefixes) {
        if (message.content.startsWith(p + 'الغاء-دخول')) {
            usedPrefix = p;
            break;
        }
    }

    if (!usedPrefix) return;

    const isOwner = settings.Owners.includes(message.author.id);
    const isCoOwner = message.member.roles.cache.has(settings.RoleCoOwner);
    if (!isOwner && !isCoOwner) return;

    const args = message.content.slice((usedPrefix + 'الغاء-دخول').length).trim().split(/\s+/);
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

    if (!channel) {
        return message.reply(`**الاستخدام الصحيح : \`${usedPrefix}الغاء-دخول\` <#channel>**`);
    }

    let configs = await db.get('WelcomeConfig') || [];
    if (!Array.isArray(configs)) configs = [configs];

    const filteredConfigs = configs.filter(c => c.channelId !== channel.id);

    if (configs.length === filteredConfigs.length) {
        return message.reply(`**- هذه القناة ليست مضافة في نظام الدخول أصلاً.**`);
    }

    await db.set('WelcomeConfig', filteredConfigs);
    return message.reply(`**- تم إلغاء نظام الدخول للقناة ${channel} بنجاح.**\n**الأنظمة المتبقية:** ${filteredConfigs.length}`);
});

client.on('guildMemberAdd', async (member) => {
    let configs = await db.get('WelcomeConfig');
    if (!configs) return;
    if (!Array.isArray(configs)) configs = [configs];

    for (const config of configs) {
        if (!config.channelId || !config.message) continue;
        const channel = member.guild.channels.cache.get(config.channelId);
        if (!channel) continue;

        try {
            await channel.send(`${member} ${config.message}`);
        } catch (error) {
            console.error('Error sending welcome message:', error);
        }
    }
});
