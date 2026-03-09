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
const { createEmbed } = require('../../function/function/Embed');

client.on('messageCreate', async msg => {
  if (msg.author.bot) return;
  if (msg.content == settings.prefix + `helper`) {
    if (!msg.member.roles.cache.has(settings.Admins.DiscordStaff)) return;

    const embed = createEmbed({
      interaction: msg,
      title: 'مساعد الادارة الذكي',
      description: `ازيك ي ${msg.author} , ازاي اقدر اساعدك ؟`,
    });

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('RedBull_Helber')
          .setPlaceholder(`${msg.author.displayName} محتاج مساعدة ؟`)
          .addOptions([
            {
              label: 'فحص تكت',
              value: 'فحص تكت',
            },
            {
              label: 'فحص تحذير',
              value: 'فحص تحذير',
            },
            {
              label: 'فحص بوست',
              value: 'فحص بوست',
            },
          ]),
      );

    const but = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('CancelButton')
        .setLabel('الغاء العملية ؟')
        .setStyle(ButtonStyle.Danger)
    );

    await msg.reply({ embeds: [embed], components: [row, but] });
  }
});
