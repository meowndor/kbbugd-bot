const { Client, Collection, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// Load commands dynamically
const commandFiles = fs
  .readdirSync("./commands/utils")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/utils/${file}`);
  client.commands.set(command.data.name, command);
}

// Handle interactions
// index.js

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    // Existing command handling
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error executing that command!",
        ephemeral: true,
      });
    }
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "select_word_type") {
      const selectedWordType = interaction.values[0];

      // Proceed to prompt the user for the "Coined By" user ID then show the modal inside the promptCoinedByUser function
      await promptCoinedByUser(interaction, selectedWordType);

      if (interaction.isUserSelectMenu()) {
        if (interaction.customId === "select_coined_by") {
          await handleCoinedBySelection(interaction);
        }
      } else if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith("add_term_modal_")) {
          await handleModalSubmission(interaction);
        }
      }
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("edit_term_modal_")) {
      await handleEditModalSubmission(interaction);
    }
  }
});

async function showAddTermModal(interaction, selectedWordType) {
  const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
  } = require("discord.js");

  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId(`add_term_modal_${selectedWordType}`)
    .setTitle("Add a New Term");

  // Term Input
  const termInput = new TextInputBuilder()
    .setCustomId("termInput")
    .setLabel("Term")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("mgodonf");

  // Term Input
  const pronunciationInput = new TextInputBuilder()
    .setCustomId("pronunciationInput")
    .setLabel("Pronounciation")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("/məˌgo.donf/");

  // Definition Input
  const definitionInput = new TextInputBuilder()
    .setCustomId("definitionInput")
    .setLabel("Definition")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder("mgodonf is a mistyped from 'ngoding'.");

  // Example Input
  const exampleInput = new TextInputBuilder()
    .setCustomId("exampleInput")
    .setLabel("Example")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  // Add components to ActionRows
  modal.addComponents(
    new ActionRowBuilder().addComponents(termInput),
    new ActionRowBuilder().addComponents(pronunciationInput),
    new ActionRowBuilder().addComponents(definitionInput),
    new ActionRowBuilder().addComponents(exampleInput)
  );

  // Show the modal
  await interaction.showModal(modal);
}

// Helper functions
async function promptCoinedByUser(interaction, selectedWordType) {
  // Store the selected word type
  if (!client.userData) client.userData = new Map();
  client.userData.set(interaction.user.id, { wordType: selectedWordType });

  const { ActionRowBuilder, UserSelectMenuBuilder } = require("discord.js");

  const userSelectMenu = new UserSelectMenuBuilder()
    .setCustomId("select_coined_by")
    .setPlaceholder("Select the user who coined the term")
    .setMaxValues(1);

  const row = new ActionRowBuilder().addComponents(userSelectMenu);

  await interaction.reply({
    content: "Please select the user who coined the term:",
    components: [row],
    ephemeral: true,
  });
}

async function handleCoinedBySelection(interaction) {
  const selectedUserId = interaction.values[0];

  // Retrieve the stored data
  const userData = client.userData.get(interaction.user.id);
  if (!userData) {
    await interaction.reply({
      content: "An error occurred. Please try the `/add` command again.",
      ephemeral: true,
    });
    return;
  }

  userData.coinedById = selectedUserId;
  client.userData.set(interaction.user.id, userData);

  // Proceed to show the modal
  await showAddTermModal(interaction, userData);
}

// async function handleModalSubmission(interaction) {
//   const { Redis } = require("@upstash/redis");

//   const redis = new Redis({
//     url: process.env.UPSTASH_REDIS_REST_URL,
//     token: process.env.UPSTASH_REDIS_REST_TOKEN,
//   });

//   // Extract the word type from the customId
//   const selectedWordType = interaction.customId.replace("add_term_modal_", "");

//   // Retrieve the data entered by the user
//   const term = interaction.fields
//     .getTextInputValue("termInput")
//     .trim()
//     .toLowerCase()
//     .replace(/\s+/g, "-");
//   const pronounciation = interaction.fields
//     .getTextInputValue("pronounciationInput")
//     .trim();
//   const definition = interaction.fields
//     .getTextInputValue("definitionInput")
//     .trim();
//   // const tagsInput = interaction.fields
//   //   .getTextInputValue("pronounciationInput")
//   //   .trim();
//   const example = interaction.fields.getTextInputValue("exampleInput").trim();
//   const coinedByInput = interaction.fields
//     .getTextInputValue("coinedByInput")
//     .trim();

//   // Validate "Coined By" user ID
//   let coinedByUser;
//   try {
//     coinedByUser = await client.users.fetch(coinedByInput);
//   } catch (error) {
//     await interaction.reply({
//       content:
//         'Invalid user ID for "Coined By". Please ensure you enter a valid user ID.',
//       ephemeral: true,
//     });
//     return;
//   }

//   // Process tags
//   // const tags = tagsInput ? tagsInput.split(",").map((tag) => tag.trim()) : [];

//   // Check if term already exists
//   const existingTerm = await redis.hgetall(`term:${term}`);
//   if (existingTerm && Object.keys(existingTerm).length > 0) {
//     await interaction.reply({
//       content: `The term "${term}" already exists. Use /update to modify it.`,
//       ephemeral: true,
//     });
//     return;
//   }

//   // Store the term in Redis
//   await redis.hset(`term:${term}`, {
//     definition,
//     pronounciation,
//     example,
//     coinedBy: coinedByUser.id,
//     // tags: JSON.stringify(tags),
//     wordType: selectedWordType,
//   });

//   await interaction.reply({
//     content: `Term "${term}" added successfully as a ${selectedWordType}!`,
//     ephemeral: true,
//   });
// }

async function handleModalSubmission(interaction) {
  const { Redis } = require("@upstash/redis");

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Retrieve the stored data
  const userData = client.userData.get(interaction.user.id);
  if (!userData) {
    await interaction.reply({
      content: "An error occurred. Please try the `/add` command again.",
      ephemeral: true,
    });
    return;
  }

  const { wordType, coinedById } = userData;

  // Retrieve the data entered by the user
  const term = interaction.fields
    .getTextInputValue("termInput")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const pronunciation = interaction.fields
    .getTextInputValue("pronunciationInput")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const definition = interaction.fields
    .getTextInputValue("definitionInput")
    .trim();
  const example = interaction.fields.getTextInputValue("exampleInput").trim();
  // const tagsInput = interaction.fields.getTextInputValue('tagsInput').trim();

  // // Process tags
  // const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];

  // Check if term already exists
  const existingTerm = await redis.hgetall(`term:${term}`);
  if (existingTerm && Object.keys(existingTerm).length > 0) {
    await interaction.reply({
      content: `The term "${term}" already exists. Use /update to modify it.`,
      ephemeral: true,
    });
    client.userData.delete(interaction.user.id);
    return;
  }

  // Store the term in Redis
  await redis.hset(`term:${term}`, {
    definition,
    pronunciation,
    example,
    coinedBy: coinedById,
    addedBy: interaction.user.id,
    wordType,
  });

  await interaction.reply({
    content: `Term "${term}" added successfully as a ${wordType}!`,
    ephemeral: true,
  });

  // Clean up stored data
  client.userData.delete(interaction.user.id);
}

async function handleEditModalSubmission(interaction) {
  const modalId = interaction.customId;
  const term = modalId.replace("edit_term_modal_", "");

  // Retrieve original data
  const userData = client.userData.get(`${interaction.user.id}:${term}`);
  if (!userData) {
    return interaction.reply({
      content: "No original data found. Please try `/edit` again.",
      ephemeral: true,
    });
  }

  // Get the new values (if any)
  const newDefinition = interaction.fields
    .getTextInputValue("definitionInput")
    .trim();
  const newExample = interaction.fields
    .getTextInputValue("exampleInput")
    .trim();
  const newCoinedBy = interaction.fields
    .getTextInputValue("coinedByInput")
    .trim();
  const newWordType = interaction.fields
    .getTextInputValue("wordTypeInput")
    .trim();

  // Only update fields that are filled. Blank means no update.
  const updatedData = { ...userData }; // start with old data

  if (newDefinition !== "") updatedData.definition = newDefinition;
  if (newExample !== "") updatedData.example = newExample;
  if (newCoinedBy !== "") updatedData.coinedBy = newCoinedBy;
  if (newWordType !== "") updatedData.wordType = newWordType;

  // Update the term in Redis
  await redis.hset(`term:${term}`, updatedData);

  // Cleanup stored data
  client.userData.delete(`${interaction.user.id}:${term}`);

  await interaction.reply({
    content: `Term "${term}" updated successfully!`,
    ephemeral: true,
  });
}

client.login(process.env.DISCORD_TOKEN);
client.once("ready", () => {
  console.log(`${client.user.tag} is online and ready! (Press CTRL+C to quit)`);
});
