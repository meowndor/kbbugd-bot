// commands/utils/edit.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("edit")
    .setDescription("Edit an existing term")
    .addStringOption((option) =>
      option
        .setName("term")
        .setDescription("The term to edit")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const term = interaction.options.getString("term").toLowerCase();

    // Fetch current data
    const termData = await redis.hgetall(`term:${term}`);
    if (!termData || Object.keys(termData).length === 0) {
      return interaction.reply({
        content: `The term "${term}" was not invented yet.`,
        ephemeral: true,
      });
    }

    // check termdata.example length, if it exceeds 100 chars, truncate it
    if (termData.example && termData.example.length > 100) {
      termData.example = termData.example.substring(0, 96) + "...";
    }
    const coinedByUser = await interaction.client.users.fetch(
      termData.coinedBy
    );
    const coinedByTag = coinedByUser.tag;
    // Store term data in memory
    if (!client.userData) client.userData = new Map();
    client.userData.set(`${interaction.user.id}:${term}`, termData);

    // Show modal with placeholders
    const {
      ModalBuilder,
      TextInputBuilder,
      TextInputStyle,
      ActionRowBuilder,
    } = require("discord.js");

    const definitionInput = new TextInputBuilder()
      .setCustomId("definitionInput")
      .setLabel("Definition")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(termData.definition || "")
      .setRequired(false);

    const exampleInput = new TextInputBuilder()
      .setCustomId("exampleInput")
      .setLabel("Example")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(termData.example || "")
      .setRequired(false);

    const coinedByInput = new TextInputBuilder()
      .setCustomId("coinedByInput")
      .setLabel(`User ID (was ${coinedByTag})`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(termData.coinedBy)
      .setRequired(false);

    // Word Type: show current word type if available
    const wordTypeInput = new TextInputBuilder()
      .setCustomId("wordTypeInput")
      .setLabel("Word Type")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(termData.wordType || "")
      .setRequired(false);

    const modal = new ModalBuilder()
      .setCustomId(`edit_term_modal_${term}`)
      .setTitle(`Edit "${term}"`);

    modal.addComponents(
      new ActionRowBuilder().addComponents(definitionInput),
      new ActionRowBuilder().addComponents(exampleInput),
      new ActionRowBuilder().addComponents(coinedByInput),
      new ActionRowBuilder().addComponents(wordTypeInput)
    );

    await interaction.showModal(modal);
  },
};
