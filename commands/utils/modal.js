const { Redis } = require("@upstash/redis");
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("testmodal")
    .setDescription("Retrieve a term from the dictionary"),

  async execute(interaction) {
    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId("myModal")
      .setTitle("My Modal");

    // Add components to modal

    // Create the text input components
    const favoriteColorInput = new TextInputBuilder()
      .setCustomId("favoriteColorInput")
      // The label is the prompt the user sees for this input
      .setLabel("What's your favorite color?")
      // Short means only a single line of text
      .setStyle(TextInputStyle.Short);

    const hobbiesInput = new TextInputBuilder()
      .setCustomId("hobbiesInput")
      .setLabel("What's some of your favorite hobbies?")
      // Paragraph means multiple lines of text.
      .setStyle(TextInputStyle.Paragraph);

    // An action row only holds one text input,
    // so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder().addComponents(
      favoriteColorInput
    );
    const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(select);

    // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    // Show the modal to the user
    await interaction.showModal(modal);
  },
};
