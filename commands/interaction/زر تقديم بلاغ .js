const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const { client, db, settings } = require('../../index');
const config = require('../../config/settings');
const fs = require('fs');
const path = require('path');

const scamDBPath = path.join(__dirname, '../../database/scamdb.json');

client.on('interactionCreate', async (interaction) => {
    const { customId } = interaction;

    // Button interactions
    if (interaction.isButton()) {
        if (customId === 'Apply_Blag') {
            const modal = new ModalBuilder()
                .setCustomId('blagModalBuilder')
                .setTitle('تقديم بلاغ عن نصاب');

            const scammerID = new TextInputBuilder()
                .setCustomId('scammerID')
                .setLabel("ايدي النصاب")
                .setPlaceholder("حط هنا ايدي النصاب وليس يوزره")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const MansubID = new TextInputBuilder()
                .setCustomId('MansubID')
                .setLabel("ايدي المنصوب عليه")
                .setPlaceholder("حط هنا ايدي المنصوب عليه وليس يوزره")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const story = new TextInputBuilder()
                .setCustomId('story')
                .setLabel("القصة")
                .setPlaceholder("حط القصة هنا")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const amount = new TextInputBuilder()
                .setCustomId('amount')
                .setLabel("المبلغ")
                .setPlaceholder("حط المبلغ الي نصب عليك فيه")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const Item = new TextInputBuilder()
                .setCustomId('Item')
                .setLabel("السلعة")
                .setPlaceholder("حط المنتج الي نصب عليك فيه")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const rows = [scammerID, MansubID, story, amount, Item].map(component =>
                new ActionRowBuilder().addComponents(component)
            );

            modal.addComponents(rows);
            await interaction.showModal(modal);
        } else if (customId === 'رفع_البلاغ') {
            const allowedRoles = [
                config.ReportSettings.ReportButtonRoleID,
                settings.Admins.Kdaa,
                settings.Admins.DiscordLeader
            ].filter(Boolean);

            const hasRole = allowedRoles.some(roleId => interaction.member.roles.cache.has(roleId));

            if (!hasRole) {
                return interaction.reply({
                    content: `**- ليس لديك صلاحية لرفع البلاغ.**\n(تحتاج رتبة <@&${config.ReportSettings.ReportButtonRoleID || settings.Admins.Kdaa}>)`,
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('evidenceModalBuilder')
                .setTitle('رفع الدلائل');

            const proofs = ['الأول', 'الثاني', 'الثالث', 'الرابع'].map((num, i) =>
                new TextInputBuilder()
                    .setCustomId(`proof${i + 1}`)
                    .setLabel(`رابط الدليل ${num}`)
                    .setPlaceholder(`ضع هنا رابط الدليل ${num}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(i === 0)
            );

            modal.addComponents(proofs.map(p => new ActionRowBuilder().addComponents(p)));
            await interaction.showModal(modal);
        }
    }

    // ModalBuilder submissions
    if (interaction.isModalSubmit()) {
        const guildName = interaction.guild.name;
        const guildIcon = interaction.guild.iconURL({ dynamic: true });

        if (customId === 'blagModalBuilder') {
            const scammerID = interaction.fields.getTextInputValue('scammerID');
            const MansubID = interaction.fields.getTextInputValue('MansubID');
            const story = interaction.fields.getTextInputValue('story');
            const amount = interaction.fields.getTextInputValue('amount');
            const Item = interaction.fields.getTextInputValue('Item');

            // Container Style Embed for the Report
            const embed = new EmbedBuilder()
                .setColor(settings.لون_الامبيد || "Blue")
                .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
                .setThumbnail(guildIcon)
                .setDescription(`
**بلاغ جديد عن عملية نصب**

**• النصاب :** <@${scammerID}> (\`${scammerID}\`)
**• المنصوب عليه :** <@${MansubID}> (\`${MansubID}\`)
**• السلعة :** ${Item}
**• المبلغ :** ${amount}

**• القصة :**
\`\`\`${story}\`\`\`
                `)
                .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon })
                .setTimestamp();

            const button = new ButtonBuilder()
                .setCustomId('رفع_البلاغ')
                .setLabel('رفع البلاغ')
                .setStyle(ButtonStyle.Primary);

            await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] });

            await interaction.channel.send({
                content: `**الخطوة التالية: دلوقتي لازم ترسل الدلائل محتاجين منك الاتي \n\n- دليل الاتفاق علي: (${Item}) بينك وبين النصاب\n- ودليل انه نصب عليك: (يعني عملك بلوك , السلعه مش شغاله , مش بيرد عليك)\n- واخر دليل: دليل تحويل الكريديت للنصاب**`
            });
            if (settings.ServerInfo?.line) await interaction.channel.send({ files: [settings.ServerInfo.line] });

        } else if (customId === 'evidenceModalBuilder') {
            await interaction.deferReply({ ephemeral: true });

            const proof1 = interaction.fields.getTextInputValue('proof1');
            const proof2 = interaction.fields.getTextInputValue('proof2');
            const proof3 = interaction.fields.getTextInputValue('proof3');
            const proof4 = interaction.fields.getTextInputValue('proof4');

            const messageEmbed = interaction.message.embeds[0];
            if (!messageEmbed) return interaction.followUp({ content: 'تعذر العثور على البلاغ الأصلي.', ephemeral: true });

            // Robust data extraction from the new description format
            const description = messageEmbed.description;

            // Helper to extract ID from mention or text
            const extractID = (text, key) => {
                const regex = new RegExp(`\\*\\*• ${key} :\\*\\* <@(\\d+)>`);
                const match = description.match(regex);
                return match ? match[1] : null;
            };

            // Helper for text values
            const extractValue = (text, key) => {
                const regex = new RegExp(`\\*\\*• ${key} :\\*\\* (.+)`);
                const match = description.match(regex);
                return match ? match[1] : null;
            };

            const scammerID = extractID(description, 'النصاب');
            const MansubID = extractID(description, 'المنصوب عليه');
            const Item = extractValue(description, 'السلعة');
            const amount = extractValue(description, 'المبلغ');
            // Extract story is trickier with backticks, doing a simpler split
            const storyMatch = description.match(/```([\s\S]*)```/);
            const story = storyMatch ? storyMatch[1].trim() : 'لا يوجد';

            if (!scammerID || !MansubID) {
                // Fallback attempt for older embeds or manual errors, but strictly aiming for new format
                return interaction.followUp({ content: 'حدث خطأ في استرجاع البيانات. تأكد أن البلاغ يتبع التنسيق الجديد.', ephemeral: true });
            }

            const reportDetails = {
                scammerID,
                MansubID,
                story,
                amount,
                Item,
                proofs: [proof1, proof2, proof3, proof4]
            };

            // Container Style Embed for Public Log
            const embed = new EmbedBuilder()
                .setColor(settings.لون_الامبيد || "Red")
                .setAuthor({ name: `# - ${guildName}`, iconURL: guildIcon })
                .setThumbnail(guildIcon)
                .setDescription(`
**تم تشهير نصاب جديد**

**• تمت المراجعة بواسطة :** <@${interaction.user.id}>

**• النصاب :** <@${reportDetails.scammerID}>
**• المنصوب عليه :** <@${reportDetails.MansubID}>
**• السلعة :** ${reportDetails.Item}
**• المبلغ :** ${reportDetails.amount}

**• القصة :**
\`\`\`${reportDetails.story}\`\`\`

**• الدلائل :**
(روابط الصور مرفقة أدناه)
                `)
                .setFooter({ text: `# - ${guildName}`, iconURL: guildIcon })
                .setTimestamp();

            const channelId = config.ReportSettings.ChannelID;
            const logChannel = client.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(() => null);

            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
                const proofFiles = reportDetails.proofs.filter(p => p && (p.startsWith('http') || p.startsWith('https')));
                if (proofFiles.length > 0) await logChannel.send({ content: `**📷 روابط الدلائل:**\n${proofFiles.join('\n')}` }).catch(() => { });
                if (settings.ServerInfo?.line) await logChannel.send({ files: [settings.ServerInfo.line] });
            }

            // Optional scammer role
            const scammerRoleID = config.ReportSettings.ScammerRoleID;
            if (scammerRoleID) {
                const scammerMember = await interaction.guild.members.fetch(reportDetails.scammerID).catch(() => null);
                if (scammerMember) await scammerMember.roles.add(scammerRoleID).catch(() => { });
            }

            // Save to DB
            try {
                if (!fs.existsSync(path.dirname(scamDBPath))) fs.mkdirSync(path.dirname(scamDBPath), { recursive: true });
                let scamDB = [];
                if (fs.existsSync(scamDBPath)) {
                    const content = fs.readFileSync(scamDBPath, 'utf8');
                    scamDB = content ? JSON.parse(content) : [];
                }
                scamDB.push({ ...reportDetails, staff: interaction.user.id, timestamp: Date.now() });
                fs.writeFileSync(scamDBPath, JSON.stringify(scamDB, null, 2), 'utf8');
            } catch (error) {
                console.error('فشل في تحديث قاعدة بيانات النصابين:', error);
            }

            await interaction.followUp({ content: '✅ تم رفع البلاغ وتوثيقه بنجاح!', ephemeral: true });
            await interaction.message.delete().catch(() => { });
        }
    }
});
