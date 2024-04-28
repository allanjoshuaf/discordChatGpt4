const { SlashCommandBuilder } = require('discord.js');
 
const data = new SlashCommandBuilder()
    .setName('simulate-join')
    .setDescription('Simulate a member joining.')
    .addUserOption((option) =>
        option
            .setName('target-user')
            .setDescription('The user you want to emulate joining.')
    );
 
/**
 * @param {import('commandkit').SlashCommandProps} param0
 */
async function run({ interaction, client }) {
    const targetUser = interaction.options.getUser('target-user');
 
    let member;
 
    if (targetUser) {
        member =
            interaction.guild.members.cache.get(targetUser.id) ||
            (await interaction.guild.members.fetch(targetUser.id));
    } else {
        member = interaction.member;
    }
 
    client.emit('guildMemberAdd', member);
 
    interaction.reply('Simulated join!');
}
 
/**
 * @type {import('commandkit').CommandOptions}
 */
const options = {
    devOnly: true,
};
 
module.exports = { data, run, options };