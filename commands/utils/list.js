const { SlashCommandBuilder } = require("@discordjs/builders");
const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("List terms in the dictionary")
    .addStringOption((option) =>
      option.setName("tags").setDescription("Filter by tags").setRequired(false)
    ),
  async execute(interaction) {
    const tagsFilter =
      interaction.options
        .getString("tags")
        ?.split(",")
        .map((tag) => tag.trim()) || [];

    // Scan all keys matching 'term:*'
    const keys = await redis.keys("term:*");
    const terms = [];

    for (const key of keys) {
      const termData = await redis.hgetall(key);
      if (tagsFilter.length > 0) {
        const termTags = JSON.parse(termData.tags);
        if (tagsFilter.every((tag) => termTags.includes(tag))) {
          terms.push(key.replace("term:", ""));
        }
      } else {
        terms.push(key.replace("term:", ""));
      }
    }

    if (terms.length === 0) {
      return interaction.reply("No terms found.");
    }

    await interaction.reply(`Terms:\n- ${terms.join("\n- ")}`);
  },
};
