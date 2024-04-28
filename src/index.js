require('dotenv/config');
const { Client } = require('discord.js');
const { CommandKit } = require('commandkit');
const { OpenAI } = require('openai');
const mongoose =require('mongoose');

//Avaible to :
const client = new Client ({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent']
});

new CommandKit({
    client,
    commandsPath: `${__dirname}/commands`,
    eventsPath: `${__dirname}/events`,
    devGuildIds: ['1065712910573252709'],
    devUserIds: ['397869534167433216'],
    bulkRegister: true,
});

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Connected to database');
    client.login(process.env.TOKEN);
})

//To turn On the bot, node index.js and the following line will appear
client.on('ready', ()=>{
   console.log('Chat GPT is Online \nWelcome !'); 
});

//If person doesnt start his message by !, he'll be speaking rigth away to gpt
const IGNORE_PREFIX = "!";
//Channels where gpt is avaible (Private for testing purpose)
const CHANNELS = ['1232665112582553600'];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(()=>{
        message.channel.sendTyping();
    }, 5000);

    let conversation =[];
    conversation.push({
        role: 'system',
        content: 'Chat GPT is your friend'
    });

    let prevMessages = await message.channel.messages.fetch({ limit: 10});
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
        if (msg.author.bot && msg.author.id !== client.user.id) return;
        if (msg.content.startsWith(IGNORE_PREFIX)) return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if (msg.author.id === client.user.id) {
            conversation.push({
                role: 'assistant',
                name: username,
                content: msg.content
            });
            return;
        }

        conversation.push({
            role: 'user',
            name: username,
            content: msg.content
        });
    })

    const response = await openai.chat.completions
        .create({
            model: 'gpt-4',
            messages : conversation,
        })
        .catch((error) => console.error('OpenAI Error: \n', error));

    clearInterval(sendTypingInterval);

    if (!response) {
        message.reply("Try again in a moment");
        return;
    }

    const responseMessage = response.choices[0].message.content;
    const chunkSizeLimit = 2000;

    for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
        const chunk = responseMessage.substring(i, i + chunkSizeLimit);

        await message.reply(chunk);
    }
});