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
    ApplicationCommandType
} = require('discord.js');
const { client, db, dbTickets, settings } = require('../../index');
const { createEmbed } = require('../../function/function/Embed');
const checkCredits = require('../../function/function/checkCredits');
const Config = require('../../config/prices');

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select_Buy') {
        const selectedValue = interaction.values[0];

        if (selectedValue == 'Buy_Ads_Mention') {
            const but = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('CancelButton')
                    .setLabel('الغاء العملية ؟')
                    .setStyle(ButtonStyle.Danger)
            );

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('AdsBuy')
                        .setPlaceholder(`اختار نوع المنشن الي عاوزة  ${interaction.user.displayName}`)
                        .addOptions([
                            {
                                label: `منشن هير`,
                                value: 'MentionHereAds',
                            },
                            {
                                label: `منشن ايفري`,
                                value: 'MentionEveryAds',
                            },
                        ]),
                );
            await interaction.update({ embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`اختار نوع المنشن الي عاوز تشتريه 😊`)], components: [row, but] });
        }
    } else if (interaction.customId == 'AdsBuy') {
        const selectedValue = interaction.values[0];

        if (selectedValue === 'MentionHereAds') {
            const tax = Math.floor(Config.ads.here * (20 / 19) + 1);

            const options = {
                TitleEm: `عملية شراء اعلان منشن هير`,
                ImageEm: null,
                colorEm: settings.لون_الامبيد,
                description: `لأكمال عملية شراء الاعلان , يرجي نسخ الكود بالاسفل واتمام عملية التحويل\n\n \`\`\`#credit ${settings.BankID} ${tax}\`\`\``
            };

            const embed = createEmbed({
                interaction: interaction,
                title: options.TitleEm,
                image: options.ImageEm,
                color: options.colorEm,
                description: options.description
            });

            const copyCreditButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('copyCreditButton')
                    .setLabel('نسخ الامر')
                    .setStyle(ButtonStyle.Secondary)
            );

            await interaction.update({ embeds: [embed], components: [copyCreditButton] });

            const options2 = {
                price: Config.ads.here,
                time: 60000,
                bank: settings.BankID,
                probot: settings.Probot,
            };

            const result = await checkCredits(interaction, options2.price, options2.time, options2.bank, options2.probot);

            if (result.success) {
                const DataTicket = await dbTickets.get(`Tickets_Support`);
                const ExitData = DataTicket?.find((t) => t.Ticket = interaction.channel.id);
                if (ExitData) {
                    if (ExitData.Buys == null) {
                        ExitData.Buys = ["تم شراء اعلان هير"];
                    } else {
                        ExitData.Buys += "تم شراء اعلان هير";
                    }
                    await dbTickets.set(`Tickets_Support`, DataTicket);
                }

                const button = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('adshere')
                        .setLabel(`اضغط هنا لنشر اعلانك`)
                        .setStyle(ButtonStyle.Primary)
                );

                await interaction.editReply({
                    embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`**- تمت عملية الشراء بنجاح ✅\n\n اضغط علي الزر بالاسفل وضع اعلانك لكي يتم نشره**`)],
                    components: [button],
                });

                const Log = await interaction.guild.channels.cache.get(settings.Rooms.LogPosts);
                if (Log) {
                    const embed = createEmbed(interaction, `عملية شراء اعلان ناجحة`, null, options.colorEm, `
- تم عملية شراء اعلان  منشن هير بنجاح , التفاصيل : 
- الشخص : ${interaction.user}
- السعر : ${Config.ads.here}
- الوقت : <t:${Math.floor(Date.now() / 1000)}:R>
`);
                    await Log.send({ embeds: [embed] });
                }
            } else {
                await interaction.editReply({
                    embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`لقد انتهى الوقت، لا تقم بالتحويل ${interaction.user}`)],
                    components: [],
                });
            }

        } else if (selectedValue === 'MentionEveryAds') {

            const tax = Math.floor(Config.ads.every * (20 / 19) + 1);

            const options3 = {
                TitleEm: `عملية شراء اعلان منشن ايفري`,
                ImageEm: null,
                colorEm: settings.لون_الامبيد,
                DesEm: `لأكمال عملية شراء اعلان منشن ايفري , يرجي نسخ الكود بالاسفل واتمام عملية التحويل\n\n \`\`\`#credit ${settings.BankID} ${tax}\`\`\``
            };

            const embed2 = createEmbed({
                interaction: interaction,
                title: options3.TitleEm,
                image: options3.ImageEm,
                color: options3.colorEm,
                description: options3.DesEm
            });

            const copyCreditButtonevery = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('copyCreditButtonevery')
                    .setLabel('نسخ الامر')
                    .setStyle(ButtonStyle.Secondary)
            );

            await interaction.update({ embeds: [embed2], components: [copyCreditButtonevery] });  // Add copy button

            const options2 = {
                price: Config.ads.every,
                time: 60000,
                bank: settings.BankID,
                probot: settings.Probot,
            };

            const result = await checkCredits(interaction, options2.price, options2.time, options2.bank, options2.probot);

            if (result.success) {
                const DataTicket = await dbTickets.get(`Tickets_Support`);
                const ExitData = DataTicket?.find((t) => t.Ticket = interaction.channel.id);
                if (ExitData) {
                    if (ExitData.Buys == null) {
                        ExitData.Buys = "تم شراء اعلان ايفري";
                    }
                    await dbTickets.set(`Tickets_Support`, DataTicket);
                }

                const button = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('adsevery')
                        .setLabel(`اضغط هنا لنشر اعلانك`)
                        .setStyle(ButtonStyle.Primary)
                );

                await interaction.editReply({
                    embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`**- تمت عملية الشراء بنجاح ✅\n\n اضغط علي الزر بالاسفل وضع اعلانك لكي يتم نشره**`)],
                    components: [button],
                });

                const Log = await interaction.guild.channels.cache.get(settings.Rooms.LogPosts);
                if (Log) {
                    const embed = createEmbed(interaction, `عملية شراء اعلان ناجحة`, null, options.colorEm, `
- تم عملية شراء اعلان منشن ايفري بنجاح , التفاصيل : 
- الشخص : ${interaction.user}
- السعر : ${Config.ads.every}
- الوقت : <t:${Math.floor(Date.now() / 1000)}:R>
`);
                    await Log.send({ embeds: [embed] });
                }
            } else {
                await interaction.editReply({
                    embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`لقد انتهى الوقت، لا تقم بالتحويل ${interaction.user}`)],
                    components: [],
                });
            }
        }
    }
});

