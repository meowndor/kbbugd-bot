const { SlashCommandBuilder } = require("@discordjs/builders");
const { Redis } = require("@upstash/redis");
const { EmbedBuilder } = require("discord.js");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wtfis")
    .setDescription("Retrieve a term from the dictionary")
    .addStringOption((option) =>
      option
        .setName("term")
        .setDescription("The term to retrieve")
        .setRequired(true)
    ),
  async execute(interaction) {
    const term = interaction.options.getString("term").toLowerCase();

    // Fetch the term from Redis
    const termData = await redis.hgetall(`term:${term}`);
    if (!termData) {
      return interaction.reply({
        content: `The term "${term}" was not invented yet. type \`/add\` then press enter to add it to the graet dictionary!`,
        ephemeral: true,
      });
    }

    const coinedByUser = await interaction.client.users.fetch(
      termData.coinedBy
    );
    const addedByUser = await interaction.client.users.fetch(termData.addedBy);

    const embed = new EmbedBuilder()
      .setTitle(`**${term}**`)
      .setDescription(termData.wordType)
      .setColor(
        "#" +
          Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")
      )
      .addFields(
        {
          name: "\u200b",
          value: `\`/${termData.pronunciation}/\``, // Use backticks for inline code style
          inline: false,
        },
        { name: "\u200b", value: `**${termData.definition}:**`, inline: false },
        {
          name: "\u200b",
          value: `>>> _${termData.example}_`,
          inline: false,
        },
        { name: "Coined by", value: `<@${coinedByUser.id}>`, inline: false }
        // Add Synonyms and See Also if stored
      )
      .setFooter({
        text: `Added by ${addedByUser.username}`,
        iconURL: addedByUser.displayAvatarURL({ dynamic: true }),
      });

    await interaction.reply({ embeds: [embed] });
  },
};
