const welcomeChannelSchema = require('../../models/WelcomeChannel');

/**
 * @param {import('discord.js').GuildMember} guildMember 
 */
module.exports = async (guildMember) => {
    try {
        if (guildMember.user.bot) return;

        const welcomeConfigs = await welcomeChannelSchema.find({
            guildId: guildMember.guild.id,
        });
        if (!welcomeConfigs.length) return;

        for (const welcomeConfig of welcomeConfigs) {
            const targetChannel = guildMember.guild.channels.cache.get(welcomeConfig.channelId) ||
            (await guildMember.guild.channels.fetch(
                welcomeConfig.channelId
            ));
            if (!targetChannel) {
                welcomeChannelSchema.findOneAndDelete({
                    guildId: guildMember.guild.id,
                    channelId: welcomeConfig.channelId,
                }).catch(() => {});
            }
            const customMessage = welcomeConfig.customMessage || 'Hey {username}. Welcome to {server-name}';
            
            const welcomeMessage = customMessage
                .replace('{mention-member}', `<@${guildMember.id}>`)
                .replace('{username}', guildMember.user.username)
                .replace('{server-name}', guildMember.guild.name);

            targetChannel.send(welcomeMessage).catch(() => {});
        }
    } catch (error) {
        console.log(`Error in ${__filename}:\n`, error);
    }
};