const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
require('dotenv').config();

// Replace YOUR_TOKEN with your Telegram Bot API token
const botToken = process.env.BOT_TOKEN;
const secretKey = process.env.SECRET_KEY;
const userId = process.env.USER_ID;

// Create a new Telegram Bot instance
const bot = new TelegramBot(botToken, { polling: true });

// Handle incoming messages
bot.onText(/\/say (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1]; // Extract the text after the "/say" command

  // Convert text to speech
  const conversionId = await convertToSpeech(text);

  if (conversionId) {
    // Check conversion status
    const audioUrl = await checkConversionStatus(conversionId);

    if (audioUrl) {
      // Send the audio file to the user
      bot.sendAudio(chatId, audioUrl);
    } else {
      bot.sendMessage(chatId, 'An error occurred while generating the audio. Please try again later.');
    }
  } else {
    bot.sendMessage(chatId, 'An error occurred while initiating the conversion. Please try again later.');
  }
});

// Function to convert text to speech
async function convertToSpeech(text) {
  try {
    const url = 'https://play.ht/api/v1/convert';
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        AUTHORIZATION: secretKey,
        'X-USER-ID': userId,
      },
      body: JSON.stringify({ content: [text], voice: 'Joanna' }),
    };

    const response = await fetch(url, options);
    const json = await response.json();

    if (json.status === 'CREATED') {
      return json.transcriptionId;
    } else {
      console.error('Error:', json);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Function to check conversion status
async function checkConversionStatus(transcriptionId) {
  try {
    const url = `https://play.ht/api/v1/articleStatus?transcriptionId=${transcriptionId}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        AUTHORIZATION: secretKey,
        'X-USER-ID': userId,
      },
    };

    const response = await fetch(url, options);
    const json = await response.json();

    if (json.converted) {
      return json.audioUrl;
    } else {
      console.error('Error:', json);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Start the bot
bot.onText(/\/start/, (msg) => {
  const welcomeMessage = '/say Welcome to the Text-to-Speech Bot! Send me any text using the /say command, and I will convert it to speech for you.';
  bot.sendMessage(msg.chat.id, welcomeMessage);
});
