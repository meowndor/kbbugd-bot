const { SlashCommandBuilder } = require("@discordjs/builders");
const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delete")
    .setDescription("Delete a term from the dictionary")
    .addStringOption((option) =>
      option
        .setName("term")
        .setDescription("The term to delete")
        .setRequired(true)
    ),
  async execute(interaction) {
    const term = interaction.options.getString("term").toLowerCase();

    // Delete the term from Redis
    const result = await redis.del(`term:${term}`);
    if (result === 0) {
      return interaction.reply({
        content: `The term "${term}" was not found.`,
        ephemeral: true,
      });
    }

    await interaction.reply(`Term "${term}" deleted successfully!`);
  },
};
