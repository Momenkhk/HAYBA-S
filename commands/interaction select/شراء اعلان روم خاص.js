// const {
//     GatewayIntentBits,
//     Collection,
//     Client,
//     GuildMember,
//     ActionRowBuilder,
//     WebhookClient,
//     MessagePayload,
//     GatewayIntentBits,
//     StringSelectMenuBuilder,
//     ModalBuilder,
//     EmbedBuilder,
//     ButtonBuilder,
//     AttachmentBuilder,
//     PermissionFlagsBits,
//     TextInputBuilder
//   } = require('discord.js');
//   const { client, db, dbTickets, settings } = require('../../index');
//   const { createEmbed } = require('../../function/function/Embed');
//   const checkCredits = require('../../function/function/checkCredits');
//   const Config = require('../../config/prices');
  
//   client.on('interactionCreate', async interaction => {
//     if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;
  
//     if (interaction.isStringSelectMenu() && interaction.customId === 'select_Buy') {
//       const selectedValue = interaction.values[0];
  
//       if (selectedValue === 'Buy_Ads_Room') {
//         const tax = Math.floor(Config.ads.privteRoom * (20 / 19) + 1);
//         const embedOptions = {
//           title: 'عملية شراء اعلان روم خاص ايفري',
//           image: null,
//           color: settings.لون_الامبيد,
//           description: `لإكمال عملية شراء الإعلان، يرجى نسخ الكود أدناه وإتمام عملية التحويل:
  
//   \`\`\`#credit ${settings.BankID} ${tax}\`\`\``
//         };
  
//         const embed = createEmbed({
//           interaction: interaction,
//           ...embedOptions
//         });
  
//         const cancelButton = new ActionRowBuilder().addComponents(
//           new ButtonBuilder()
//             .setCustomId('CancelButton')
//             .setLabel('إلغاء العملية؟')
//             .setStyle(ButtonStyle.Danger)
//         );
  
//         const copyButton = new ActionRowBuilder().addComponents(
//           new ButtonBuilder()
//             .setCustomId("sends_credit_msg")
//             .setLabel("نسخ الأمر")
//             .setStyle(ButtonStyle.Secondary)
//         );
  
//         await interaction.update({ embeds: [embed], components: [copyButton, cancelButton] });
  
//         const options2 = {
//           price: Config.ads.privteRoom,
//           time: 60000,
//           bank: settings.BankID,
//           probot: settings.Probot,
//         };
  
//         const result = await checkCredits(interaction, options2.price, options2.time, options2.bank, options2.probot);
  
//         if (result.success) {
//           const DataTicket = await dbTickets.get(`Tickets_Support`);
//           const ExitData = DataTicket?.find((t) => t.Ticket === interaction.channel.id);
//           if (ExitData) {
//             if (ExitData.Buys == null) {
//               ExitData.Buys = "تم شراء اعلان روم خاص ايفري";
//             }
//             await dbTickets.set(`Tickets_Support`, DataTicket);
//           }
  
//           const postButton = new ActionRowBuilder().addComponents(
//             new ButtonBuilder()
//               .setCustomId('AdsPrivteroom')
//               .setLabel('اضغط هنا لنشر إعلانك')
//               .setStyle(ButtonStyle.Primary)
//           );
  
//           await interaction.editReply({
//             embeds: [
//               interaction.message.embeds[0].setDescription(
//                 `**- تمت عملية الشراء بنجاح ✅\n\nاضغط على الزر بالأسفل وضع إعلانك لكي يتم نشره**`
//               )
//             ],
//             components: [postButton],
//           });
  
//           const Log = await interaction.guild.channels.cache.get(settings.Rooms.LogPosts);
//           if (Log) {
//             const logEmbed = createEmbed({
//               interaction,
//               title: `عملية شراء إعلان ناجحة`,
//               image: null,
//               color: embedOptions.color,
//               description: `
//   - تم شراء إعلان روم خاص منشن إيفري بنجاح، التفاصيل:
//   - الشخص: ${interaction.user}
//   - السعر: ${Config.ads.privteRoom}
//   - الوقت: <t:${Math.floor(Date.now() / 1000)}:R>`
//             });
//             await Log.send({ embeds: [logEmbed] });
//           }
  
