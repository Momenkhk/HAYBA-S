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
const { client, settings } = require('../../index');

client.on('interactionCreate', async interaction => {
    // لما يضغط الزر Byan
    if (interaction.isButton() && interaction.customId === 'Byan') {
        const modal = new ModalBuilder()
            .setCustomId('ByanModalBuilder')
            .setTitle('بيانات الوساطة')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('buyer')
                        .setLabel('المشتري (ID فقط)')
                        .setPlaceholder('مثال: 123456789012345678')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('seller')
                        .setLabel('البايع (ID فقط)')
                        .setPlaceholder('مثال: 876543210987654321')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('item')
                        .setLabel('السلعة')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('price')
                        .setLabel('الثمن')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    // لما يرسل البيانات
    if (interaction.isModalSubmit() && interaction.customId === 'ByanModalBuilder') {
        await interaction.deferReply({ ephemeral: false });

        const buyerId = interaction.fields.getTextInputValue('buyer');
        const sellerId = interaction.fields.getTextInputValue('seller');
        const item = interaction.fields.getTextInputValue('item');
        const price = interaction.fields.getTextInputValue('price');

        const detailsMessage = `**
- المشتري: <@${buyerId}> \`(${buyerId})\`
- البايع: <@${sellerId}> \`(${sellerId})\`
- السلعة: ${item}
- الثمن: ${price}
**`;

        const notesMessage = `**ملاحظات مهمه:
- يرجي انتظار الوسيط بدون ازعاج
- يرجي عدم تحويل الي اي حساب الا فقط الي حساب الوسيط
- يرجي قراءه القوانين قبل بدأ عملية الوساطه
- تحويل المبلغ الي الوسيط يشمل ضريبة الوسيط
- لم نتحمل مسؤوليه تحويل الي حساب اخر غير الوسيط
**`;

        const chlog = interaction.channel;

        await chlog.send({ content: detailsMessage });
        await chlog.send({ content: notesMessage });
        if (settings.ServerInfo.line) await chlog.send({ files: [settings.ServerInfo.line] });

        try {
            const message = await interaction.message.fetch();
            const components = message.components.map(row => {
                return new ActionRowBuilder().addComponents(
                    row.components.map(component => {
                        const newComponent = ButtonBuilder.from(component);
                        if (component.customId === 'Byan') {
                            newComponent.setDisabled(true);
                        }
                        return newComponent;
                    })
                );
            });

            await message.edit({ components });
        } catch (e) {
            console.error("Error updating message components:", e);
        }

        await interaction.editReply({ content: '✅ تم إرسال البيانات .' });
    }
});