// Handle the "Copy Credit" button interaction
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'copyCreditButton') {
        // Send the credit info in a copyable format
        const tax = Math.floor(Config.ads.here * (20 / 19) + 1); // Or you can change this based on ad type
        await interaction.reply({
            content: `#credit ${settings.BankID} ${tax}`,
            ephemeral: true
        });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'copyCreditButtonevery') {
        // Send the credit info in a copyable format
        const tax = Math.floor(Config.ads.every * (20 / 19) + 1); // Or you can change this based on ad type
        await interaction.reply({
            content: `#credit ${settings.BankID} ${tax}`,
            ephemeral: true
        });
    }
});

// Handle posting ads after purchase
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId == 'adshere') {
        const PostModal = new ModalBuilder()
            .setCustomId('adsModalHere')
            .setTitle('اتمام عملية نشر اعلانك');
        const ThePost = new TextInputBuilder()
            .setCustomId('ThePost')
            .setLabel("ما هو اعلانك ؟")
            .setPlaceholder('قم بوضع اعلانك دون وضع المنشن !')
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph);
        const firstActionRow = new ActionRowBuilder().addComponents(ThePost);
        PostModal.addComponents(firstActionRow);

        await interaction.showModal(PostModal);
    } else if (interaction.customId == 'adsevery') {

        const PostModal = new ModalBuilder()
            .setCustomId('adsModalEvery')
            .setTitle('اتمام عملية نشر منشورك');
        const ThePost = new TextInputBuilder()
            .setCustomId('ThePost')
            .setLabel("ما هو اعلانك ؟")
            .setPlaceholder('قم بوضع اعلانك دون وضع المنشن !')
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph);
        const firstActionRow = new ActionRowBuilder().addComponents(ThePost);
        PostModal.addComponents(firstActionRow);

        await interaction.showModal(PostModal);
    }
});

// Handle modal submissions
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId == 'adsModalHere') {
        const RoomAds = await interaction.guild.channels.cache.get(settings.Rooms.RoomAds);
        const ThePost = interaction.fields.getTextInputValue('ThePost');
        if (ThePost.includes(`@here`) || ThePost.includes(`@everyone`)) return await interaction.reply({ content: `ضع اعلانك مرة اخرى ولكن بدون منشن !`, ephemeral: true });

        await RoomAds.send({ content: `${ThePost}\n@here` });
        await RoomAds.send({ content: `**الاعلان دا مدفوع ونخلي مسؤليتنا من اي شي يصير بينكم**` });
        await RoomAds.send({ files: [settings.ServerInfo.line] });
        const options = {
            title: 'تم اكتمال عملية شراء اعلانك',
            image: null,
            color: settings.لون_الامبيد,
            description: `- تمت عملية شرائك لأعلان هير بنجاح\n- اعلانك نزل في روم اعلانات المنشن ✅`
        };

        const embed = createEmbed({
            interaction: interaction,
            title: options.title,
            image: options.image,
            color: options.color,
            description: options.description
        });

        await interaction.update({ embeds: [embed], components: [] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId == 'adsModalEvery') {
        const RoomAds = await interaction.guild.channels.cache.get(settings.Rooms.RoomAds);
        const ThePost = interaction.fields.getTextInputValue('ThePost');
        if (ThePost.includes(`@here`) || ThePost.includes(`@everyone`)) return await interaction.reply({ content: `ضع اعلانك مرة اخرى ولكن بدون منشن !`, ephemeral: true });

        await RoomAds.send({ content: `${ThePost}\n@everyone` });
        await RoomAds.send({ content: `**الاعلان دا مدفوع ونخلي مسؤليتنا من اي شي يصير بينكم**` });
        await RoomAds.send({ files: [settings.ServerInfo.line] });
        const options = {
            title: 'تم اكتمال عملية شراء اعلانك',
            image: null,
            color: settings.لون_الامبيد,
            description: `- تمت عملية شرائك لأعلان ايفري بنجاح\n- اعلانك نزل في روم اعلانات المنشن ✅`
        };

        const embed = createEmbed({
            interaction: interaction,
            title: options.title,
            image: options.image,
            color: options.color,
            description: options.description
        });

        await interaction.update({ embeds: [embed], components: [] });
    }
});
