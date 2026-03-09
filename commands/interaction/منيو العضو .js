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
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId == 'select_Ticket') {
        const selectedValue = interaction.values[0];

        // Ensure we don't crash if message is not available
        try {
            if (interaction.message) {
                await interaction.message.edit({ components: interaction.message.components });
            }
        } catch (e) { }

        if (selectedValue == 'ازاي ابيع منتجات ف ريدبول؟') {
            await interaction.reply({ content: `عن طريق الضغط على كلمه الشراء وتختار الرتبة وبعد التحويل بتوصلك الرتبه تلقائيا`, ephemeral: true });
        } else if (selectedValue == 'في حد نصب عليا') {
            await interaction.reply({ content: `قم بأنشاء تذكرة ( طلب قاضي ) و هناك القاضي هيساعدك ، الدعم الفني خاص بمساعدتك فقط `, ephemeral: true });
        } else if (selectedValue == 'في حد زاود ومشتراش مني !') {
            await interaction.reply({ content: `تجيب دليل من الخاص بينكم + دليل انه فاز بالمزاد + ايدي الشخص اللي فاز و تنتظر الاداري يعطيه مهله يعوضك او يبلع بلاك ليست مزادات `, ephemeral: true });
        } else if (selectedValue == 'لي المنشور بتاعي بيتحذف ؟') {
            await interaction.reply({ content: `لأن يجب عليك تشفير الكلمات الممنوعه و عدم تكرار الكلمات و الملصقات حتى ما يحذف البوت منشورك `, ephemeral: true });
        } else if (selectedValue == 'اي سبب سحب الرتبة ؟') {
            await interaction.reply({ content: `لانك شخص مخالف لقوانين سيرفرنا ، كان يجب عليك قرائه قوانين البائعين حتي تتجنب تحذيرات الاداريين ، اما انك قمت بالوصول لتحذير 100% بعدها نقوم بسحب رتبتك `, ephemeral: true });
        } else if (selectedValue == 'لي مقدرش اكتب فالشات العام ؟') {
            await interaction.reply({ content: `لانك قمت بمخالفه شئ معين و لقمت ميوت لاسباب إداريه يمكنك انتظار إداري لمعرفه سبب الميوت ، سيتم فك الميوت بعد أنتهاء المده تلقائيا `, ephemeral: true });
        }
    }
});
