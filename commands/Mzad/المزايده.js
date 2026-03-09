const { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, TextInputStyle } = require('discord.js');
const { client, db, settings } = require('../../index');
const config = require('../../config/settings');
const { createEmbed } = require('../../function/function/Embed');
const fs = require('fs');
const path = require('path');

client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'mzeda') {
      const modal = new ModalBuilder()
        .setCustomId('modalmze')
        .setTitle('تبعئة بيانات مزايدة');

      const tokennnn = new TextInputBuilder()
        .setCustomId('bank')
        .setLabel(`قم بوضع ايدي البنك في حال لديك !`)
        .setPlaceholder('مثال: 123456789012345678')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const oddf = new TextInputBuilder()
        .setCustomId('mzae')
        .setLabel(`المزايدة هنا رجاء`)
        .setPlaceholder('مثال: 500k')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const firstActionRowwww = new ActionRowBuilder().addComponents(tokennnn);
      const thhreee = new ActionRowBuilder().addComponents(oddf);

      modal.addComponents(firstActionRowwww, thhreee);

      await interaction.showModal(modal);
    }

    else if (interaction.customId.startsWith('warn-')) {
      if (!interaction.member.roles.cache.has(settings.Admins.Mzad)) {
        return interaction.followUp({ content: `** الزر خاص بالادارة **`, ephemeral: true });
      }

      const us = interaction.customId.split('-')[1];
      try {
        const wu = await interaction.guild.members.fetch(us);
        await wu.timeout(3600000, 'تحذير مزاد');
        await interaction.reply({ content: `تم اعـطـاء العضو تـايم اوت ✅`, ephemeral: true });

        // تعطيل الزر
        const mb = interaction.message.components;
        mb.forEach(row => {
          row.components.forEach(button => button.setDisabled(true));
        });

        // تعديل الـ Embed
        const oldEmbed = interaction.message.embeds[0];
        const newEmbed = new EmbedBuilder(oldEmbed)
          .setTitle("الـعضـو مـخالـف ✅")
          .setColor("Red");

        await interaction.message.edit({ embeds: [newEmbed], components: mb });

      } catch (err) {
        console.error(err);
        await interaction.reply({ content: `❌ حدث خطأ أثناء إعطاء التايم أوت`, ephemeral: true });
      }
    }

  } catch (err) {
    console.log(err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === 'modalmze') {
    try {
      const bank = interaction.fields.getTextInputValue('bank');
      const mzae = interaction.fields.getTextInputValue('mzae');

      let roww = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(`تـحـذير الـعضـو`)
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`warn-${interaction.user.id}`)
      );

      let embed = new EmbedBuilder()
        .setDescription(`> **هنالك بنـك؟ :**  __${bank}__\n\n> **اخـر مـزايـدة : ** __${mzae}__`)
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      await interaction.channel.send({ content: `${interaction.user}`, embeds: [embed], components: [roww] });

      if (config.line) {
        await interaction.channel.send({ files: [settings.ServerInfo.line] });
      }

      await interaction.reply({ content: `✅ تم استلام المزايدة بنجاح!`, ephemeral: true });
    } catch (err) {
      console.log(err);
    }
  }
});
