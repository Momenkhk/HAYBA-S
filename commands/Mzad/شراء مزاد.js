const { Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } = require("discord.js");
const config = require("../../config/settings.js");
const { client, db, dbTickets, settings } = require('../../index');
const price = require('../../config/prices.js');
const checkCredits = require('../../function/function/checkCredits.js');

client.on("interactionCreate", async interaction => {
    try {
        if (interaction.isButton() && interaction.customId === "Mzad") {

            const tax = Math.floor(price.Mzad.mzad * (20 / 19) + 1);

            // إرسال رسالة الدفع وتخزينها لحذفها لاحقاً
            const creditEmbedMsg = await interaction.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('عملية شراء مزاد')
                        .setColor(settings.لون_الامبيد)
                        .setDescription(`لأكمال عملية شراء مزاد , يرجي نسخ الكود بالاسفل واتمام عملية التحويل\n\n \`\`\`#credit ${settings.BankID} ${tax}\`\`\``)
                        .setFooter('لديك دقيقتين للتحويل')
                ]
            });

            const creditMsg = await interaction.channel.send(`#credit ${settings.BankID} ${tax}`);

            const options2 = {
                price: price.Mzad.mzad,
                time: 120000,
                bank: config.BankID,
                probot: config.Probot
            };

            const result = await checkCredits(interaction, options2.price, options2.time, options2.bank, options2.probot);

            if (result.success) {
                // حذف رسائل الدفع
                if (creditEmbedMsg.deletable) await creditEmbedMsg.delete();
                if (creditMsg.deletable) await creditMsg.delete();

                const DataTicket = await dbTickets.get(`Tickets_Mzad`) || [];
                const ExitData = DataTicket.find(t => t.Ticket === interaction.channel.id);

                if (ExitData) {
                    if (!ExitData.Buys) {
                        ExitData.Buys = "تم شراء مزاد";
                    }
                    await dbTickets.set(`Tickets_Mzad`, DataTicket);
                }

                const button = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('modalmz')
                        .setLabel('اضغط هنا لنشر مزادك')
                        .setStyle(ButtonStyle.Primary)
                );

                // إرسال رسالة نجاح جديدة في الروم (ليست reply ولا ephemeral)
                await interaction.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('تمت عملية الشراء بنجاح ✅')
                            .setDescription('**- اضغط على الزر بالأسفل لوضع مزادك لكي يتم نشره**')
                            .setColor(settings.لون_الامبيد)
                    ],
                    components: [button]
                });

                const Log = interaction.guild.channels.cache.get(settings.Rooms.Logmzad);
                if (Log) {
                    const embed = new EmbedBuilder()
                        .setTitle('عملية شراء مزاد ناجحة')
                        .setDescription(`
- تم عملية شراء مزاد بنجاح، التفاصيل:
- الشخص: ${interaction.user.tag}
- السعر: ${price.Mzad.mzad}
- الوقت: <t:${Math.floor(Date.now() / 1000)}:R>
                        `)
                        .setColor(settings.لون_الامبيد);

                    await Log.send({ embeds: [embed] });
                }
            } else {
                await interaction.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('انتهى الوقت، لا تقم بالتحويل الآن ❗')
                            .setColor("Red")
                    ]
                });
            }
        }
    } catch (err) {
        console.error("Error in interactionCreate:", err);
    }
});
