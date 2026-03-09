const { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder } = require('discord.js');
const { client, db, settings } = require('../../index');
const config = require('../../config/settings'); 
const { createEmbed } = require('../../function/function/Embed');
const fs = require('fs');
const path = require('path');
client.on('interactionCreate', async (interaction) => {
    try{
  if (!interaction.isButton()) return;
        if(interaction.customId == "7thf"){
        if(!interaction.member.roles.cache.has(settings.Admins.Mzad))return interaction.followUp({content: `** الزر خاص بالادارة **`, ephemeral: true});
            await interaction.message.delete();
           await interaction.reply({content: `تم حذف المزاد بنجاح ✅`, ephemeral: true})
        }
    }catch(err){console.log(err)}
});
client.on('interactionCreate', async (interaction) => {
    try{
  if (!interaction.isButton()) return;
        if(interaction.customId == "nshr"){
            if(!interaction.member.roles.cache.has(settings.Admins.Mzad))return interaction.followUp({content: `** الزر خاص بالادارة **`, ephemeral: true});
            const embed = interaction.message.embeds[0];
            const chmz = client.channels.cache.get(config.Rooms.PublishedAuctions)
            let roow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setLabel("اضــغـط للمزايدة")
            .setCustomId("mzeda")
            .setStyle(ButtonStyle.Secondary),
             new ButtonBuilder()
            .setLabel("انـهـاء الـمزاد")
            .setCustomId("ennd")
            .setStyle(ButtonStyle.Secondary)
            )
            await chmz.send({embeds: [embed], components: [roow]});
            const mb = interaction.message.components;
mb.forEach(component => {
  component.components.forEach(button => {
    button.disabled = true;
  });
});
            interaction.message.embeds[0].title = "تــم نشــر الســلعـة ✅";
            interaction.message.embeds[0].color = "RED";
            
const messageImage = interaction.message.attachments.first();
            if(messageImage){
interaction.message.embeds[0].image = messageImage.url
            
        }
await interaction.message.edit({embeds: [interaction.message.embeds[0]], components: mb });
           await interaction.reply({content: `تم نـشـر الـمـزاد بـنـجاح ✅`, ephemeral: true})
            
        }
    }catch(err){console.log(err)}
});


  client.on('interactionCreate', async (interaction) => {
    try{
  if (!interaction.isButton()) return;
        if(interaction.customId == "ennd"){
          if(!interaction.member.roles.cache.has(settings.Admins.Mzad))return interaction.followUp({content: `** الزر خاص بالادارة **`, ephemeral: true});
          const mb = interaction.message.components;
mb.forEach(component => {
  component.components.forEach(button => {
    button.disabled = true;
  });
});
    interaction.message.embeds[0].title = "انـتـهى المـزاد هـذا ✅";
            interaction.message.embeds[0].color = "GREEN";
            
            await interaction.update({ embeds: [interaction.message.embeds[0]], components: mb });

        }
    }catch(err){console.log(err)}
});
