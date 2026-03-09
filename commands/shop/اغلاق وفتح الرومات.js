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
const { client, db , settings} = require('../../index');

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return
    if (interaction.commandName == 'close-open'){

     const Type = interaction.options.getString('role')
     if (!settings.Owners.includes(interaction.user.id)) return 
     await interaction.deferReply({})
                       

     
     await interaction.editReply({content : `**تم بنجاح ${Type} الرومات**`})

    }
})
