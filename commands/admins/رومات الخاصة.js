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
const fs = require('fs');
const { client, db, dbTickets, settings } = require('../../index');
const { createEmbed } = require('../../function/function/Embed');
const checkCredits = require('../../function/function/checkCredits');
const Config = require('../../config/prices');
const schedule = require('node-schedule');
const config = require('../../config/prices');
const path = require('path');
const privateSPath = path.join(__dirname, '../../data/privateS.json');


client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return

    if (!message.content.startsWith(settings.prefix)) return;
    const args = message.content.slice(settings.prefix.length).split(" ");
    const command = args.shift().toLowerCase();

    if (command === "sub") {
        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        const durationString = args.slice(1).join(" ");

        if (!user || !durationString) {
            await message.reply(`❌ **يرجى استخدام الأمر بالشكل الصحيح: \`${settings.prefix}sub @منشن 7d\`**`);
            return;
        }

        let duration = 0;
        const regex = /(\d+)([dDmMyy]|يوم|شهر|سنة)/g;
        let match;

        while ((match = regex.exec(durationString)) !== null) {
            const value = parseInt(match[1]);
            const unit = match[2].toLowerCase();

            switch (unit) {
                case 'd':
                case 'يوم':
                    duration += value * 24 * 60 * 60 * 1000;
                    break;
                case 'm':
                case 'شهر':
                    duration += value * 30 * 24 * 60 * 60 * 1000;
                    break;
                case 'y':
                case 'سنة':
                    duration += value * 365 * 24 * 60 * 60 * 1000;
                    break;
            }
        }

        if (duration <= 0) {
            await message.channel.send({ content: "❌ **يرجى تحديد مدة صالحة.**" });
            return;
        }

        const chname = user.username;
        const channelName = `✧・${chname}`;
        const creationTime = Date.now();
        const expirationTime = creationTime + duration;

        try {
            const privateSRoom = await message.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: settings.Rooms.CeatogryPrivteRooms || null,
                rateLimitPerUser: 3600,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    },
                    {
                        id: user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
                    },
                ],
            });

            const embed = new EmbedBuilder()
                .setTitle("- Private S Room")
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setColor(settings.EmbedColor || "Blue")
                .setFooter({ text: user.username, iconURL: user.displayAvatarURL({ dynamic: true, size: 1024 }) })
                .setDescription(`**Owner : ${user}
                     Ends in : <t:${Math.floor(expirationTime / 1000)}:R>
                    
                    - Created Date: <t:${Math.floor(creationTime / 1000)}:F>
                    - End Date: <t:${Math.floor(expirationTime / 1000)}:F>**`);


            const changenamebtn = new ButtonBuilder()
                .setCustomId(`change_${user.id}`) // changed from message.author.id to user.id because it's the owner's button usually
                .setLabel("Change Name")
                .setStyle(ButtonStyle.Secondary);

            const buttons = new ActionRowBuilder().addComponents(changenamebtn);

            if (privateSRoom) {
                await privateSRoom.send({ embeds: [embed], components: [buttons] });
            }

            await message.channel.send({
                content: `✅ **تم إنشاء الروم بنجاح : ${privateSRoom}
<@${user.id}>**`
            });

            let privateSData = {};

            if (fs.existsSync(privateSPath)) {
                try {
                    privateSData = JSON.parse(fs.readFileSync(privateSPath, 'utf8'));
                } catch (e) {
                    privateSData = {};
                }
            }

            privateSData[user.id] = {
                userId: user.id,
                roomId: privateSRoom.id,
                roomName: channelName,
                isOpen: true,
                createdAt: creationTime,
                expiresAt: expirationTime
            };

            fs.writeFileSync(privateSPath, JSON.stringify(privateSData, null, 4));

        } catch (error) {
            console.error("Error creating private room:", error);
            await message.channel.send({ content: "❌ **حدث خطأ أثناء إنشاء الروم الخاص.**" });
        }
    }
});

async function checkRooms() {
    if (!fs.existsSync(privateSPath)) return;

    let privateSData = {};
    try {
        privateSData = JSON.parse(fs.readFileSync(privateSPath, "utf8"));
    } catch (e) {
        return;
    }

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
