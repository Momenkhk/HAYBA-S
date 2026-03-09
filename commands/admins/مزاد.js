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
const { CronJob } = require('cron');

const kimomazad = settings.Admins.DiscordLeader;
const auctions = {};

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content === settings.prefix + 'مزاد') {
        if (!message.member.roles.cache.has(kimomazad)) {
            return;
        }
        const button = new ButtonBuilder()
            .setCustomId('startAuction')
            .setLabel('بدء المزاد')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await message.reply({ content: 'اضغط علي الزر لانشاء المزاد.', components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'startAuction') {
            const modal = new ModalBuilder()
                .setCustomId('startAuctionModalBuilder')
                .setTitle('Start Auction');

            const itemInput = new TextInputBuilder()
                .setCustomId('itemInput')
                .setLabel("السلعه")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('اكتب اسم السلعه.')
                .setRequired(true);

            const startingBidInput = new TextInputBuilder()
                .setCustomId('startingBidInput')
                .setLabel("السعر المبدئي")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('اكتب سعر المبدئي (بالارقام فقط).')
                .setRequired(true);

            const durationInput = new TextInputBuilder()
                .setCustomId('durationInput')
                .setLabel("زمن المزاد (بالدقائق)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('مثال: 5')
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

            modal.addComponents(row1, row2, row3, row4);

            await interaction.showModal(modal);
        }

        if (interaction.customId === 'placeBid') {
            const auction = auctions[interaction.channel.id];
            if (!auction) {
                return interaction.reply({ content: 'لقد انتهي المزاد بالفعل.', ephemeral: true });
            }

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
            const startingBid = parseFloat(interaction.fields.getTextInputValue('startingBidInput'));
            const durationStr = interaction.fields.getTextInputValue('durationInput');
            const duration = parseInt(durationStr);
            const image = interaction.fields.getTextInputValue('imageInput');

            const channelID = settings.Rooms.PublishedAuctions;
            const channel = client.channels.cache.get(channelID);

            if (!item || isNaN(startingBid) || isNaN(duration) || duration <= 0) {
                return interaction.reply({ content: 'لقد وضعت شيء خاطئ حاول مجددا.', ephemeral: true });
            }

            if (!channel) {
                return interaction.reply({ content: 'روم المزاد خاطئ تأكد من الاسم او الأيدي في الإعدادات.', ephemeral: true });
            }

            auctions[channel.id] = {
                item,
                highestBid: startingBid,
                highestBidder: null,
                bids: [],
                endTime: Date.now() + duration * 60000,
                image: (image === '0' || !image) ? null : image
            };

            const result = await createAuctionEmbed(item, startingBid, duration, (image === '0' || !image) ? null : image, interaction);
            const auctionMessage = await channel.send({ embeds: result.embeds, components: result.components });

            auctions[channel.id].messageId = auctionMessage.id;

            const job = new CronJob(new Date(Date.now() + duration * 60000), () => {
                endAuction(channel.id);
            });
            job.start();

            await interaction.reply({ content: `تم بدأ المزاد بنجاح في ${channel} !`, ephemeral: true });
        }

        if (interaction.customId === 'bidModalBuilder') {
            const auction = auctions[interaction.channel.id];
            if (!auction) {
                return interaction.reply({ content: 'لقد انتهي المزاد بالفعل.', ephemeral: true });
            }

            const newPrice = parseFloat(interaction.fields.getTextInputValue('priceInput'));
            if (isNaN(newPrice) || newPrice <= auction.highestBid) {
                return interaction.reply({ content: `حدث خطأ يجب أن تضع رقم أعلي من أعلي سعر للمزايدة (${auction.highestBid}k).`, ephemeral: true });
            }

            auction.highestBid = newPrice;
            auction.highestBidder = interaction.user.id;
            auction.bids.push({ bidder: interaction.user.username, amount: newPrice });
            await updateAuctionEmbed(interaction.channel, auction);
            await interaction.reply({ content: `انت الأن صاحب اعلي مزايدة للآن السعر الذي وضعته : ${newPrice}k`, ephemeral: true });
        }
    }
});

