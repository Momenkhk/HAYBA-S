const {
  Collection, Client, GuildMember, ActionRowBuilder, WebhookClient,
  MessagePayload, GatewayIntentBits, StringSelectMenuBuilder, ModalBuilder,
  EmbedBuilder, ButtonBuilder, AttachmentBuilder, PermissionFlagsBits,
  TextInputBuilder, ChannelType, ButtonStyle, TextInputStyle, MessageFlags
} = require('discord.js');
const { client, db, settings } = require('../../index');
const Discord = require(`discord.js`);

// --- Message Delete Log ---
client.on("messageDelete", async (message) => {
  if (message.partial) try { await message.fetch(); } catch (e) { return; }
  let channelName = "log-messages";
  if (!message.guild || message.channel.type === ChannelType.DM) return;
  if (!message.guild.members.me.permissions.has(PermissionFlagsBits.EmbedLinks)) return;
  if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) return;
  if (!message.author) return;

  var logChannel = message.guild.channels.cache.find((c) => c.name === channelName);
  if (!logChannel) return;

  let messageDelete = new EmbedBuilder()
    .setColor("#0e4a48")
    .setAuthor({ name: message.author.username, iconURL: message.author.avatarURL({ dynamic: true }) })
    .setDescription(`**Message Delete**\n\n**By : <@${message.author.id}>**\n**In : ${message.channel}**\n\`\`\`Message : ${message.content || "No Message Content"}\`\`\``)
    .setThumbnail("https://cdn.discordapp.com/attachments/1093303174774927511/1138876390612144148/D301A2E9-13FD-48E5-93B9-CF7A2FAE42B8.png")
    .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

  logChannel.send({ embeds: [messageDelete] });
});

// --- Image/Media Delete Log ---
client.on("messageDelete", async (message) => {
  let channelName = "log-pic";
  if (!message.guild || message.author?.bot) return;
  if (message.channel.type === ChannelType.DM) return;
  if (!message.guild.members.me.permissions.has(PermissionFlagsBits.EmbedLinks)) return;

  var logChannel = message.guild.channels.cache.find((c) => c.name === channelName);
  if (!logChannel) return;

  if (message.attachments.size > 0) {
    for (const attachment of message.attachments.values()) {
      if (attachment.contentType?.startsWith("image/") || attachment.contentType?.startsWith("video/")) {
        logChannel.send({ files: [attachment.url] });

        setTimeout(() => {
          let messageDelete = new EmbedBuilder()
            .setColor("#0e4a48")
            .setAuthor({ name: message.author.username, iconURL: message.author.avatarURL({ dynamic: true }) })
            .setDescription(`**Delete image**\n\n**Sent By:** <@${message.author.id}>\n**In:** ${message.channel}\n\`\`\`Message : No Text\`\`\` `)
            .setThumbnail("https://cdn.discordapp.com/attachments/1093303174774927511/1138876390612144148/D301A2E9-13FD-48E5-93B9-CF7A2FAE42B8.png")
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

          logChannel.send({ embeds: [messageDelete] });
        }, 4000);
      }
    }
  }
});

// --- Message Edit Log ---
client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (oldMessage.partial) try { await oldMessage.fetch(); } catch (e) { return; }
  if (newMessage.partial) try { await newMessage.fetch(); } catch (e) { return; }

  let channel = "log-messages";
  if (!oldMessage.author || oldMessage.author.bot) return;
  if (oldMessage.content === newMessage.content) return;
  if (!oldMessage.guild || oldMessage.channel.type === ChannelType.DM) return;
  if (!oldMessage.guild.members.me.permissions.has(PermissionFlagsBits.EmbedLinks)) return;

  var logChannel = oldMessage.guild.channels.cache.find((c) => c.name === channel);
  if (!logChannel) return;

  let messageUpdate = new EmbedBuilder()
    .setAuthor({ name: oldMessage.author.username, iconURL: oldMessage.author.avatarURL({ dynamic: true }) })
    .setThumbnail("https://cdn.discordapp.com/attachments/1093303174774927511/1138875547066314772/0DB13224-1283-4BF9-B8F5-93975DE3F7C2.png")
    .setColor("#0e4a48")
    .setDescription(`**Edit Message**\n\n**By : ** <@${oldMessage.author.id}>\n**In ${oldMessage.channel}**\n**Message : [Click Here](${oldMessage.url})**\n**Old Message :**\n\`\`\`${oldMessage.content || "None"}\`\`\`\n**New Message:**\`\`\`${newMessage.content || "None"}\`\`\` `)
    .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

  logChannel.send({ embeds: [messageUpdate] });
});