//         } else {
//           await interaction.editReply({
//             embeds: [
//               interaction.message.embeds[0].setDescription(
//                 `لقد انتهى الوقت، لا تقم بالتحويل ${interaction.user}`
//               )
//             ],
//             components: [],
//           });
//         }
//       }
//     }
  
//     if (interaction.isButton() && interaction.customId === "sends_credit_msg") {
//       try {
//         const tax = Math.floor(Config.ads.privteRoom * (20 / 19) + 1);
//         const creditMessage = `#credit ${settings.BankID} ${tax}`;
  
//         await interaction.deferUpdate();
  
//         await interaction.followUp({
//           content: `${creditMessage}`,
//           ephemeral: true,
//         });
//       } catch (error) {
//         console.error("Error handling 'sends_credit_msg' button:", error);
//         await interaction.followUp({
//           content: "حدث خطأ أثناء معالجة الطلب. يرجى المحاولة لاحقًا.",
//           ephemeral: true,
//         });
//       }
//     }
//   });
  

// ///// زر منشن هير  
// client.on('interactionCreate', async interaction => {
//     if (!interaction.isButton()) return;
//     if (interaction.customId == 'AdsPrivteroom') {

//         const PostModalBuilder = new ModalBuilder()
//             .setCustomId('adsModalBuilderEveryPrivteRoom')
//             .setTitle('اتمام عملية نشر منشورك');

//         const ThePost = new TextInputBuilder()
//             .setCustomId('ThePost')
//             .setLabel("ما هو اعلانك ؟")
//             .setPlaceholder('قم بوضع اعلانك دون وضع المنشن !')
//             .setRequired(true)
//             .setStyle('PARAGRAPH');

//         const NamePrivteRoom = new TextInputBuilder()
//             .setCustomId('NamePrivteRoom')
//             .setLabel("ما هو اسم الروم الخاص الذي تريده ؟")
//             .setPlaceholder('قم بوضع اسم الروم  !')
//             .setRequired(true)
//             .setStyle('PARAGRAPH');

//         const firstActionRow = new ActionRowBuilder().addComponents(ThePost);
//         const firstActionRow2 = new ActionRowBuilder().addComponents(NamePrivteRoom);

//         PostModalBuilder.addComponents(firstActionRow, firstActionRow2);

//         await interaction.showModal(PostModalBuilder);

//     }
// });

// client.on('interactionCreate', async interaction => {
//     if (!interaction.isModalSubmit()) return;
//     if (interaction.customId == 'adsModalBuilderEveryPrivteRoom') {
//         const ThePost = interaction.fields.getTextInputValue('ThePost');
//         const NamePrivteRoom = interaction.fields.getTextInputValue('NamePrivteRoom');

//         const ChannelAds = await interaction.guild.channels.create(NamePrivteRoom, {
//             type: 'GUILD_TEXT',
//             parent: settings.Rooms.CeatogryPrivteRoomad,
//             permissionOverwrites: [
//                 {
//                     id: interaction.guild.roles.everyone.id,
//                     deny: ['SEND_MESSAGES', 'MANAGE_CHANNELS']
//                 }

//             ]
//         });

//         await ChannelAds.send({ content: `${ThePost}\n@everyone` });
//         await ChannelAds.send(`-start ${ChannelAds} 3d 3 300k`);
//         setTimeout(() => {
//             ChannelAds.send({ content: `**الاعلان دا مدفوع ونخلي مسؤليتنا من اي شي يصير بينكم**` });
//             ChannelAds.send({ files: [settings.ServerInfo.line] });
//         }, 2000);

//         const options = {
//             title: 'تم اكتمال عملية شراء اعلانك',
//             image: null,
//             color: settings.لون_الامبيد,
//             description: `- تمت عملية شرائك لأعلان ايفري بنجاح\n- اعلانك نزل في رومك الخاص ${ChannelAds} ✅`
//         };

//         const embed = createEmbed({
//             interaction: interaction,
//             title: options.title,
//             image: options.image,
//             color: options.color,
//             description: options.description
//         });

//         await interaction.update({ embeds: [embed], components: [] });
//     }
// });
