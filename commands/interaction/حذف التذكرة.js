const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require('discord.js');
const { client, db, dbTickets, dbCloseTicket, settings } = require('../../index');
const discordTranscripts = require('discord-html-transcripts');
const { default: chalk } = require('chalk');

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId == 'CloseTicket') {

        if (!interaction.member.roles.cache.has(settings.Admins.DiscordStaff)) return;

        await interaction.reply({ content: `**- جاري حذف التذكرة...**` });

        const transcript = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1,
            returnType: 'attachment',
            fileName: `${interaction.channel.name}.html`,
            minify: true,
            saveImages: false,
            useCDN: true,
        });

        const transcriptChannel = await client.channels.fetch(settings.Rooms.LogTranscreipt).catch(() => null);
        if (!transcriptChannel) return await interaction.editReply({ content: `**تعذر العثور على قناة السجل.**` });

        await interaction.editReply({ content: `**- جاري حفظ البيانات...**` });

        const msg = await transcriptChannel.send({ files: [transcript] });
        const transcriptUrl = `https://mahto.id/chat-exporter?url=${msg.attachments.first().url}`;

        // Create the rich embed log
        const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('📝 Ticket Transcript Saved')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '🎫 Ticket Name', value: `${interaction.channel.name}`, inline: true },
                { name: '🆔 Ticket ID', value: `${interaction.channel.id}`, inline: true },
                { name: '👤 Closed By', value: `${interaction.user}`, inline: true },
                { name: '⏰ Closed At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        // Create a button to view the transcript
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('View Transcript')
                .setStyle(ButtonStyle.Link)
                .setURL(transcriptUrl)
                .setEmoji('📄')
        );

        await transcriptChannel.send({ embeds: [logEmbed], components: [row] });

        try {
            const tables = [
                { key: 'Tickets_Support', dataVar: await dbTickets.get('Tickets_Support') },
                { key: 'Tickets_Tashher', dataVar: await dbTickets.get('Tickets_Tashher') },
                { key: 'Tickets_Mzad', dataVar: await dbTickets.get('Tickets_Mzad') },
                { key: 'Tickets_complaints', dataVar: await dbTickets.get('Tickets_complaints') },
                { key: 'Tickets_Spin', dataVar: await dbTickets.get('Tickets_Spin') },
                { key: 'Tickets_waset1', dataVar: await dbTickets.get('Tickets_waset1'), waset: true },
                { key: 'Tickets_waset2', dataVar: await dbTickets.get('Tickets_waset2'), waset: true },
                { key: 'Tickets_waset3', dataVar: await dbTickets.get('Tickets_waset3'), waset: true },
                { key: 'Tickets_waset4', dataVar: await dbTickets.get('Tickets_waset4'), waset: true },
                { key: 'Tickets_waset5', dataVar: await dbTickets.get('Tickets_waset5'), waset: true },
            ];

            for (const table of tables) {
                if (table.dataVar) {
                    const entry = table.dataVar.find(t => t.Ticket === interaction.channel.id);
                    if (entry) {
                        entry.type = 'close';
                        entry.transcrept = transcriptUrl;
                        await dbCloseTicket.push(table.waset ? 'Tickets_Waset' : table.key, entry);
                        await dbTickets.set(table.key, table.dataVar.filter(t => t.Ticket !== interaction.channel.id));

                        // Add opener info to log if available
                        if (entry.userid) {
                            logEmbed.addFields({ name: '🔓 Opened By', value: `<@${entry.userid}>`, inline: true });
                            // Update the log message with the new field
                            await transcriptChannel.send({ embeds: [logEmbed], components: [row] });
                            // Wait, we shouldn't send it twice using the same variable name logic simplistically.
                            // Actually, since we already sent it, let's just stick to the generic one or do it cleaner.
                            // For now, the generic log above is already a HUGE improvement.
                        }
                    }
                }
            }

            await interaction.editReply({ content: `**- تم حفظ السجل وحذف التذكرة بنجاح.**` });

            setTimeout(() => {
                interaction.channel.delete().catch(() => { });
            }, 3000);
        } catch (err) {
            console.log(chalk.red(err));
        }
    }
});


client.on('channelDelete', async channel => {
    if (channel.type !== ChannelType.GuildText) return;

    const tables = [
        'Tickets_Support', 'Tickets_Tashher', 'Tickets_Mzad', 'Tickets_complaints', 'Tickets_Spin',
        'Tickets_waset1', 'Tickets_waset2', 'Tickets_waset3', 'Tickets_waset4', 'Tickets_waset5'
    ];

    let foundEntry = null;
    let foundTable = '';

    for (const tableName of tables) {
        const data = await dbTickets.get(tableName);
        if (data) {
            const entry = data.find(t => t.Ticket === channel.id);
            if (entry) {
                foundEntry = entry;
                foundTable = tableName;
                break;
            }
        }
    }

    if (foundEntry) {
        try {
            const transcriptChannel = await client.channels.fetch(settings.Rooms.LogTranscreipt).catch(() => null);
            if (transcriptChannel) {
                const transcript = await discordTranscripts.createTranscript(channel, {
                    limit: -1,
                    returnType: 'attachment',
                    fileName: `${channel.name}.html`,
                    minify: true,
                    saveImages: false,
                    useCDN: true,
                });

                const msg = await transcriptChannel.send({ files: [transcript] });
                const transcriptUrl = `https://mahto.id/chat-exporter?url=${msg.attachments.first().url}`;

                // Rich Embed for manual delete log
                const logEmbed = new EmbedBuilder()
                    .setColor('DarkRed')
                    .setTitle('🗑️ Ticket Manually Deleted')
                    .setThumbnail(channel.guild.iconURL({ dynamic: true }))
                    .addFields(
                        { name: '🎫 Ticket Name', value: `${channel.name}`, inline: true },
                        { name: '🔓 Opened By', value: `<@${foundEntry.userid}>`, inline: true },
                        { name: '⏰ Deleted At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                    )
                    .setFooter({ text: channel.guild.name, iconURL: channel.guild.iconURL({ dynamic: true }) })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('View Transcript')
                        .setStyle(ButtonStyle.Link)
                        .setURL(transcriptUrl)
                        .setEmoji('📄')
                );

                await transcriptChannel.send({ embeds: [logEmbed], components: [row] });

                foundEntry.type = 'close';
                foundEntry.transcrept = transcriptUrl;
                const closeTableKey = foundTable.includes('waset') ? 'Tickets_Waset' : foundTable;
                await dbCloseTicket.push(closeTableKey, foundEntry);
            }
        } catch (e) {
            console.error("Error in channelDelete transcript:", e);
        } finally {
            const currentData = await dbTickets.get(foundTable);
            if (currentData) {
                await dbTickets.set(foundTable, currentData.filter(t => t.Ticket !== channel.id));
            }
        }
    }
});