// --- Channel Create Log ---
client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;
  if (!channel.guild.members.me.permissions.has(PermissionFlagsBits.EmbedLinks)) return;
  if (!channel.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

  let channelName = "log-channels";
  var logChannel = channel.guild.channels.cache.find(c => c.name === channelName);
  if (!logChannel) return;

  let roomType = 'Unknown';
  if (channel.type === ChannelType.GuildText) roomType = 'Text';
  else if (channel.type === ChannelType.GuildVoice) roomType = 'Voice';
  else if (channel.type === ChannelType.GuildCategory) roomType = 'Category';

  const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.ChannelCreate });
  const entry = logs.entries.first();
  const user = entry ? entry.executor : { username: "Unknown", id: "0" };

  let channelCreate = new EmbedBuilder()
    .setAuthor({ name: user.username, iconURL: user.avatarURL?.({ dynamic: true }) })
    .setThumbnail('https://cdn.discordapp.com/attachments/1093303174774927511/1138891156818772018/8C926555-671C-4F9C-9136-DAD2229375B4.png')
    .setDescription(`**Channel Create**\n\n**By : <@${user.id}>**\n**Channel : <#${channel.id}>**\n**Type : ${roomType}**\n\`\`\`✅ - ${channel.id}\`\`\``)
    .setColor(`#6d5873`)
    .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

  logChannel.send({ embeds: [channelCreate] });
});

// --- Channel Delete Log ---
client.on('channelDelete', async (channel) => {
  if (!channel.guild) return;
  if (!channel.guild.members.me.permissions.has(PermissionFlagsBits.EmbedLinks)) return;
  if (!channel.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

  let chLogName = "log-channels";
  var logChannel = channel.guild.channels.cache.find(c => c.name === chLogName);
  if (!logChannel) return;

  let roomType = 'Unknown';
  if (channel.type === ChannelType.GuildText) roomType = 'Text';
  else if (channel.type === ChannelType.GuildVoice) roomType = 'Voice';
  else if (channel.type === ChannelType.GuildCategory) roomType = 'Category';

  const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.ChannelDelete });
  const entry = logs.entries.first();
  const user = entry ? entry.executor : { username: "Unknown", id: "0" };

  let channelDelete = new EmbedBuilder()
    .setAuthor({ name: user.username, iconURL: user.avatarURL?.({ dynamic: true }) })
    .setDescription(`**Channel Delete**\n\n**By : <@${user.id}>**\n**Channel : ${channel.name}**\n**Type : ${roomType}**\n\`\`\`❌ - ${channel.id}\`\`\``)
    .setColor(`#6d5873`)
    .setTimestamp()
    .setThumbnail(`https://cdn.discordapp.com/attachments/1093303174774927511/1138891157523402772/40A15AD6-0C21-43A5-A70A-6ED69615C182.png`)
    .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

  logChannel.send({ embeds: [channelDelete] });
});

// --- Channel Update Log ---
client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (!oldChannel.guild) return;
  let chLogName = "log-channels";
  var logChannel = oldChannel.guild.channels.cache.find(c => c.name === chLogName);
  if (!logChannel) return;

  if (oldChannel.name !== newChannel.name) {
    const logs = await oldChannel.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.ChannelUpdate });
    const entry = logs.entries.first();
    const user = entry ? entry.executor : { username: "Unknown", id: "0" };

    let newName = new EmbedBuilder()
      .setAuthor({ name: user.username, iconURL: user.avatarURL?.({ dynamic: true }) })
      .setThumbnail('https://cdn.discordapp.com/attachments/1093303174774927511/1138891156818772018/8C926555-671C-4F9C-9136-DAD2229375B4.png')
      .setColor(`#6d5873`)
      .setDescription(`**CHANNEL EDIT**\n\n**By : <@${user.id}>**\n**Id : ${user.id}**\n**Channel : <#${oldChannel.id}>**\n\`\`\`✅ - ${oldChannel.name} => ${newChannel.name}\`\`\``)
      .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    logChannel.send({ embeds: [newName] });
  }
});

