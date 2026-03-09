const { EmbedBuilder } = require('discord.js');
const { client, settings } = require('../../index');

client.on("messageCreate", async (message) => {
  if (message.content.startsWith(settings.prefix + 'dm')) {

    if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) {
      return message.channel.send("**ليس لديك صلاحيات كافية لإرسال الرسالة.**");
    }

    const args = message.content.split(" ").slice(1);
    const userId = args.shift();
    const content = args.join(" ");
    const user = await client.users.fetch(userId).catch(() => null);

    if (!user || !content) {
      return message.channel.send("**الرجاء كتابة الأمر بشكل صحيح: `-dm (user id) (message)`**");
    }

    try {
      const embed = new EmbedBuilder()
        .setDescription(content)
        .setColor("Random");

      await user.send(`**رسالة من: ${message.author.tag}**`).catch(() => { });
      await user.send({ embeds: [embed] }).catch(() => { });
      if (settings.ServerInfo.line) await user.send({ files: [settings.ServerInfo.line] }).catch(() => { });

      await message.channel.send("**تم إرسال الرسالة بنجاح!**");

    } catch (err) {
      console.error(err);
      await message.channel.send("**تعذر إرسال الرسالة، قد يكون الخاص مغلقاً للمستخدم.**");
    }
  }
});
