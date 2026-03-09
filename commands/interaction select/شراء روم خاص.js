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
  ApplicationCommandType,
  ChannelType
} = require('discord.js');

const { client, db, dbTickets, settings } = require('../../index');
const { createEmbed } = require('../../function/function/Embed');
const path = require('path');
const fs = require('fs');
const checkCredits = require('../../function/function/checkCredits');
const Config = require('../../config/prices');

const privateSPath = path.join(__dirname, '../../data/privateS.json');
const privateRoomMessageMap = new Map();

client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== 'select_Buy') return;

  const selectedValue = interaction.values[0];
  if (selectedValue === 'Buy_Privte_Room') {
    const tax = Math.floor(Config.PrivteRoom.Day7 * (20 / 19) + 1);
    const embed = createEmbed({
      interaction,
      title: `عملية شراء روم خاص 7 ايام`,
      image: null,
      color: settings.لون_الامبيد,
      description: `لأكمال عملية شراء الروم الخاص، يرجي نسخ الكود بالاسفل واتمام عملية التحويل\n\n\`\`\`#credit ${settings.BankID} ${tax}\`\`\``
    });

    const copyButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("sends_credit_msg")
        .setLabel("نسخ الأمر")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [copyButton] });
    await interaction.channel.send(`#credit ${settings.BankID} ${tax}`);

    const result = await checkCredits(interaction, Config.PrivteRoom.Day7, 60000, settings.BankID, settings.Probot);

    if (result.success) {
      const DataTicket = await dbTickets.get(`Tickets_Support`);
      const ExitData = DataTicket?.find(t => t.Ticket == interaction.channel.id);
      if (ExitData && !ExitData.Buys) {
        ExitData.Buys = "تم شراء روم خاص 7 ايام";
        await dbTickets.set(`Tickets_Support`, DataTicket);
      }

      const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('PrivteRoomCreate')
          .setLabel(`اضغط هنا لأكمال العملية`)
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.editReply({
        embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`**- تمت عملية الشراء بنجاح ✅\n\n اضغط علي الزر بالاسفل وضع اسم الروم الذي تريده وسيتم انشائه**`)],
        components: [button],
      });

      const Log = await interaction.guild.channels.cache.get(settings.Rooms.LogPosts);
      if (Log) {
        const logEmbed = createEmbed({
          interaction,
          title: `عملية شراء روم خاص ناجحة`,
          image: null,
          color: settings.لون_الامبيد,
          description: `- تم شراء روم خاص بنجاح\n- الشخص: ${interaction.user}\n- السعر: ${Config.PrivteRoom.Day7}\n- الوقت: <t:${Math.floor(Date.now() / 1000)}:R>`
        });
        await Log.send({ embeds: [logEmbed] });
      }
    } else {
      await interaction.editReply({
        embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`لقد انتهى الوقت، لا تقم بالتحويل ${interaction.user}`)],
        components: [],
      });
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'PrivteRoomCreate') {
    const PostModalBuilder = new ModalBuilder()
      .setCustomId('PostModalBuilderPrivteRoom')
      .setTitle('اتمام عملية شراء الروم الخاص');

    const NameRoom = new TextInputBuilder()
      .setCustomId('NameRoom')
      .setLabel("حابب يكون اسم رومك اي؟")
      .setPlaceholder('اكتب اسم الروم هنا !')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    PostModalBuilder.addComponents(new ActionRowBuilder().addComponents(NameRoom));
    await interaction.showModal(PostModalBuilder);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== 'PostModalBuilderPrivteRoom') return;

  const chname = interaction.fields.getTextInputValue('NameRoom');
  const channelName = `✧・${chname}`;
  const creationTime = Date.now();
  const expirationTime = creationTime + 7 * 24 * 60 * 60 * 1000; // 7 أيام

  try {
    const privateSRoom = await interaction.guild.channels.create(channelName, {
      type: ChannelType.GuildText,
      parent: settings.Rooms.CeatogryPrivteRooms || null,
      rateLimitPerUser: 3600,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel],
          deny: [PermissionFlagsBits.SendMessages]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle("- Private S Room")
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setColor(settings.EmbedColor)
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setDescription(`**Owner: ${interaction.user}\nEnds in: <t:${Math.floor(expirationTime / 1000)}:R>\n\n- Created Date: <t:${Math.floor(creationTime / 1000)}:F>\n- End Date: <t:${Math.floor(expirationTime / 1000)}:F>**`);

    const changenamebtn = new ButtonBuilder()
      .setCustomId(`change_${interaction.user.id}`)
      .setLabel("Change Name")
      .setStyle(ButtonStyle.Secondary);

    await privateSRoom.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(changenamebtn)]
    });

    const doneEmbed = new EmbedBuilder()
      .setTitle("عملية إنشاء روم خاص ناجحة")
      .setDescription("**- تم إنشاء الروم الخاص بنجاح ✅**")
      .addFields({ name: '📌 اسم الروم', value: `\`${channelName}\`` })
      .setColor(settings.EmbedColor)
      .setTimestamp();

    await interaction.reply({ embeds: [doneEmbed] });

    let privateSData = {};
    if (fs.existsSync(privateSPath)) {
      privateSData = JSON.parse(fs.readFileSync(privateSPath, 'utf8'));
    }

    privateSData[interaction.user.id] = {
      userId: interaction.user.id,
      roomId: privateSRoom.id,
      roomName: channelName,
      isOpen: true,
      createdAt: creationTime,
      expiresAt: expirationTime
    };

    fs.writeFileSync(privateSPath, JSON.stringify(privateSData, null, 4));
  } catch (error) {
    console.error("Error creating private room:", error);
    await interaction.channel.send({ content: "❌ **حدث خطأ أثناء إنشاء الروم الخاص.**" });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith('change_')) return;

  const userId = interaction.customId.split('_')[1];
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "❌ لا يمكنك استخدام هذا الزر، فقط صاحب الروم يمكنه ذلك.", ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId('ChangeRoomNameModalBuilder')
    .setTitle('تغيير اسم الروم');

  const nameInput = new TextInputBuilder()
    .setCustomId('NewRoomName')
    .setLabel("ادخل الاسم الجديد للروم:")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
  await interaction.showModal(modal);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== 'ChangeRoomNameModalBuilder') return;

  const newName = interaction.fields.getTextInputValue('NewRoomName');
  const channel = interaction.channel;

  try {
    await channel.setName(`✧・${newName}`);
    await interaction.reply({ content: `✅ تم تغيير اسم الروم إلى: ✧・${newName}`, ephemeral: true });

    if (fs.existsSync(privateSPath)) {
      const data = JSON.parse(fs.readFileSync(privateSPath, 'utf8'));
      if (data[interaction.user.id]) {
        data[interaction.user.id].roomName = `✧・${newName}`;
        fs.writeFileSync(privateSPath, JSON.stringify(data, null, 4));
      }
    }
  } catch (err) {
    console.error("Error changing room name:", err);
    await interaction.reply({ content: "❌ حصل خطأ أثناء تغيير الاسم", ephemeral: true });
  }
});

async function checkRooms() {
  if (!fs.existsSync(privateSPath)) return;

  let privateSData = JSON.parse(fs.readFileSync(privateSPath, "utf8"));
  let updatedData = { ...privateSData };

  for (const userId in privateSData) {
    const roomId = privateSData[userId].roomId;
    const channel = await client.channels.fetch(roomId).catch(() => null);
    if (!channel) {
      delete updatedData[userId];
    }
  }

  fs.writeFileSync(privateSPath, JSON.stringify(updatedData, null, 4));
}

setInterval(checkRooms, 60 * 60 * 1000);
