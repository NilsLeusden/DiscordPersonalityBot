const {Client, IntentsBitField,} = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const fs = require('fs');

const Nils = new Client(
{

	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
	]
})

async function getBotReply(conversationLog)
{
	try
	{
		const result = await axios.post('http://localhost:11434/api/chat',
		{
			model: 'llama3',
			messages : conversationLog,
			stream: false,
		});
		return (result.data.message.content).replace(/[!@#]/g, '');
	}
	catch (err)
	{
		console.error("llama3 error!", err.message);
		return "Night";
	}
}

async function HandleResponse(message)
{
	// message.channel.send("debug: Nils found!");
	const rawExamples = fs.readFileSync('messages.txt', 'utf-8').split('\n');
	let conversationLog = [{ role: 'system', content: 'You are not an AI. Never say youre an AI. Never say: Im just a language model. You are human. Act Human.'}];

	rawExamples.slice(0, 10).forEach(line => {
	if (line.trim() !== "")
	{
		conversationLog.push(
			{
				role: 'assistant',
				content: line.trim()
			});
		}
	});
	conversationLog.push(
	{
		role: 'user',
		content: message.content,
	})
	await message.channel.sendTyping();

	let prevMessages = await message.channel.messages.fetch({limit: 1});
	prevMessages.reverse();
	prevMessages.forEach((msg) =>
	{
		if (msg.author.bot) return;
		if (msg.author.id !== message.author.id)
			return ;
		conversationLog.push(
		{
			role: 'user',
			content: msg.content,
		})
	})
	const reply = await(getBotReply(conversationLog));
	message.channel.send(reply);
	return ;
}

Nils.on('messageCreate', async (message) =>
{
	// console.log(message);

	if (message.author.bot == true || message.channel.id != process.env.CHANNEL_ID)
			return ;
	if (message.content == "Hi Nils" || message.content == "Hi nils")
		message.channel.send(`Hi ${message.author.globalName}`);
	else if (message.content.includes('Nils'))
	{
		// console.log("Entered if statement!");
		await HandleResponse(message);
	}
});

Nils.on('ready', (c) =>
{
	console.log(`${c.user.username} went online`);
})

Nils.login(process.env.TOKEN);