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

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId == 'CancelButton') {
        await interaction.update({ content: `**تم الغاء العملية بنجاح **`, embeds: [], components: [] });

        setTimeout(() => {
            interaction.deleteReply().catch(() => { });
        }, 2000);
    }
});
