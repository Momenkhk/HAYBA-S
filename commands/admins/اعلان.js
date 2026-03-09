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
const { client, settings } = require('../../index');
const { createEmbed } = require('../../function/function/Embed');

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(settings.prefix + 'setup-ads')) return;
  if (!settings.Owners.includes(message.author.id)) return;

  const embed = new EmbedBuilder()
    .setThumbnail(message.guild.iconURL({ dynamic: true }))
    .setColor(settings.لون_الامبيد || 0x0099ff)
    .setTitle('اختر نوع الإعلان')
    .setDescription([
      `> **No Mention** :`,
      `لـ نشر اعلان في : <#${settings.Rooms.RoomAds}> بـ دون منشن (بدون منشن) !\n`,

      `> **Mention Here** :`,
      `لـ نشر اعلان في :<#${settings.Rooms.RoomAds}>> بـ منشن للاونلاين (هير) !\n`,

      `> **Mention Everyone** :`,
      `لـ نشر اعلان في : <#${settings.Rooms.RoomAds}> بـ منشن للكل (ايفريون) !\n`,

      `> **Gift** :`,
      `لـ نشر اعلان في : <#${settings.Rooms.Giftsad}> بـ منشن للكل (ايفريون) مع جيفاواي لـ مدة ثلاث ايام !\n`,

      `> **Private Room without Giveaway** :`,
      `لـ نشر اعلان روم خاص بـ كاتجوري الاعلانات بـ منشن للكل (ايفريون) بدون جيفاواي لـ مدة 3 ايام !\n`,

      `> **Private Room with Giveaway** :`,
      `لـ نشر اعلان روم خاص بـ كاتجوري الاعلانات بـ منشن للكل (ايفريون) لـ مدة 3 ايام مع جيفاواي !`
    ].join('\n'))
    .setImage(settings.ServerInfo.ads);

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ads_select_type')
      .setPlaceholder('Select Ad Type ..')
      .addOptions([
        { label: 'No Mention', value: 'no_mention' },
        { label: 'Mention Here', value: 'mention_here' },
        { label: 'Mention Everyone', value: 'mention_everyone' },
        { label: 'Gift', value: 'gift' },
        { label: 'Private w/o Giveaway', value: 'private_no_give' },
        { label: 'Private w/ Giveaway', value: 'private_with_give' }
      ])
  );

  await message.channel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async interaction => {
  // 1) Select-menu handler
  if (interaction.isStringSelectMenu() && interaction.customId === 'ads_select_type') {
    const choice = interaction.values[0];
    const modal = new ModalBuilder()
      .setCustomId(`ads_modal|${choice}`)
      .setTitle(`Ad — ${choice.replace(/_/g, ' ')}`);

    const ownerField = new TextInputBuilder()
      .setCustomId('ads_ownerId')
      .setLabel('أيدي صاحب الإعلان')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const adField = new TextInputBuilder()
      .setCustomId('ads_adText')
      .setLabel('نص الإعلان')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const reasonField = new TextInputBuilder()
      .setCustomId('ads_reason')
      .setLabel('سبب نشر الإعلان')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ownerField),
      new ActionRowBuilder().addComponents(adField),
      new ActionRowBuilder().addComponents(reasonField)
    );

    if (choice === 'private_no_give' || choice === 'private_with_give') {
      const roomField = new TextInputBuilder()
        .setCustomId('ads_roomName')
        .setLabel('اسم الروم الخاص')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(roomField));
    }

    return interaction.showModal(modal);
  }

  // 2) ModalBuilder-submit handler
  if (interaction.isModalSubmit() && interaction.customId.startsWith('ads_modal|')) {
    await interaction.deferReply({ ephemeral: true });

    const choice = interaction.customId.split('|')[1];
    const fields = interaction.fields;

    const ownerId = fields.getTextInputValue('ads_ownerId');
    const adText = fields.getTextInputValue('ads_adText');
    const reason = fields.getTextInputValue('ads_reason');
    let roomName = null;

    try {
      roomName = interaction.fields.getTextInputValue('ads_roomName');
    } catch (e) {
      // roomName not required, skip
    }

    const guild = interaction.guild;
    const adsChannel = guild.channels.cache.get(settings.Rooms.RoomAds);
    const giftChannel = guild.channels.cache.get(settings.Rooms.Giftsad);
    const privateCatId = settings.Rooms.Firstadcatagory;
    const logChannel = guild.channels.cache.get(settings.Rooms.LogAds);

    let sentMsg, target;

    try {
      if (choice === 'no_mention') {
        target = adsChannel;
        if (!target) return interaction.editReply({ content: '**❌ لم يتم توفير ايدي روم الاعلانات في الـ settings.js**' });
        sentMsg = await target.send({ content: `${adText}\n\n**إعلان مدفوع، نحن غير مسؤولين عن أي شيء يحدث داخل السيرفر.**` });
      } else if (choice === 'mention_here') {
        target = adsChannel;
        if (!target) return interaction.editReply({ content: '**❌ لم يتم توفير ايدي روم الاعلانات في الـ settings.js**' });
        sentMsg = await target.send({ content: `${adText}\n\n**إعلان مدفوع، نحن غير مسؤولين عن أي شيء يحدث داخل السيرفر.**\n@here` });
      } else if (choice === 'mention_everyone') {
        target = adsChannel;
        if (!target) return interaction.editReply({ content: '**❌ لم يتم توفير ايدي روم الاعلانات في الـ settings.js**' });
        sentMsg = await target.send({ content: `${adText}\n\n**إعلان مدفوع، نحن غير مسؤولين عن أي شيء يحدث داخل السيرفر.**\n@everyone` });
      } else if (choice === 'gift') {
        target = giftChannel;
        if (!target) return interaction.editReply({ content: '**❌ لم يتم توفير ايدي روم الهدايا (Giftsad) في الـ settings.js**' });
        sentMsg = await target.send({ content: `${adText}\n\n**إعلان مدفوع، نحن غير مسؤولين عن أي شيء يحدث داخل السيرفر.**\n@everyone` });
        await target.send({ content: `-start <#${giftChannel.id}> 3d 1 500k` });
      } else {
        target = await guild.channels.create({
          name: roomName,
          type: ChannelType.GuildText,
          parent: privateCatId || null,
          topic: `Ad room`
        });
        sentMsg = await target.send({ content: `${adText}\n\n**إعلان مدفوع، نحن غير مسؤولين عن أي شيء يحدث داخل السيرفر.**\n@everyone` });
        if (choice === 'private_with_give') {
          await target.send({ content: `-start <#${target.id}> 3d 1 500k` });
        }
      }

      await target.send({ files: [settings.ServerInfo.line] });

      const logEmbed = new EmbedBuilder()
        .setTitle('📝 إعلان جديد')
        .addFields([
          { name: 'الإداري', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'نوع الإعلان', value: choice.replace(/_/g, ' '), inline: true },
          { name: 'صاحب الإعلان', value: `<@${ownerId}>`, inline: true },
          { name: 'السبب', value: reason, inline: true },
          { name: 'رابط الإعلان', value: `[اضغط هنا](${sentMsg.url})` }
        ])
        .setTimestamp()
        .setColor("Blue");

      if (logChannel) await logChannel.send({ embeds: [logEmbed] });
      return interaction.editReply({ content: '✅ تم إرسال الإعلان بنجاح!', ephemeral: true });

    } catch (err) {
      console.error(err);
      return interaction.editReply({ content: '❌ حدث خطأ أثناء معالجة الإعلان.', ephemeral: true });
    }
  }
});
