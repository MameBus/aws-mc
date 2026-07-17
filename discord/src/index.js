import { Client, Events, GatewayIntentBits, REST, Routes } from 'discord.js';

const TOKEN = process.env['Token'];
const CLIENT_ID = process.env['CLIENT_ID'];

if (!TOKEN || !CLIENT_ID) {
    console.error('Missing token or client id environment vars');
    process.exit(1)
}

const commands = [
    {
        name: 'test',
        description: 'Joel is testing',
        callback: async () => {

        }
    },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

try {
    console.log('Started refreshing application (/) commands.');

    console.log(await rest.get(Routes.applicationCommands(CLIENT_ID)));

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'test') {
        await interaction.reply('I work. You can be happy now.');
    }
});

client.login(TOKEN);