// --- Member Nickname Update Log ---
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  let channelName = "log-nickname";
  var logChannel = oldMember.guild.channels.cache.find(c => c.name === channelName);
  if (!logChannel) return;

  if (oldMember.nickname !== newMember.nickname) {
    const logs = await oldMember.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.MemberUpdate });
    const entry = logs.entries.first();
    const executor = entry ? entry.executor : { id: "Unknown" };

    let oldNM = oldMember.nickname || 'Original Name';
    let newNM = newMember.nickname || 'Original Name';

    let updateNickname = new EmbedBuilder()
      .setAuthor({ name: oldMember.guild.name, iconURL: oldMember.guild.iconURL({ dynamic: true }) })
      .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1153870210470781008/BF6ECA69-026C-4335-9FC6-DF96E467BE9D.png')
      .setColor(`#c037d1`)
      .setDescription(`**Change Nickname**\n\n**User : ${oldMember}**\n**By:** <@${executor.id}>\n\`\`\`${oldNM} => ${newNM}\`\`\` `)
      .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    logChannel.send({ embeds: [updateNickname] });
  }
});

// --- Invite Tracker & Join Log ---
var { inviteTracker } = require("discord-inviter"), tracker = new inviteTracker(client);
tracker.on("guildMemberAdd", async (member, inviterData) => {
  let channel1Name = "log-join-leave";
  let logChannel = member.guild.channels.cache.find((c) => c.name === channel1Name);
  if (!logChannel || member.user.bot) return;

  let inviterUser = inviterData ? `<@${inviterData.id}>` : "Unknown/Vanity";
  let inviteCode = inviterData?.code || "Unknown";

  let joinEmbed = new EmbedBuilder()
    .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
    .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1153822727531147284/D8B5B65D-9A17-4CEF-A04E-7DA3B13985DD.png')
    .setColor('#292450')
    .setDescription(`**User join**\n\n**User: <@${member.id}>**\n**By: ${inviterUser}**\n**Joined at: **<t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n**Url:** \`${inviteCode}\`\n**Members: ${member.guild.memberCount}**`)
    .setFooter({ text: inviterData ? inviterData.tag : 'System', iconURL: client.user.displayAvatarURL() });

  logChannel.send({ embeds: [joinEmbed] });
});

// --- Member Leave Log ---
client.on('guildMemberRemove', async (member) => {
  let channelName = "log-join-leave";
  var logChannel = member.guild.channels.cache.find(c => c.name === channelName);
  if (!logChannel) return;

  let leaveMember = new EmbedBuilder()
    .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
    .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1153822715388637194/AFB742D0-5B6A-4C25-BF91-FBA284280087.png')
    .setColor(`#292450`)
    .setDescription(`**User Leave**\n\n**User : <@${member.user.id}>**\n**Account Created : <t:${Math.floor(member.user.createdAt / 1000)}:R>**\n**User ID : ${member.user.id}**`)
    .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

  logChannel.send({ embeds: [leaveMember] });
});

// --- Invite Create Log ---
client.on("inviteCreate", async (invite) => {
  let channelName = "log-links";
  var logChannel = invite.guild.channels.cache.find(c => c.name === channelName);
  if (!logChannel) return;

  const logs = await invite.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.InviteCreate });
  const entry = logs.entries.first();
  const executor = entry ? entry.executor : { tag: "Unknown", id: "0" };

  let embed = new EmbedBuilder()
    .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL?.({ dynamic: true }) })
    .setDescription(`**Invite Created**\n\n**By : <@${executor.id}>**\n**Channel : ${invite.channel}**\n**Code : \`${invite.code}\`**\n**Max Uses : \`${invite.maxUses || 'Unlimited'}\`**\n**Expires :** \`${invite.expiresAt ? invite.expiresAt.toLocaleString() : 'Never'}\`\n\`\`\`${invite.url}\`\`\``)
    .setColor(`#286554`)
    .setTimestamp()
    .setFooter({ text: invite.guild.name, iconURL: invite.guild.iconURL() })
    .setThumbnail(`https://cdn.discordapp.com/attachments/1093303174774927511/1138893392919658627/13AA3EF6-F41C-40BA-890B-5D4CFBFC8F81.png`);

  logChannel.send({ embeds: [embed] });
});

