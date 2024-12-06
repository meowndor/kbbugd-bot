// commands/utils/add.js

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add a new term to the dictionary"),
  async execute(interaction) {
    // Create a StringSelectMenu for word types
    const wordTypes = [
      { label: "Noun", value: "noun" },
      { label: "Verb", value: "verb" },
      { label: "Adjective", value: "adjective" },
      { label: "Adverb", value: "adverb" },
      { label: "Pronoun", value: "pronoun" },
      { label: "Preposition", value: "preposition" },
      { label: "Conjunction", value: "conjunction" },
      { label: "Interjection", value: "interjection" },
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_word_type")
      .setPlaceholder("Select the word type")
      .addOptions(wordTypes);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: "Please select the word type for the term you want to add:",
      components: [row],
      ephemeral: true,
    });
  },
};
