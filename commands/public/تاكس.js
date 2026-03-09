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
  WebhookClient
} = require('discord.js');
const { client, db, settings } = require('../../index');
const { createEmbed } = require('../../function/function/Embed')

const tax = require('probot-taxs');
client.on('messageCreate', async (message) => {
  if (message.content.startsWith(settings.prefix + "tax")) {
    const args = message.content.split(' ').slice(1).join(' ');
    if (!args) return;

    let amount = parseAmount(args);
    if (!amount) return message.reply("يرجى تقديم مبلغ صالح.");

    let tax = calculateTax(amount);
    let wasitTax = calculateTax(tax);
    let brokerTaxWithoutPercentage = calculateTax(amount + wasitTax);
    let brokerTaxWithPercentage = calculateTax(brokerTaxWithoutPercentage);
    let brokerPercentage = calculateBrokerPercentage(amount);
    let transferWithoutTax = calculateTax(amount - brokerPercentage);
    let transferWithTax = calculateTax(transferWithoutTax);

    const embed = createEmbed({
      interaction: message,
      title: "حساب الضريبة",
      fields: [
        { name: "> **السعر بدون ضرائب :**", value: `**\`${amount}\`**` },
        { name: "> **السعر مع ضرائب :**", value: `**\`${tax}\`**` },
        { name: "> **ضرائب الوسيط بدون نسبة :**", value: `**\`${brokerTaxWithoutPercentage}\`**` },
        { name: "> **ضرائب الوسيط مع نسبة :**", value: `**\`${brokerTaxWithPercentage}\`**` },
        { name: "> **نسبة الوسيط :**", value: `**\`${brokerPercentage}\`**` },
        { name: "> **تحويل بدون ضرائب :**", value: `**\`${transferWithoutTax}\`**` }
      ]
    });

    await message.reply({ content: null, embeds: [embed] });
  }
});

function parseAmount(input) {
  const suffixes = { k: 1e3, m: 1e6 };
  const match = input.match(/^([\d.]+)([km]?)$/i);

  if (!match) return null;

  const number = parseFloat(match[1]);
  const suffix = match[2].toLowerCase();

  if (suffixes.hasOwnProperty(suffix)) {
    return number * suffixes[suffix];
  }

  return number;
}

function calculateTax(amount) {
  return Math.floor(amount * (20 / 19) + 1);
}

function calculateBrokerPercentage(amount) {
  return Math.floor((5 / 100) * amount);
}


client.on('messageCreate', async (message) => {
  if (message.channel && message.channel.id === settings.Rooms.Tax) {
    const amount = parseAmount(message.content);
    if (message.author.bot) return

    if (!Number(amount)) {
      try { await message.react('❌'); } catch (e) { }
      return;
    }

    const tax = calculateTax(amount);
    const wasitTax = calculateTax(tax);
    const brokerTaxWithoutPercentage = calculateTax(amount + wasitTax);
    const brokerTaxWithPercentage = calculateTax(brokerTaxWithoutPercentage);
    const brokerPercentage = calculateBrokerPercentage(amount);
    const transferWithoutTax = calculateTax(amount - brokerPercentage);
    const transferWithTax = calculateTax(transferWithoutTax);

    const embed = createEmbed({
      interaction: message,
      title: "حساب الضريبة",
      fields: [
        { name: "> **السعر بدون ضرائب :**", value: `**\`${amount}\`**` },
        { name: "> **السعر مع ضرائب :**", value: `**\`${tax}\`**` },
        { name: "> **ضرائب الوسيط بدون نسبة :**", value: `**\`${brokerTaxWithoutPercentage}\`**` },
        { name: "> **ضرائب الوسيط مع نسبة :**", value: `**\`${brokerTaxWithPercentage}\`**` },
        { name: "> **نسبة الوسيط :**", value: `**\`${brokerPercentage}\`**` },
        { name: "> **تحويل بدون ضرائب :**", value: `**\`${transferWithoutTax}\`**` }
      ]
    });

    await message.reply({ content: null, embeds: [embed] });
  }
});