// --- Bot Invite Log & Anti-Bot Feature ---
client.on("guildMemberAdd", async (member) => {
  if (!member.user.bot) return;

  let channelName = "log-bots";
  var logChannel = member.guild.channels.cache.find(c => c.name === channelName);
  if (!logChannel) return;

  const logs = await member.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.BotAdd });
  const entry = logs.entries.first();
  const executor = entry ? entry.executor : "Unknown";

  let embed = new EmbedBuilder()
    .setDescription(`**Bot Added**\n\n**By : ${executor}**\n**Bot : ${member}**\n**Age : <t:${Math.floor(member.user.createdAt / 1000)}:R>**\n**ID : ${member.id}**`)
    .setColor(`#6e2f51`)
    .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
    .setThumbnail(`https://cdn.discordapp.com/attachments/1147204910337757225/1154648106122616892/C1957198-3BD3-4294-B533-2EDC8E271BBA.png`);

  let kickButton = new ButtonBuilder()
    .setCustomId('kickButton')
    .setLabel('Kick Bot')
    .setStyle(ButtonStyle.Danger);

  let row = new ActionRowBuilder().addComponents(kickButton);
  const msg = await logChannel.send({ content: 'New Bot Detected:', embeds: [embed], components: [row] });

  const filter = (i) => i.customId === 'kickButton' && i.guild.ownerId === i.user.id;
  const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

  collector.on('collect', async (interaction) => {
    await member.kick('Kicked via logs by Owner');
    await interaction.reply({ content: 'Bot kicked successfully!', flags: MessageFlags.Ephemeral });
  });

  collector.on('end', () => { msg.edit({ components: [] }).catch(() => { }); });
});

// --- Role Update Log ---
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  let channelName = "log-roles";
  var logChannel = oldMember.guild.channels.cache.find(c => c.name === channelName);
  if (!logChannel) return;

  const logs = await oldMember.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.MemberRoleUpdate });
  const entry = logs.entries.first();
  const executor = entry ? entry.executor : { tag: "System" };

  const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
  const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));

  if (removedRoles.size > 0) {
    let embed = new EmbedBuilder()
      .setAuthor({ name: executor.tag, iconURL: executor.avatarURL?.() })
      .setDescription(`**Roles Removed**\n\n**From : ${newMember}**\n**By : <@${executor.id}>**\n\`\`\`❌ - ${removedRoles.map(r => r.name).join(', ')}\`\`\``)
      .setColor(`#493d5d`)
      .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1164975437320044564/F2090C33-D3A6-4816-BDBA-2AC2E4FDDA92.png')
      .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
    logChannel.send({ embeds: [embed] });
  }

  if (addedRoles.size > 0) {
    let embed = new EmbedBuilder()
      .setAuthor({ name: executor.tag, iconURL: executor.avatarURL?.() })
      .setDescription(`**Roles Added**\n\n**To : ${newMember}**\n**By : <@${executor.id}>**\n\`\`\`✅ - ${addedRoles.map(r => r.name).join(', ')}\`\`\``)
      .setColor(`#493d5d`)
      .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1164975437320044564/F2090C33-D3A6-4816-BDBA-2AC2E4FDDA92.png')
      .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
    logChannel.send({ embeds: [embed] });
  }
});

// --- Role Create Log ---
client.on('roleCreate', async (role) => {
  let channelName = "log-roles";
  if (!role.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

  var logChannel = role.guild.channels.cache.find((c) => c.name === channelName);
  if (!logChannel) return;

  const logs = await role.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.RoleCreate });
  const entry = logs.entries.first();
  const user = entry ? entry.executor : { tag: "Unknown", id: "0" };

  let embed = new EmbedBuilder()
    .setAuthor({ name: user.tag, iconURL: user.avatarURL?.() })
    .setDescription(`**Create Role**\n\n**By : <@${user.id}>**\n**Role : ${role.name}**`)
    .setColor(`#857f99`)
    .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

  logChannel.send({ embeds: [embed] });
});

