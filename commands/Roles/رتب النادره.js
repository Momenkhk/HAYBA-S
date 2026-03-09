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
const Roles = require('../../config/Roles');
const { createEmbed } = require('../../function/function/Embed');
const checkCredits = require('../../function/function/checkCredits');
const fs = require('fs');
const dataFile = 'infoData.json';

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'RolesBuy') {
        const selectedValue = interaction.values[0];

        if (selectedValue === 'Buy_Rare_Role') {
            const rolesData = Roles.Rare_Roles;
            const roleOptions = [];

            let allRolesLimitReached = true;

            // Iterate through roles to check how many people already have each role
            await Promise.all(rolesData.map(async role => {
                const guild = interaction.guild;
                const discordRole = await guild.roles.fetch(role.roleID).catch(() => null);

                if (!discordRole) return; // If the role doesn't exist, skip it

                // Get members with this role
                const membersWithRole = guild.members.cache.filter(member => member.roles.cache.has(role.roleID)).size;

                // Check if the role limit is reached
                if (membersWithRole < role.limit) {
                    allRolesLimitReached = false;
                    roleOptions.push({
                        label: discordRole ? discordRole.name : 'Unknown Role',
                        value: role.roleID,
                        description: `سعرها : ${role.price} | المتبقي: ${role.limit - membersWithRole}`,
                    });
                }
            }));

            // If all roles exceed their limits, send a message and stop
            if (allRolesLimitReached) {
                await interaction.update({
                    content: '**الرتب النادره غير متاحه حاليا!**',
                    embeds: [],
                    components: [],
                });
                return;
            }

            const cancelButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('CancelButton')
                    .setLabel('الغاء العملية ؟')
                    .setStyle(ButtonStyle.Danger)
            );

            const selectMenuRow = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('RolesBuy')
                        .setPlaceholder(`اختار الرتبة الي عاوز تشتريها من هنا ${interaction.user.displayName}`)
                        .addOptions(roleOptions),
                );

            let infoData = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : {};
            const description = infoData["rare_roles"] || "❌ **لم يتم تعيين رد لهذه الفئة بعد!**";
            
            await interaction.update({
                embeds: [interaction.message.embeds[0].setDescription(description)],
                components: [selectMenuRow, cancelButton]
            });
        }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'RolesBuy') {
        const selectedRareRoleID = interaction.values[0];
        const selectedRareRole = Roles.Rare_Roles.find(role => role.roleID === selectedRareRoleID);

        if (selectedRareRole) {
            const tax = Math.floor(selectedRareRole.price * (20 / 19) + 1);

            const RoleInfo = await interaction.guild.roles.cache.get(selectedRareRole.roleID);
            const options = {
                title: `عملية شراء رتبة ${RoleInfo.name}`,
                color: settings.لون_الامبيد,
                description: `لأكمال عملية شراء الرتبة , يرجي نسخ الكود بالاسفل واتمام عملية التحويل\n\n \`\`\`#credit ${settings.BankID} ${tax}\`\`\``
            };

            await interaction.channel.send(`#credit ${settings.BankID} ${tax}`);
            const embed = createEmbed({
                interaction: interaction,
                title: options.title,
                color: options.color,
                description: options.description
            });

            const copyCreditButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('copyCreditButtonRole')
                    .setLabel('نسخ الامر')
                    .setStyle(ButtonStyle.Secondary)
            );

            await interaction.update({
                embeds: [embed],
                components: [copyCreditButton]
            });

            const options2 = {
                price: selectedRareRole.price,
                time: 60000,
                bank: settings.BankID,
                probot: settings.Probot,
            };

            try {
                const result = await checkCredits(interaction, options2.price, options2.time, options2.bank, options2.probot);
                console.log(result);

                if (result.success) {
                    const DataTicket = await dbTickets.get(`Tickets_Support`);
                    const ExitData = DataTicket?.find(t => t.Ticket === interaction.channel.id);

                    if (ExitData) {
                        if (ExitData.Buys == null) {
                            ExitData.Buys = `تم شراء رتبة ${RoleInfo.name}`;
                        }
                        await dbTickets.set(`Tickets_Support`, DataTicket);
                    }

                    await interaction.member.roles.add(selectedRareRole.roleID);
                    await interaction.editReply({
                        embeds: [interaction.message.embeds[0].setDescription(`- عملية شراء رتبة ناجحة ✅\n- لقد اشتريت : ${RoleInfo.name}\n- بسعر : ${selectedRareRole.price}\n\n- تم اعطائك الرتبة , لازم تشيك ع القوانين قبل متعرض منتجاتك`)],
                        components: [],
                    });

                    const Log = await interaction.guild.channels.cache.get(settings.Rooms.LogRoles);
                    if (Log) {
                        const logEmbed = createEmbed(interaction, `عملية شراء رتبة ناجحة`, null, options.color, `
- تم عملية شراء رتبة بنجاح , التفاصيل : 
- الشخص : ${interaction.user}
- السعر : ${selectedRareRole.price}
- الوقت : <t:${Math.floor(Date.now() / 1000)}:R>
`);
                        await Log.send({ embeds: [logEmbed] });
                    }

                } else {
                    await interaction.editReply({
                        embeds: [interaction.message.embeds[0].setDescription(`لقد انتهى الوقت، لا تقم بالتحويل ${interaction.user}`)],
                        components: [],
                    });
                }
            } catch (error) {
                console.error(error);
                interaction.editReply('حدث خطأ ');
            }

        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'copyCreditButtonRole') {
        const creditCommand = interaction.message.embeds[0].description.match(/#credit (\d+) (\d+)/);

        if (creditCommand) {
            const bankID = creditCommand[1];
            const taxAmount = creditCommand[2];

            await interaction.reply({
                content: `#credit ${bankID} ${taxAmount}`,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: `Unable to extract credit info! Please try again.`,
                ephemeral: true
            });
        }
    }
});
