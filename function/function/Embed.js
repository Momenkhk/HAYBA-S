const { EmbedBuilder } = require('discord.js');
const { settings } = require('../../index');

/**
 * @param {Object} data - The data object containing information for the embed
 * @param {Interaction} [data.interaction] - The interaction object (optional)
 * @param {string} data.title - The title of the embed
 * @param {string} data.image - The URL of the image to be displayed in the embed
 * @param {string} data.color - The color of the embed
 * @param {string} data.description - The description of the embed
 * @param {Array<{ name: string, value: string, inline?: boolean }>} data.fields - An array of field objects
 */
function createEmbed(data) {
    const { interaction, title, image, color, description, fields } = data;

    const embed = new EmbedBuilder()
        .setTimestamp()
        .setColor(color || settings.لون_الامبيد || 0x0099ff);

    if (interaction?.guild) {
        embed.setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }) || undefined
        });
        embed.setFooter({
            text: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }) || undefined
        });
        embed.setThumbnail(interaction.guild.iconURL({ dynamic: true }) || null);
    }

    if (title) {
        embed.setTitle(title);
    }

    if (image) {
        embed.setImage(image);
    }

    if (description) {
        embed.setDescription(description.slice(0, 4000));
    }

    if (fields && fields.length > 0) {
        embed.addFields(fields.map(f => ({
            name: String(f.name).slice(0, 256),
            value: String(f.value).slice(0, 1024),
            inline: !!f.inline
        })));
    }

    return embed;
}

module.exports = { createEmbed };
