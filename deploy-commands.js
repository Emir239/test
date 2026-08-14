// ============================================================================
// deploy-commands.js
// Registers the /order slash command with your Discord server (guild commands
// show up instantly, unlike global commands which can take up to an hour).
//
// Run this once after setup, and again any time you change config.js SERVICES
// or the command's options:
//
//   npm run deploy
// ============================================================================

require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const config = require("./config");

const { MTUzNzY3NDM3MjQ0NDMyNzkzNg.GkfOcl.AWFyzn_kzKHNsAHzQdu7W18oJYVenUEnpZLgOU, 1537674372444327936 } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or CLIENT_ID in .env — see .env.example");
  process.exit(1);
}

// Build the /order command definition.
const orderCommand = new SlashCommandBuilder()
  .setName("order")
  .setDescription("Open a private ticket to order a service")
  .addStringOption((option) => {
    option
      .setName("service")
      .setDescription("Choose the service you want")
      .setRequired(true);
    // Discord allows max 25 choices per option — config.js should stay within that.
    config.SERVICES.forEach((s) => option.addChoices({ name: s.label, value: s.value }));
    return option;
  })
  .addStringOption((option) =>
    option
      .setName("roblox_username")
      .setDescription("Your exact Roblox username")
      .setRequired(true)
      .setMaxLength(50)
  )
  .addAttachmentOption((option) =>
    option
      .setName("inventory_screenshot")
      .setDescription("Screenshot of your inventory")
      .setRequired(true)
  );

const commands = [orderCommand.toJSON()];

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} command(s)...`);

    if (config.GUILD_ID && config.GUILD_ID !== "1536852592746037258") {
      // Guild-scoped: instant availability, recommended for single-server bots.
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, config.GUILD_ID), {
        body: commands,
      });
      console.log("Successfully registered guild commands.");
    } else {
      // Fallback: global registration (can take up to ~1 hour to propagate).
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log("GUILD_ID not set in config.js — registered as GLOBAL commands instead.");
    }
  } catch (error) {
    console.error("Failed to register commands:", error);
  }
})();
