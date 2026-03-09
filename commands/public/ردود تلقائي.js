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

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Check if it's the correct server (optional, but keep if user wants it restricted)
    const serverID = settings.ServerInfo.serverID;
    if (serverID && message.guild.id !== serverID) return;

    const line = settings.ServerInfo.line;

    // Auto line for "خط" or "-"
    if (message.content === "خط" || message.content === "-") {
        await message.delete().catch(() => { });
        if (line) return message.channel.send({ files: [line] });
    }

    if (message.content === "#دلائل") {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;
        await message.delete().catch(() => { });
        message.channel.send(`**لتقديم بلاغك علي نصـ ـاب اذكر الاتي : 
   -  ايدي النصـ ـاب :
   -  ايدي المنصـ ـوب : 
   -  السـ ـلعه :
   -  سـ3ـرها :
   -  القصه بأختصار :
   -  ارسل__ دليل واحد فقط لكل صورة__ ( دليل اتفاق علي السـ ـلعه , دليل انه نصـ ـب عليك , دليل تحويل الكريديت للنصـ ـاب)**
   **يفضل دليل التحويل من موقع بروبوت**`);
    } else if (message.content === "حول") {
        if (!message.member.roles.cache.has(settings.Admins.DiscordStaff)) return;
        await message.delete().catch(() => { });
        message.channel.send(`التحويل فقط ل <@${settings.BankID}> .**
   اي تحويل خارج التكت او تحويل لشخص اخر لن يتم الاعتراف به**`);
    } else if (message.content === 'بروبوت') {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;
        await message.delete().catch(() => { });
        message.channel.send(`https://probot.io/transactions`);
    } else if (message.content === 'شفر') {
        if (!message.member.roles.cache.has(settings.Admins.DiscordStaff)) return;
        await message.delete().catch(() => { });
        message.channel.send(`** يجب تشفير حرف من الكلمات الاتية :
   
   [ "حساب","بيع","شراء","شوب","متجر,"ديسكورد","نصاب","سعر","متوفر","بوست","نيترو" ]**`);
    } else if (message.content === "منشور") {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;
        await message.delete().catch(() => { });
        message.channel.send(`**منشور مدفوع مالنا علاقة و نخلي مسؤوليتنا عن الي يصير بينكم**`).then(() => {
            if (line) message.channel.send({ files: [line] });
        });
    } else if (message.content === '#خمول') {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;
        await message.delete().catch(() => { });
        message.channel.send(`**في حال عدم الرد خلال 5 دقائق سيتم اغلاق التكت**`);
    } else if (message.content === 'شعار') {
        if (!message.member.roles.cache.has(settings.Admins.DiscordStaff)) return;
        await message.delete().catch(() => { });
        message.channel.send(`**
   الشعار الوحيد لسيرفر ${settings.ServerInfo.serverName || message.guild.name} هو :
   ${settings.RBPrefix} | Name
   **`);
    }
});
