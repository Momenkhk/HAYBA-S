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


client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select_Buy') {
        const selectedValue = interaction.values[0];

        if (selectedValue === 'Buy_Role') {


            const but = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('CancelButton')
                    .setLabel('الغاء العملية ؟')
                    .setStyle(ButtonStyle.Danger)
            );

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('RolesBuy')
                        .setPlaceholder(`Select`)
                        .addOptions([
                            {
                                label: "الرتب العامة",
                                description: "لـ شراء الرتب العامة",
                                value: "Buy_Role",
                            },
                            {
                                label: "الرتب النادره",
                                description: "لـ شراء رتب نادره",
                                value: "Buy_Rare_Role",
                            },
                            {
                                label: "ازالة تحذير",
                                description: "لـ شراء ازالة تحذير",
                                value: "Buy_Remove_Warn",
                            },
                            {
                                label: "نقل رتب",
                                description: "لـ شراء نقل الرتب",
                                value: "Buy_Transfare",
                            },
                        ])
                );

            const description = "** برجاء اختيار نوع الرتبة المراد **"

            await interaction.update({
                embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setDescription(description)],
                components: [row, but]
            });
        }
    }
});
