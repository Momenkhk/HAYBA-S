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
const { client, db, dbpoint, settings } = require('../../index');
const { createEmbed } = require('../../function/function/Embed');
const moment = require('moment');

client.on('messageCreate', async message => {
    if (message.content.startsWith(settings.prefix + 'فحص')) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) return;

        const dataPointsStaff = await dbpoint.get(`Points_Staff`) || [];
        const StaffRole = settings.Admins.DiscordStaff;
        const priceStaffTicket = settings.Fa7s.staff.ticket || 0;
        const priceStaffWarn = settings.Fa7s.staff.warn || 0;

        try {
            const members = await message.guild.members.fetch();
            const staffMembers = members.filter(member => member.roles.cache.has(StaffRole));

            const sortedStaff = Array.from(staffMembers.values()).sort((a, b) => {
                const userDataA = dataPointsStaff.find(data => data.userid === a.id) || { point: 0, Warn: 0 };
                const userDataB = dataPointsStaff.find(data => data.userid === b.id) || { point: 0, Warn: 0 };
                const totalPointsA = (userDataA.point || 0) + (userDataA.Warn || 0);
                const totalPointsB = (userDataB.point || 0) + (userDataB.Warn || 0);
                return totalPointsB - totalPointsA;
            });

            const embedStaff = createEmbed({
                interaction: message,
                title: `فحص الادارة`,
                description: ''
            });

            let description = '';
            sortedStaff.forEach((staffMember) => {
                const userData = dataPointsStaff.find(data => data.userid === staffMember.id) || {
                    userid: staffMember.id,
                    point: 0,
                    Warn: 0
                };

                const TotalPrice = priceStaffTicket * (userData.point || 0) + priceStaffWarn * (userData.Warn || 0);
                const totalPoints = (userData.point || 0) + (userData.Warn || 0);

                description += `**${staffMember.user}** : \n- Tickets: **${userData.point || 0}** | Warns: **${userData.Warn || 0}** | All Points: **${totalPoints}** | Credits: **${TotalPrice}**\n- #credit ${staffMember.user.id} ${TotalPrice}\nـــــــــــــــــ\n`;
            });

            embedStaff.setDescription(description || 'لا يوجد أعضاء طاقم عمل لعرضهم.');
            await message.channel.send({ embeds: [embedStaff] });
        } catch (error) {
            console.error('Error in فحص command:', error);
            await message.channel.send('حدث خطأ أثناء فحص الإدارة.');
        }
    }
});

