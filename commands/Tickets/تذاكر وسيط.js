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

client.on('messageCreate', message => {
    if (message.content == settings.prefix + 'setup-wseet') {
        if (!settings.Owners.includes(message.author.id)) return;

        const Emmed = new EmbedBuilder()
            .setColor(settings.لون_الامبيد || 'Blue')
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setImage('https://media.discordapp.net/attachments/1207553954515255327/1207598850710183936/18.png?ex=65e03b12&is=65cdc612&hm=6e8f4bf5c803316aa65173a5e118f19496dfcf35e0e5f57bd597e1d57d9e6be0&=&format=webp&quality=lossless&width=1919&height=599')
            .setDescription(`**لطلب الوسِيط يجب ان تتعرف على الآتي ، تسبقها قراءة قوانين الوساطه .
أولاً ؛ ان طاقم الوُسطاء مُقسّم إلى عدة طواقِم مُنفصلة عن بعض وقد فُرزوا على أساس إمكانية كل طاقم بالتعامل مع الكريدتس.
ثانيًا ؛ أن تفتح تذكرة بواسطه فتح القائمة المرفقه و اختيار الوسيط الذي يُمثل عدد الكريدت او قيمته أو على انها لاتتجاوزه.*`);


        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('open_Waseet')
                    .setPlaceholder('حابب تفتح تكت ؟')
                    .addOptions([
                        {
                            label: 'طلب وسيط 1',
                            value: 'Waseet1',
                            description: 'فتح تذكرة لطلب وسيط 1',
                        },
                        {
                            label: 'طلب وسيط 2',
                            value: 'Waseet2',
                            description: 'فتح تذكرة لطلب وسيط 2',
                        },
                        {
                            label: 'طلب وسيط 3',
                            value: 'Waseet3',
                            description: 'فتح تذكرة لطلب وسيط 3',
                        },
                        {
                            label: 'طلب وسيط 4',
                            value: 'Waseet4',
                            description: 'فتح تذكرة لطلب وسيط 4',
                        },
                        {
                            label: 'طلب وسيط 5',
                            value: 'Waseet5',
                            description: 'فتح تذكرة لطلب وسيط 5',
                        },

                    ]),

            );


        message.channel.send({ embeds: [Emmed], components: [row] });
    }
});