// --- Voice State Update (Join/Leave/Move) ---
client.on('voiceStateUpdate', async (oldState, newState) => {
  if (oldState.member.user.bot) return;

  // Join/Leave
  let logJoinLeave = newState.guild.channels.cache.find(c => c.name === "log-vjoin-vexit");
  if (logJoinLeave) {
    let entryTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    if (!oldState.channelId && newState.channelId) {
      let embed = new EmbedBuilder()
        .setAuthor({ name: newState.member.user.username, iconURL: newState.member.user.displayAvatarURL() })
        .setDescription(`**Join Voice**\n\n**Channel : <#${newState.channel.id}>**\n**User : <@${newState.member.id}>**\n**Time : ${entryTime}**`)
        .setColor(`#183955`)
        .setThumbnail(`https://cdn.discordapp.com/attachments/1093303174774927511/1138889079963009137/8B73770E-31D7-489A-8BF6-152D91D6D76A.png`);
      logJoinLeave.send({ embeds: [embed] });
    } else if (oldState.channelId && !newState.channelId) {
      let embed = new EmbedBuilder()
        .setAuthor({ name: oldState.member.user.username, iconURL: oldState.member.user.displayAvatarURL() })
        .setDescription(`**Leave Voice**\n\n**Channel : <#${oldState.channel.id}>**\n**User : <@${oldState.member.id}>**\n**Time : ${entryTime}**`)
        .setColor(`#183955`)
        .setThumbnail(`https://cdn.discordapp.com/attachments/1093303174774927511/1138889077123465416/IMG_2593.png`);
      logJoinLeave.send({ embeds: [embed] });
    }
  }

  // Move
  let logMove = newState.guild.channels.cache.find(c => c.name === "log-move");
  if (logMove && oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    let embed = new EmbedBuilder()
      .setAuthor({ name: newState.member.user.username, iconURL: newState.member.user.displayAvatarURL() })
      .setDescription(`**Voice Moved**\n\n**User : <@${newState.member.id}>**\n**From : <#${oldState.channelId}>**\n**To : <#${newState.channelId}>**\n\`\`\`${oldState.channel.name} => ${newState.channel.name}\`\`\` `)
      .setColor(`#4e9ca5`)
      .setThumbnail(`https://cdn.discordapp.com/attachments/1093303174774927511/1138889767468146738/E242A7A8-FDB5-4F44-86F4-AE2161BFA543.png`);
    logMove.send({ embeds: [embed] });
  }
});

// --- Ban Log ---
client.on('guildBanAdd', async (ban) => {
  let logChannel = ban.guild.channels.cache.find(c => c.name === "log-ban-unban");
  if (!logChannel) return;

  if (!ban.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

  let entry;
  try {
    const logs = await ban.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.MemberBanAdd });
    entry = logs.entries.first();
  } catch (e) {
    console.error("Audit log fetch error (Ban):", e.message);
  }

  const executor = entry ? entry.executor : "Unknown";
  const reason = entry ? entry.reason : "No reason provided";

  let embed = new EmbedBuilder()
    .setAuthor({ name: ban.user.username, iconURL: ban.user.displayAvatarURL() })
    .setDescription(`**Ban Member**\n\n**Target : <@${ban.user.id}>**\n**By : ${executor}**\n\`\`\`Reason : ${reason}\`\`\``)
    .setColor(`#880013`)
    .setThumbnail('https://cdn.discordapp.com/attachments/1093303174774927511/1138892172574326874/82073587-11BA-4E4B-AC8F-8857CD89282F.png');
  logChannel.send({ embeds: [embed] });
});

// --- Kick Log ---
client.on('guildMemberRemove', async (member) => {
  if (!member.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

  let entry;
  try {
    const logs = await member.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.MemberKick });
    entry = logs.entries.first();
  } catch (e) {
    // Silently ignore if guild is unknown or missing permissions
    if (e.code !== 10004 && e.code !== 50013) console.error("Audit log fetch error (Kick):", e.message);
    return;
  }

  if (entry && entry.target.id === member.id && (Date.now() - entry.createdTimestamp) < 5000) {
    let logChannel = member.guild.channels.cache.find(c => c.name === "log-kick");
    if (!logChannel) return;

    let embed = new EmbedBuilder()
      .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
      .setDescription(`**Kick Member**\n\n**Target : <@${member.id}>**\n**By : ${entry.executor}**\n\`\`\`Reason : ${entry.reason || 'None'}\`\`\``)
      .setColor(`#101a3a`)
      .setThumbnail(`https://cdn.discordapp.com/attachments/1093303174774927511/1138886169384472627/F4570260-9C71-432E-87CC-59C7B4B13FD4.png`);
    logChannel.send({ embeds: [embed] });
  }
});
