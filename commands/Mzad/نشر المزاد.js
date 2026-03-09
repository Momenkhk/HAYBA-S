const { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, TextInputStyle } = require('discord.js');
const { client, db, settings } = require('../../index');
const config = require('../../config/settings');
const { createEmbed } = require('../../function/function/Embed');
const fs = require('fs');
const path = require('path');

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId == "modalmz") {
    const modal = new ModalBuilder()
      .setCustomId('mzadmodal')
      .setTitle('تعبئة بيانات المزاد');

    const item = new TextInputBuilder()
      .setCustomId('sl3a')
      .setLabel(`عنوان السلعة التي تريد نشرها`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const description = new TextInputBuilder()
      .setCustomId('osf')
      .setLabel(`وصف السلعة التي وضعت عنوانها`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const pics = new TextInputBuilder()
      .setCustomId('pics')
      .setLabel(`رابط الصورة واحدة فقط ! ( اختياري )`)
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(item);
    const secondActionRow = new ActionRowBuilder().addComponents(description);
    const thirdActionRow = new ActionRowBuilder().addComponents(pics);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    await interaction.showModal(modal);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === 'mzadmodal') {
    try {
      const sl3a = interaction.fields.getTextInputValue('sl3a');
      const osf = interaction.fields.getTextInputValue('osf');
      const pic = interaction.fields.getTextInputValue('pics');

      let roww = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel(`نـشر المـزاد`).setStyle(ButtonStyle.Success).setCustomId("nshr"),
        new ButtonBuilder().setLabel(`حـذف الـمزاد`).setStyle(ButtonStyle.Danger).setCustomId("7thf")
      );

      let embed = new EmbedBuilder()
        .setTitle(`**ســلـعــة جــديــدة**`)
        .addFields(
          {
            name: `> **الـسلـعـة:**`,
            value: `${sl3a}`,
            inline: false
          },
          {
            name: `> **وصـف الســلعـة:**`,
            value: `${osf}`,
            inline: false
          },
          {
            name: `> **بـدايــة الـمـزايـدة:**`,
            value: `30k`,
            inline: false
          },
          {
            name: `> **صــاحـب السـلعـة:**`,
            value: `|| ${interaction.user} ||`,
            inline: false
          }
        )
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setThumbnail(interaction.guild.iconURL())
        .setTimestamp();

      const chlog = client.channels.cache.get(config.Rooms.AuctionRoom);
      if (pic) {
        embed.setImage(pic);
      }

      if (chlog) {
        await chlog.send({ content: `**- تم نشر مزad جديد من قبل ${interaction.user}**`, embeds: [embed], components: [roww] });
        await chlog.send({ files: [settings.ServerInfo.line] });
      }

      await interaction.message.delete().catch(() => { });
      await interaction.reply({ content: `تـم ارسـال مـزادك فــي روم عـروض بـنـجـاح ✅\n${interaction.user}`, ephemeral: true });

    } catch (err) {
      console.log(err);
    }
  }
});
