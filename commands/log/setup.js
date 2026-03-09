const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { client, settings } = require('../../index');

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  if (message.content.startsWith(`${settings.prefix}log-creat`)) {
    if (!settings.Owners.includes(message.author.id)) return;

    const guild = message.guild;
    const channels = [
      "log-join-leave", "log-ban-unban", "log-kick", "log-messages", "log-pic",
      "log-roles", "log-links", "log-nickname", "log-channels", "log-vjoin-vexit",
      "log-move", "log-tmute-untmute", "log-bots"
    ];

    const loadingMessage = await message.channel.send("جاري إنشاء الرومات...");

    let category = guild.channels.cache.find(c => c.name === "logs" && c.type === ChannelType.GuildCategory);

    if (!category) {
      try {
        category = await guild.channels.create({
          name: "logs",
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel] }
          ]
        });
      } catch (err) {
        console.error('Error creating category:', err);
        return loadingMessage.edit(`❌ خطأ أثناء إنشاء الكاتيجوري: ${err.message}`);
      }
    }

    for (let ch of channels) {
      const exists = guild.channels.cache.find(c =>
        c.name === ch &&
        c.type === ChannelType.GuildText &&
        c.parentId === category.id
      );

      if (!exists) {
        try {
          await guild.channels.create({
            name: ch,
            type: ChannelType.GuildText,
            parent: category.id
          });
        } catch (err) {
          console.error(`Error creating channel ${ch}:`, err);
        }
      }
    }

    await loadingMessage.edit("✅ تم إنشاء رومات اللوج بنجاح!");
  }
});
