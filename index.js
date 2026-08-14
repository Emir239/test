// ============================================================================
// index.js — Main bot process.
//
// Flow:
//   1. User runs /order, picks a service, enters their Roblox username, and
//      attaches an inventory screenshot.
//   2. Bot creates a private channel under TICKET_CATEGORY_ID, visible only to
//      that user + STAFF_ROLE_ID, and posts an embed with the order details.
//   3. Bot replies to the user (ephemeral) with a link to their new ticket.
//   4. A "Close Ticket" button in the ticket channel lets staff (or the ticket
//      owner) archive it — it locks the channel, then deletes it after a delay.
//
// Setup: see README.md
// ============================================================================

require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const config = require("./config");

const { DISCORD_TOKEN } = process.env;
if (!DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN in .env — see .env.example");
  process.exit(1);
}

const client = new Client({
  // Only the intents we actually need — keeps the bot lightweight and avoids
  // requiring privileged intents that aren't necessary for slash commands.
  intents: [GatewayIntentBits.Guilds],
});

// Simple in-memory counter for ticket numbering (order-username-1, -2, ...).
// Resets on restart; fine for a small bot. For heavy traffic, persist this
// (e.g. a small JSON file or database) instead.
let ticketCounter = 0;

// ---------------------------------------------------------------------------
// Ready
// ---------------------------------------------------------------------------
client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

// ---------------------------------------------------------------------------
// Interaction handling
// ---------------------------------------------------------------------------
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === "order") {
      await handleOrderCommand(interaction);
    } else if (interaction.isButton() && interaction.customId === "close_ticket") {
      await handleCloseTicket(interaction);
    }
  } catch (err) {
    console.error("Error handling interaction:", err);
    const errorMsg = "Something went wrong handling that. Please try again or contact staff.";
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errorMsg }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
    }
  }
});

// ---------------------------------------------------------------------------
// /order handler — creates the private ticket channel
// ---------------------------------------------------------------------------
async function handleOrderCommand(interaction) {
  await interaction.deferReply({ ephemeral: true }); // "thinking..." shown only to the user

  const guild = interaction.guild;
  if (!guild) {
    return interaction.editReply("This command can only be used inside a server.");
  }

  const serviceValue = interaction.options.getString("service", true);
  const serviceLabel =
    config.SERVICES.find((s) => s.value === serviceValue)?.label ?? serviceValue;
  const robloxUsername = interaction.options.getString("roblox_username", true);
  const screenshot = interaction.options.getAttachment("inventory_screenshot", true);

  // Basic validation: make sure the attachment is actually an image.
  if (!screenshot.contentType || !screenshot.contentType.startsWith("image/")) {
    return interaction.editReply(
      "The inventory_screenshot attachment doesn't look like an image. Please re-run /order with a valid image file."
    );
  }

  ticketCounter += 1;
  const safeUsername = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) || "user";
  const channelName = `${config.TICKET_CHANNEL_PREFIX}-${safeUsername}-${ticketCounter}`;

  // Permission overwrites: deny @everyone, allow the ticket owner, allow staff.
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];
  if (config.STAFF_ROLE_ID && config.STAFF_ROLE_ID !== "PUT_STAFF_ROLE_ID_HERE") {
    overwrites.push({
      id: config.STAFF_ROLE_ID,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
      ],
    });
  }

  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent:
      config.TICKET_CATEGORY_ID && config.TICKET_CATEGORY_ID !== "PUT_CATEGORY_ID_HERE"
        ? config.TICKET_CATEGORY_ID
        : undefined,
    permissionOverwrites: overwrites,
    topic: `Order ticket for ${interaction.user.tag} — ${serviceLabel}`,
  });

  const orderEmbed = new EmbedBuilder()
    .setTitle("New Service Order")
    .setColor(0x5865f2)
    .addFields(
      { name: "Customer", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Roblox Username", value: robloxUsername, inline: true },
      { name: "Service", value: serviceLabel, inline: false }
    )
    .setImage(screenshot.url)
    .setTimestamp()
    .setFooter({ text: `Ticket #${ticketCounter}` });

  const closeButton = new ButtonBuilder()
    .setCustomId("close_ticket")
    .setLabel("Close Ticket")
    .setStyle(ButtonStyle.Danger);
  const row = new ActionRowBuilder().addComponents(closeButton);

  const staffPing =
    config.STAFF_ROLE_ID && config.STAFF_ROLE_ID !== "PUT_STAFF_ROLE_ID_HERE"
      ? `<@&${config.STAFF_ROLE_ID}>`
      : "";

  await ticketChannel.send({
    content: `${staffPing} New order from <@${interaction.user.id}>`.trim(),
    embeds: [orderEmbed],
    components: [row],
  });

  await interaction.editReply(`Your ticket has been created: <#${ticketChannel.id}>`);
}

// ---------------------------------------------------------------------------
// Close Ticket button handler
// ---------------------------------------------------------------------------
async function handleCloseTicket(interaction) {
  const channel = interaction.channel;

  await interaction.reply("Closing this ticket in 5 seconds...");

  // Lock the channel immediately so no more messages can be sent.
  await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
    SendMessages: false,
  });

  setTimeout(async () => {
    try {
      await channel.delete("Ticket closed");
    } catch (err) {
      console.error("Failed to delete ticket channel:", err);
    }
  }, 5000);
}

client.login(DISCORD_TOKEN);
