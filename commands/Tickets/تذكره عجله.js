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

client.on('messageCreate', message => {
  if (message.content == settings.prefix + 'setup-spin') {
    if (!settings.Owners.includes(message.author.id)) return;

    const Emmed = new EmbedBuilder()
      .setColor(settings.لون_الامبيد || 'Blue')
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
      .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setImage('https://media.discordapp.net/attachments/1207553954515255327/1207598850710183936/18.png?ex=65e03b12&is=65cdc612&hm=6e8f4bf5c803316aa65173a5e118f19496dfcf35e0e5f57bd597e1d57d9e6be0&=&format=webp&quality=lossless&width=1919&height=599')
      .setDescription(`**يمكنك لف عجلة حظ و الحصول علي جوائز عديده من خلال فتح تذكرة

> الجوائز لكل عجلة 

__Basic Spin__

__Exclusive Spin__


التحويل لـ<@${settings.BankID}>  فقط
 ذا قمت بالتحويل لشخص اخر فنحن لا نتحمل المسؤولية حتى لو اداري قال لك حول للشخص ده
اذا قمت بالتحويل خارج التذكرة فنحن لا نتحمل المسؤولية و لن يتم تعويضك**`);

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('open_Ticket')
          .setPlaceholder('حابب تفتح تكت ؟')
          .addOptions([
            {
              label: 'طلب عجلة الحظ',
              value: 'TicketSpin',
            }
          ]),
      );

    message.channel.send({ embeds: [Emmed], components: [row] });
  }
});

