const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const welcomeChannelSchema = require('../../models/WelcomeChannel');

const data = new SlashCommandBuilder()
    .setName('remove-welcome-chanel')
    .setDescription("Remove a welcome channel")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) => 
        option
            .setName('target-channel')
            .setDescription('The channel to remove welcome messages from.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
    );

/**
 * 
 * @param {*} param0 
 */
async function run({interaction}) {
    try {
        const targetChannel = interaction.options.getChannel('target-channel');

        await interaction.deferReply({ephemeral: true});

        const query = {
            guildId: interaction.guildId,
            channelId: targetChannel.id,
        };

        const channelExistsInDb = await welcomeChannelSchema.exists(query);
        
        if (!channelExistsInDb) {
            interaction.followUp('That channel has no been configured for welcome messages.');
            return;
        };

        welcomeChannelSchema.findOneAndDelete(query)
            .then(() => {
                interaction.followUp(`Removed ${targetChannel} from receiving welcome messages.`);
            })
            .catch((error) => {
                interaction.followUp('Database error. Please try again in a moment.');
                console.log(`Db error in ${__filename}:\n`, error);
            });
    } catch (error) {
        console.log(`Error in ${__filename}:\n`, error);
    }
}

module.exports = {data, run};