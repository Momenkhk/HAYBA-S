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
const config = require('../../config/settings');
const { CronJob } = require('cron');

const kimomazad = settings.Admins.DiscordLeader;
const auctions = {};

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'Mzad') {
            const isLeader = Array.isArray(kimomazad)
                ? kimomazad.includes(interaction.user.id)
                : interaction.member.roles.cache.has(kimomazad);

            if (!isLeader) {
                return interaction.reply({ content: 'ليس لديك صلاحية لبدأ المزاد!', ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId('startAuctionModalBuilder')
                .setTitle('Start Auction');

            const itemInput = new TextInputBuilder()
                .setCustomId('itemInput')
                .setLabel("السلعه")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('اكتب اسم السلعه.')
                .setRequired(true);

            const descriptionitem = new TextInputBuilder()
                .setCustomId('descriptionitem')
                .setLabel("وصف السلعه")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('اكتب وصف السلعه.')
                .setRequired(true);

            const startingBidInput = new TextInputBuilder()
                .setCustomId('startingBidInput')
                .setLabel("السعر المبدئي")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('اكتب سعر المبدئي (بالارقام فقط).')
                .setRequired(true);

            const durationInput = new TextInputBuilder()
                .setCustomId('durationInput')
                .setLabel("زمن المزاد")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('اكتب زمن المزاد بالدقائق مثال (1m , 20m)')
                .setRequired(true);

            const imageInput = new TextInputBuilder()
                .setCustomId('imageInput')
                .setLabel("صورة السلعة")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('صورة السلعة اذا لم يكن لديك اكتب 0')
                .setRequired(false);

            const row1 = new ActionRowBuilder().addComponents(itemInput);
            const row2 = new ActionRowBuilder().addComponents(startingBidInput);
            const row3 = new ActionRowBuilder().addComponents(durationInput);
            const row4 = new ActionRowBuilder().addComponents(imageInput);
            const row5 = new ActionRowBuilder().addComponents(descriptionitem);

            modal.addComponents(row1, row2, row3, row4, row5);

            await interaction.showModal(modal);
        }

        if (interaction.customId === 'placeBid') {
            const modal = new ModalBuilder()
                .setCustomId('bidModalBuilder')
                .setTitle('Place Your Bid');

            const priceInput = new TextInputBuilder()
                .setCustomId('priceInput')
                .setLabel("سـعـرك")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('أدخل السعر الخاص بك (ارقام فقط)')
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(priceInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'startAuctionModalBuilder') {
            const item = interaction.fields.getTextInputValue('itemInput');
            const startingBidText = interaction.fields.getTextInputValue('startingBidInput');
            const startingBid = parseFloat(startingBidText);
            const durationText = interaction.fields.getTextInputValue('durationInput').replace(/m/gi, '');
            const duration = parseInt(durationText);
            const image = interaction.fields.getTextInputValue('imageInput');
            const description = interaction.fields.getTextInputValue('descriptionitem');

            const channel = client.channels.cache.get(settings.Rooms.PublishedAuctions || config.Rooms.PublishedAuctions);

            if (!item || isNaN(startingBid) || isNaN(duration) || duration <= 0) {
                return interaction.reply({ content: 'لقد وضعت شيء خاطئ حاول مجددا.', ephemeral: true });
            }

            if (!channel) {
                return interaction.reply({ content: 'روم المزاد خاطئ تأكد من الاسم او الأيدي.', ephemeral: true });
            }

            auctions[channel.id] = {
                item,
                description,
                highestBid: startingBid,
                highestBidder: null,
                bids: [],
                endTime: Date.now() + duration * 60000,
                image: validateImageUrl(image) ? image : null,
            };

            const { embeds, components } = await createAuctionEmbed(item, startingBid, duration, auctions[channel.id].image, description);
            const auctionMessage = await channel.send({ embeds, components });

            auctions[channel.id].messageId = auctionMessage.id;

            const job = new CronJob(new Date(Date.now() + duration * 60000), () => {
                endAuction(channel.id);
            });
            job.start();

            await interaction.reply({ content: 'تم بدأ المزاد بنجاح !', ephemeral: true });
        }

        if (interaction.customId === 'bidModalBuilder') {
            const auction = auctions[interaction.channel.id];
            if (!auction) {
                return interaction.reply({ content: 'لقد انتهي المزاد بالفعل.', ephemeral: true });
            }

            const newPrice = parseFloat(interaction.fields.getTextInputValue('priceInput'));
            if (isNaN(newPrice) || newPrice <= auction.highestBid) {
                return interaction.reply({ content: 'حدث خطأ يجب أن تضع رقم أعلي من أعلي سعر للمزايدة.', ephemeral: true });
            }

            auction.highestBid = newPrice;
            auction.highestBidder = interaction.user.id;
            auction.bids.push({ bidder: interaction.user.username, amount: newPrice });
            await updateAuctionEmbed(interaction.channel, auction);
            await interaction.reply({ content: `انت الأن صاحب اعلي مزايدة للآن السعر الذي وضعته : ${newPrice}k`, ephemeral: true });
        }
    }
});

async function createAuctionEmbed(item, startingBid, duration, image, description) {
    const server = client.guilds.cache.first();
    const serverPfp = server ? server.iconURL() : null;

    const auctionEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('مـزاد جـديـد')
        .setDescription('زايد علي هذه السلعة !')
        .addFields(
            { name: 'السلعه:', value: item, inline: true },
            { name: 'وصف السلعه:', value: description || 'لا يوجد', inline: true },
            { name: 'السعر المبدئي:', value: `${startingBid}k`, inline: true },
            { name: 'أعلي سعر مزايدة:', value: `${startingBid}k`, inline: true },
            { name: 'صاحب أعلي سعر مزايدة:', value: 'لا يوجد مزايدات بعد', inline: true },
            { name: 'ينتهي في:', value: `<t:${Math.floor((Date.now() + duration * 60000) / 1000)}:R>`, inline: true }
        )
        .setThumbnail(serverPfp)
        .setImage(image || null);

    const placeBidButton = new ButtonBuilder()
        .setCustomId('placeBid')
        .setLabel('مزايدة')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(placeBidButton);

    return { embeds: [auctionEmbed], components: [row] };
}

async function updateAuctionEmbed(channel, auction) {
    try {
        const message = await channel.messages.fetch(auction.messageId);
        if (!message) return;

        const server = channel.guild;
        const serverPfp = server ? server.iconURL() : null;

        const auctionEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('مـزاد جـديـد')
            .setDescription('زايد علي هذه السلعة !')
            .addFields(
                { name: 'السلعه:', value: auction.item, inline: false },
                { name: 'أعلي سعر مزايدة:', value: `${auction.highestBid}k`, inline: false },
                { name: 'صاحب أعلي سعر مزايدة:', value: auction.highestBidder ? `<@${auction.highestBidder}>` : 'لا يوجد مزايدات بعد', inline: false },
                { name: 'ينتهي في:', value: `<t:${Math.floor(auction.endTime / 1000)}:R>`, inline: false }
            )
            .setThumbnail(serverPfp)
            .setImage(auction.image || null);

        const placeBidButton = new ButtonBuilder()
            .setCustomId('placeBid')
            .setLabel('مزايدة')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(placeBidButton);

        await message.edit({ embeds: [auctionEmbed], components: [row] });
    } catch (e) { }
}

async function endAuction(auctionId) {
    const auction = auctions[auctionId];
    if (!auction) return;

    const channel = client.channels.cache.get(auctionId);
    if (!channel) return;

    try {
        const message = await channel.messages.fetch(auction.messageId);
        if (!message) return;

        const server = channel.guild;
        const serverPfp = server ? server.iconURL() : null;

        const resultEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('نتيجة المزاد')
            .addFields(
                { name: 'السلعه:', value: auction.item, inline: false },
                { name: 'الفائز:', value: auction.highestBidder ? `<@${auction.highestBidder}>` : 'لا مزايدات', inline: false },
                { name: 'أعلي سعر مزايدة:', value: `${auction.highestBid}k`, inline: false }
            )
            .setThumbnail(serverPfp)
            .setImage(auction.image || null);

        await message.edit({ embeds: [resultEmbed], components: [] });
    } catch (e) { }

    delete auctions[auctionId]; // Clear the auction
}

function validateImageUrl(url) {
    if (!url || url === '0') return false;
    try {
        new URL(url);
        return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
    } catch (e) {
        return false;
    }
}
