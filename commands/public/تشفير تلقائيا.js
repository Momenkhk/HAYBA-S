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
const { createEmbed } = require('../../function/function/Embed');

function encryptMessage(content) {
  let result = content;
  if (settings.wordReplacements) {
    for (const [word, encrypted] of Object.entries(settings.wordReplacements)) {
      const regex = new RegExp(word, 'gi');
      result = result.replace(regex, encrypted);
    }
  }
  return result;
}

client.on('messageCreate', async message => {
  if (!settings.filterEnabled) return;
  if (message.author.bot || !message.guild) return;

  const lowerContent = message.content.toLowerCase();
  const bannedWords = settings.bannedWords || [];
  const matched = bannedWords.find(word => lowerContent.includes(word));

  if (!matched) return;

  try {
    await message.delete().catch(() => { });

    const encrypted = encryptMessage(message.content);
    const member = await message.guild.members.fetch(message.author.id);

    const webhook = await message.channel.createWebhook({
      name: member.displayName,
      avatar: message.author.displayAvatarURL({ dynamic: true }),
      reason: 'Auto-created for filtered message'
    });

    await webhook.send({
      content: `${encrypted}`
    });

    setTimeout(() => webhook.delete().catch(() => { }), 3000);
  } catch (err) {
    console.error('Error handling filtered message:', err);
  }
});
