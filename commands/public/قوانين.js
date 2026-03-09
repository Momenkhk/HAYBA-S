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
const fs = require('fs');

const dataFile = 'rulesData.json';
let infoData = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : {};

const createSelectMenu = (customId) => {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder("اختر من القائمة")
            .addOptions([
                { label: "قوانين عامة", value: "general_rules" },
                { label: "قوانين البائعين", value: "seller_rules" },
                { label: "قوانين اداره", value: "Staff_rules" }
            ])
    );
};

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === `${settings.prefix}setup-rules`) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) {
            return message.reply("- **هذا الأمر مخصص للإدارة العليا فقط!**");
        }

        const embed = new EmbedBuilder()
            .setTitle(`# ${message.guild.name}`)
            .setDescription(`**القوانين**
لرؤية قوانين السيرفر اختار قوانين السيرفر
لرؤية قوانين البائعين اختار قوانين البائعين
لرؤية قوانين الادارة اختار قونين الادارة`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setColor("Blue");

        message.channel.send({
            embeds: [embed],
            components: [createSelectMenu("rules_menu")]
        });

        if (settings.ServerInfo.line) message.channel.send({ files: [settings.ServerInfo.line] });
    }

    if (message.content === `${settings.prefix}set-rules`) {
        if (!message.member.roles.cache.has(settings.Admins.DiscordLeader)) {
            return message.reply("- **هذا الأمر مخصص للإدارة العليا فقط!**");
        }

        const embed = new EmbedBuilder()
            .setTitle("إعداد القوانين الفئات")
            .setDescription("اختر الفئة التي تريد تعديل القوانين لها أو اضغط **إعادة تعيين** لمسح الخيارات.")
            .setColor("Yellow");

        message.reply({
            embeds: [embed],
            components: [createSelectMenu("set_rules_menu")]
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId !== "rules_menu" && interaction.customId !== "set_rules_menu") return;
        const category = interaction.values[0];

        if (category === "reset") {
            if (interaction.customId === "rules_menu") {
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`# ${interaction.guild.name}`)
                            .setDescription(`**القوانين**
لرؤية قوانين السيرفر اختار قوانين السيرفر
لرؤية قوانين البائعين اختار قوانين البائعين
لرؤية قوانين الادارة اختار قونين الادارة`)
                            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                            .setColor("Blue")
                    ],
                    components: [createSelectMenu("rules_menu")]
                });
            } else if (interaction.customId === "set_rules_menu") {
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("إعداد القوانين الفئات")
                            .setDescription("اختر الفئة التي تريد تعديل القوانين لها أو اضغط **إعادة تعيين** لمسح الخيارات.")
                            .setColor("Yellow")
                    ],
                    components: [createSelectMenu("set_rules_menu")]
                });
            }
            return;
        }

        if (interaction.customId === "rules_menu") {
            const response = infoData[category] || "❌ **لم يتم تعيين رد لهذه الفئة بعد!**";
            const embed = new EmbedBuilder()
                .setTitle(" ")
                .setDescription(response)
                .setColor("Green");

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (interaction.customId === "set_rules_menu") {
            if (interaction.user.id !== interaction.guild.ownerId && !interaction.member.roles.cache.has(settings.Admins.DiscordLeader)) {
                return interaction.reply({ content: "❌ **هذا الأمر مخصص فقط لصاحب السيرفر أو الإدارة العليا!**", ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId(`set_rules_modal_${category}`)
                .setTitle("تحديث القوانين")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("info_text")
                            .setLabel("أدخل القوانين الجديدة:")
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder("اكتب القوانين هنا...")
                            .setRequired(true)
                    )
                );

            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith("set_rules_modal_")) {
            const category = interaction.customId.replace("set_rules_modal_", "");
            const newText = interaction.fields.getTextInputValue("info_text");

            infoData[category] = newText;
            fs.writeFileSync(dataFile, JSON.stringify(infoData, null, 2));

            await interaction.reply({ content: `**تم تحديث القوانين ${category} بنجاح!**`, ephemeral: true });
        }
    }
});
