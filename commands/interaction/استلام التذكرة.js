const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const { client, db, dbpoint, dbTickets, settings } = require('../../index');

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'ClaimTicket' || interaction.customId === 'ClaimTicket_Tashher' || interaction.customId === 'ClaimTicket_Mzad') {

        let staffRole = settings.Admins.DiscordStaff;
        let pointsKey = 'Points_Staff';

        if (interaction.customId === 'ClaimTicket_Tashher') {
            staffRole = settings.Admins.Kdaa;
            pointsKey = 'Points_Kdaa';
        }

        if (!interaction.member.roles.cache.has(staffRole)) {
            return await interaction.reply({ content: `**❌ ليس لديك صلاحية لاستلام هذه التذكرة. (تحتاج رتبة <@&${staffRole}>)**`, ephemeral: true });
        }

        // Search through all ticket tables to find this channel
        const tables = ['Tickets_Support', 'Tickets_Tashher', 'Tickets_Mzad', 'Tickets_complaints', 'Tickets_Spin', 'Tickets_waset1', 'Tickets_waset2', 'Tickets_waset3', 'Tickets_waset4', 'Tickets_waset5'];
        let ticketData = null;
        let foundTable = '';

        for (const table of tables) {
            const data = await dbTickets.get(table);
            if (data) {
                const entry = data.find(t => t.Ticket === interaction.channel.id);
                if (entry) {
                    ticketData = entry;
                    foundTable = table;
                    break;
                }
            }
        }

        if (!ticketData) {
            return await interaction.reply({ content: `**❌ لم يتم العثور علي بيانات هذه التذكرة في قاعدة البيانات.**`, ephemeral: true });
        }

        if (ticketData.claim !== null) {
            // Already claimed
            return await interaction.reply({ content: `**تم استلام هذه التذكرة بالفعل من قبل <@${ticketData.claim}>**`, ephemeral: true });
        }

        await interaction.deferUpdate(); // Acknowledge the click immediately

        // 1. Update the original buttons to V2 Disabled State
        const rows = interaction.message.components.map(row => {
            const newRow = new ActionRowBuilder().addComponents(
                row.components.map(button => {
                    const newButton = ButtonBuilder.from(button);
                    // Specifically target the Claim button (regardless of exact ID match, we want to disable the 'claim' action)
                    // Or we just update the specific one clicked.
                    if (button.customId === interaction.customId) {
                        newButton.setLabel(`${interaction.user.username} مستلمة من قبل`)
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Secondary); // Keep it grey/secondary
                    }
                    return newButton;
                })
            );
            return newRow;
        });
        await interaction.message.edit({ components: rows });

        // 2. Send the SUCCESS Container (Embed v2)
        const guildName = interaction.guild.name;
        const guildIcon = interaction.guild.iconURL({ dynamic: true });

        const successEmbed = new EmbedBuilder()
            .setColor(settings.لون_الامبيد || '#2B2D31')
            .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
            .setDescription(`
**تم استلام التذكرة بنجاح**

**تم استلام تذكرة <#${interaction.channel.id}> من قبل ${interaction.user}**
            `)
            .setThumbnail(guildIcon)
            .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon })
            .setTimestamp();

        // Save to database
        ticketData.claim = interaction.user.id;
        const allDataInTable = await dbTickets.get(foundTable);
        const index = allDataInTable.findIndex(t => t.Ticket === interaction.channel.id);
        if (index !== -1) {
            allDataInTable[index] = ticketData;
            await dbTickets.set(foundTable, allDataInTable);
        }

        // Add points
        const pointsData = await dbpoint.get(pointsKey) || [];
        const userPoints = pointsData.find(p => p.userid === interaction.user.id);

        if (userPoints) {
            userPoints.point += 1;
            await dbpoint.set(pointsKey, pointsData);
        } else {
            await dbpoint.push(pointsKey, {
                userid: interaction.user.id,
                point: 1
            });
        }

        try {
            await interaction.channel.setName(`claimed-${interaction.user.username}`);
        } catch (e) {
            console.error("Failed to rename channel:", e);
        }

        await interaction.channel.send({ embeds: [successEmbed] });
    }
});
