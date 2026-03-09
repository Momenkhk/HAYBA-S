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
const dataFile = 'infoData.json';
const fs = require('fs');
const prices = require('../../config/prices');

function parseAmount(input) {
    const suffixes = { k: 1e3, m: 1e6 };
    const match = input.match(/^([\d.]+)([km]?)$/i);

    if (!match) return null;

    const number = parseFloat(match[1]);
    const suffix = match[2].toLowerCase();

    if (suffixes.hasOwnProperty(suffix)) {
        return number * suffixes[suffix];
    }

    return number;
}

function calculateTax(amount) {
    return Math.floor(amount * (20 / 19) + 1);
}

function calculateBrokerPercentage(amount) {
    return Math.floor((5 / 100) * amount);
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return; // Check if it's a select menu interaction

    if (interaction.customId === 'select_Buy') {
        const selectedValue = interaction.values[0];
        if (selectedValue === 'Buy_Ads_Mention') {
            let infoData = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : {};

            const description = infoData["announcements"] || "❌ **لم يتم تعيين رد لهذه الفئة بعد!**";

            const adsem = new EmbedBuilder()
                .setColor(settings.EmbedColor)
                .setDescription(description);

            const adstypeselect = new StringSelectMenuBuilder()
                .setCustomId('ads_select')
                .setOptions(
                    { label: 'إعلان بدون منشن', value: 'بدون منشن' },
                    { label: 'إعلان مع منشن هير', value: 'منشن هير' },
                    { label: 'إعلان مع منشن ايفري ون', value: 'منشن ايفري ون' },
                    { label: 'إعلان بروم هدايا مع جيفواي (لمدة 3 أيام)', value: 'بروم الهداية' },
                    { label: 'روم خاص مع قيف أواي (لمدة 3 أيام)', value: 'روم خاص مع قيف اوي' },
                    { label: 'أول روم بالسيرفر مع قيف أواي (لمدة أسبوع)', value: 'اول روم' }
                );

            const row = new ActionRowBuilder().addComponents(adstypeselect);
            await interaction.message.delete();
            await interaction.channel.send({ embeds: [adsem], components: [row] });
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return; // Check if it's a select menu interaction
    if (interaction.customId === 'ads_select') {
        const selectedValue = interaction.values[0];
        const user = interaction.guild.members.cache.get(interaction.user.id);

        const args = prices.ads[selectedValue];

        let amount = parseAmount(args);

        const tax = calculateTax(amount);
        const wasitTax = calculateTax(tax);
        const brokerTaxWithoutPercentage = calculateTax(amount + wasitTax);
        const brokerTaxWithPercentage = calculateTax(brokerTaxWithoutPercentage);
        const brokerPercentage = calculateBrokerPercentage(amount);
        const transferWithoutTax = calculateTax(amount - brokerPercentage);
        const transferWithTax = calculateTax(transferWithoutTax);
        const args2 = parseInt(args);

        const buyads = new EmbedBuilder()
            .setTitle(`عملية شراء إعلان: \`${selectedValue}\``)
            .setColor(settings.EmbedColor)
            .setDescription(`**لإكمال شراء الإعلان \`${selectedValue}\` يرجى تحويل \`$${tax}\` إلى <@${settings.BankID}> 

\`- ملاحظة:\`
- التحويل بالضريبة فقط، نحن غير مسؤولين عن التحويل بدون ضرائب.
- التحويل للبنك فقط، نحن غير مسؤولين عن التحويل لشخص آخر.
- التحويل داخل التذكرة فقط، نحن غير مسؤولين عن التحويل خارج التذكرة.

\`\`\`#credit ${settings.BankID} ${tax}\`\`\`**`);

        await interaction.reply({ embeds: [buyads] });
        await interaction.channel.send(`#credit ${settings.BankID} ${tax}`);

        const filter = (response) =>
            response.content.startsWith(`**:moneybag: | ${interaction.user.username}, has transferred \`$${Config.ads[selectedValue]}\``) &&
            response.content.includes(settings.BankID) &&
            response.author.id === settings.Probot &&
            response.content.includes(Config.ads[selectedValue]);

        const collector = interaction.channel.createMessageCollector({ filter, time: 300000 });

        collector.on('collect', async (message) => {
            const logChannel = interaction.guild.channels.cache.get(settings.Rooms.LogAds);
            if (logChannel) {
                const adsbtn = new ButtonBuilder()
                    .setCustomId(`ads_${selectedValue}`)
                    .setLabel("أرسل الإعلان")
                    .setStyle(ButtonStyle.Secondary);

                const row = new ActionRowBuilder().addComponents(adsbtn);

                const embed = new EmbedBuilder()
                    .setTitle(" عملية شراء إعلان ")
                    .setColor(settings.EmbedColor)
                    .setThumbnail(interaction.guild.iconURL())
                    .addFields(
                        { name: " العميل", value: `<@${interaction.user.id}>`, inline: true },
                        { name: " نوع الإعلان", value: `\`${selectedValue}\``, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ content: `**- ${user}**`, embeds: [embed] });

                const embed1 = new EmbedBuilder()
                    .setTitle(" عملية شراء ناجحة")
                    .setDescription("**- تمت عملية الشراء بنجاح\n\n اضغط علي الزر بالاسفل وضع اعلانك لكي يتم نشره**")
                    .setColor(settings.EmbedColor)
                    .addFields({ name: ' نوع الإعلان', value: `\`${selectedValue}\`` })
                    .setTimestamp();

                await message.channel.send({ embeds: [embed1], components: [row] });
            }
        });

        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                const alreadybtn = new ButtonBuilder()
                    .setCustomId('back_button')
                    .setLabel("🔙 الرجوع للقائمة الرئيسية")
                    .setStyle(ButtonStyle.Secondary);

                const row = new ActionRowBuilder().addComponents(alreadybtn);

                const timeend = new EmbedBuilder()
                    .setTitle("❌ | انتهى الوقت")
                    .setColor(settings.EmbedColor)
                    .setDescription("**❌ | انتهى الوقت، لا تحول إذا حولت فنحن غير مسؤولين**")
                    .setTimestamp();

                try {
                    await interaction.channel.send({ embeds: [timeend], components: [row] });
                } catch (error) {
                    return;
                }
            }
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId.startsWith('ads_')) {
        const selectedValue = interaction.customId.split("_")[1];

        const modal = new ModalBuilder()
            .setTitle(`إعلان ${selectedValue}`)
            .setCustomId(`adstype_${selectedValue}`);

        const adss = new TextInputBuilder()
            .setCustomId('adss')
            .setLabel("الإعلان")
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph);

        const row1 = new ActionRowBuilder().addComponents(adss);
        modal.addComponents(row1);

        if (['روم خاص مع قيف اوي', 'اول روم'].includes(selectedValue)) {
            const channelName = new TextInputBuilder()
                .setCustomId('channelName')
                .setLabel("اسم الروم")
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            const row2 = new ActionRowBuilder().addComponents(channelName);
            modal.addComponents(row2);
        }

        try {
            await interaction.showModal(modal);
        } catch (error) {
            console.error("خطأ أثناء عرض المودال:", error);
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId.startsWith('adstype_')) {
        const selectedValue = interaction.customId.split("_")[1];
        const adsss = interaction.fields.getTextInputValue('adss');
        const adss = adsss.replace(/@everyone|@here/g, '');
        let channelName;

        if (['روم خاص مع قيف اوي', 'اول روم'].includes(selectedValue)) {
            channelName = interaction.fields.getTextInputValue('channelName');
            if (!channelName) {
                return interaction.reply({ content: '⚠️ يرجى إدخال اسم الروم.', ephemeral: true });
            }
        }

        const adsesschannel = interaction.guild.channels.cache.get(settings.Rooms.RoomAds);
        const giftChannel = interaction.guild.channels.cache.get(settings.Rooms.Giftsad);
        const user = interaction.guild.members.cache.get(interaction.user.id);

        const backButton = new ButtonBuilder()
            .setCustomId('back_button')
            .setLabel("🔙 الرجوع للقائمة الرئيسية")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().setComponents(backButton);

        try {
            if (selectedValue === 'بدون منشن') {
                if (adsesschannel) await adsesschannel.send(`${adss}\n\n**إعلان مدفوع، نحن غير مسؤولين عن أي شيء يحدث داخل السيرفر.**`);
                await adsesschannel.send({ files: [settings.ServerInfo.line] });
            } else if (selectedValue === 'منشن هير') {
                if (adsesschannel) await adsesschannel.send(`${adss}\n\n**إعلان مدفوع، نحن غير مسؤولين عن أي شيء يحدث داخل السيرفر.**\n@here`);
                await adsesschannel.send({ files: [settings.ServerInfo.line] });
            } else if (selectedValue === 'منشن ايفري ون') {
                if (adsesschannel) await adsesschannel.send(`${adss}\n\n**إعلان مدفوع، نحن غير مسؤولين عن أي شيء يحدث داخل السيرفر.**\n@everyone`);
                await adsesschannel.send({ files: [settings.ServerInfo.line] });
            } else if (selectedValue === 'بروم الهداية') {
                if (giftChannel) {
                    await giftChannel.send(`${adss}\n\n**إعلان مدفوع، نحن غير مسؤولين عن أي شيء يحدث داخل السيرفر.**\n@everyone`);
                    await giftChannel.send(`-start <#${giftChannel.id}> 3d 1 500k`);
                    await giftChannel.send({ files: [settings.ServerInfo.line] });
                }
            } else if (selectedValue === 'روم خاص مع قيف اوي') {
                const privateRoom = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: settings.Rooms.CatagoryPrivateAds,
                    topic: 'Room for a giveaway event.',
                });
                await privateRoom.send(adss);
                await privateRoom.send(`-start <#${privateRoom.id}> 3d 1 500k`);
                await privateRoom.send({ files: [settings.ServerInfo.line] });

            } else if (selectedValue === 'اول روم') {
                const privateRoom = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: settings.Rooms.Firstadcatagory,
                    topic: 'First room giveaway event.',
                });
                await privateRoom.send(adss);
                await privateRoom.send(`-start <#${privateRoom.id}> 3d 1 500k`);
                await privateRoom.send({ files: [settings.ServerInfo.line] });

            }
            await interaction.channel.send({ content: `✅ **تم إرسال الإعلان بنجاح: ${user}**` });
            await interaction.update({ components: [row] });
        } catch (error) {
            console.error("خطأ أثناء إرسال الإعلان:", error);
            await interaction.reply({ content: '❌ حدث خطأ أثناء إرسال الإعلان، حاول مرة أخرى لاحقًا.', ephemeral: true });
        }
    }
});
