// ============================================================================
// config.js — All the bot-specific settings live here.
// Edit these values for your own server. IDs come from Discord "Developer Mode"
// (User Settings > Advanced > Developer Mode), then right-click a
// role/channel/category/server and choose "Copy ID".
// ============================================================================

module.exports = {
  // --- IDs (fill these in) ---
  GUILD_ID: "1536852592746037258",          // the server this bot operates in
  TICKET_CATEGORY_ID: "1537680897778778132",   // category new ticket channels are created under
  STAFF_ROLE_ID: "1537681373685489704",      // role that can see + gets pinged on new tickets

  // --- Dropdown options for the "service" field in /order ---
  // label = shown to the user, value = short internal id (must be unique, max 100 chars)
  SERVICES: [
    { label: "V4 Trials", value: "v4_trials" },
    { label: "V4 Maxing", value: "v4_maxing" },
    { label: "Draco V4 Help", value: "draco_v4_help" },
    { label: "Find FM and People", value: "find_fm_people" },
    { label: "Legendary Swords / TTK", value: "legendary_swords_ttk" },
    { label: "Kitsune Island Finding", value: "kitsune_island" },
    { label: "Sea Events", value: "sea_events" },
    { label: "Mirage Island Finding", value: "mirage_island" },
    { label: "Levi Hunt", value: "levi_hunt" },
    { label: "Prehistoric Island", value: "prehistoric_island" },
  ],

  // --- Misc ---
  TICKET_CHANNEL_PREFIX: "order", // ticket channels are named order-<username>-<number>
};