async function createAuctionEmbed(item, startingBid, duration, image, interaction) {
    const server = interaction.guild;
    const serverPfp = server.iconURL({ dynamic: true });

    const auctionEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('مـزاد جـديـد')
        .setDescription('زايد علي هذه السلعة !')
        .addFields([
            { name: 'السلعه:', value: item || 'لا يوجد', inline: true },
            { name: 'السعر المبدئي:', value: `${startingBid}k`, inline: true },
            { name: 'أعلي سعر مزايدة:', value: `${startingBid}k`, inline: true },
            { name: 'صاحب أعلي سعر مزايدة:', value: 'لا يوجد مزايدات بعد', inline: true },
            { name: 'ينتهي في:', value: `<t:${Math.floor((Date.now() + duration * 60000) / 1000)}:R>`, inline: true }
        ])
        .setThumbnail(serverPfp)
        .setImage(image || "https://media.discordapp.net/attachments/1221887365182914570/1221887502382792824/20240325_212004.png");

    const placeBidButton = new ButtonBuilder()
        .setCustomId('placeBid')
        .setLabel('مزايدة')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(placeBidButton);

    return { embeds: [auctionEmbed], components: [row] };
}

async function updateAuctionEmbed(channel, auction) {
    try {
        const message = await channel.messages.fetch(auction.messageId).catch(() => null);
        if (!message) return;

        const server = channel.guild;
        const serverPfp = server.iconURL({ dynamic: true });

        const auctionEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('مـزاد جـديـد')
            .setDescription('زايد علي هذه السلعة !')
            .addFields([
                { name: 'السلعه:', value: auction.item, inline: false },
                { name: 'أعلي سعر مزايدة:', value: `${auction.highestBid}k`, inline: false },
                { name: 'صاحب أعلي سعر مزايدة:', value: auction.highestBidder ? `<@${auction.highestBidder}>` : 'لا يوجد مزايدات بعد', inline: false },
                { name: 'ينتهي في:', value: `<t:${Math.floor(auction.endTime / 1000)}:R>`, inline: false }
            ])
            .setThumbnail(serverPfp)
            .setImage(auction.image || "https://media.discordapp.net/attachments/1221887365182914570/1221887502382792824/20240325_212004.png");

        const placeBidButton = new ButtonBuilder()
            .setCustomId('placeBid')
            .setLabel('مزايدة')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(placeBidButton);

        await message.edit({ embeds: [auctionEmbed], components: [row] }).catch(() => { });
    } catch (e) {
        console.error('Error updating auction embed:', e);
    }
}

async function endAuction(auctionId) {
    const auction = auctions[auctionId];
    if (!auction) return;

    const channel = client.channels.cache.get(auctionId);
    if (!channel) return;

    try {
        const message = await channel.messages.fetch(auction.messageId).catch(() => null);
        if (!message) return;

        let bidderUser = null;
        if (auction.highestBidder) {
            bidderUser = await client.users.fetch(auction.highestBidder).catch(() => null);
        }

        const resultEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('نتيجة المزاد')
            .addFields([
                { name: 'السلعه:', value: auction.item, inline: false },
                { name: 'أعلي سعر مزايدة:', value: `${auction.highestBid}k`, inline: false },
                { name: 'صاحب أعلي سعر مزايدة:', value: auction.highestBidder ? `<@${auction.highestBidder}>` : 'لا يوجد مزايدات بعد', inline: false },
                { name: 'انتهي في:', value: `<t:${Math.floor(auction.endTime / 1000)}:f>`, inline: false }
            ])
            .setThumbnail(bidderUser ? bidderUser.displayAvatarURL({ dynamic: true }) : null)
            .setFooter({ text: 'شكرا للمشاركة!' });

        await message.edit({ embeds: [resultEmbed], components: [] }).catch(() => { });
        delete auctions[auctionId];

        if (auction.highestBidder) {
            await channel.send({ content: `مبروك <@${auction.highestBidder}> ! لقد فزت في مزاد **${auction.item}** بسعر **${auction.highestBid}k** !` }).catch(() => { });
        } else {
            await channel.send({ content: `انتهى المزاد على **${auction.item}** بدون أي مزايدات.` }).catch(() => { });
        }
    } catch (e) {
        console.error('Error ending auction:', e);
    }
}
