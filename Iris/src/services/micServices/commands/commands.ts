import * as spotifyCommands from './spotify/spotify.ts';
import * as discordCommands from './discord/discord.ts';  

// Command handler interface
interface CommandHandler {
  execute: (args?: string, token?: string) => Promise<void> | void;
  aliases?: string[]; // Optional array of alternative command phrases
  patterns?: RegExp[]; // Optional array of regex patterns for flexible matching
}

// Map of all available commands
export const commands: Record<string, CommandHandler> = {
  // Spotify playback controls
  'pause': {
    execute: () => spotifyCommands.pause(),
    aliases: ['stop', 'halt'],
    patterns: [
      /^pause\s+(?:\w+\s+)*(?:music|song|playback)?$/i,
      /^stop\s+(?:\w+\s+)*(?:music|song|playback)?$/i,
      /^halt\s+(?:\w+\s+)*(?:music|song|playback)?$/i
    ]
  },
  'resume': {
    execute: () => spotifyCommands.resume(),
    aliases: ['start', 'continue', 'unpause'],
    patterns: [
      /^resume\s+(?:\w+\s+)*(?:music|song|playback)?$/i,
      /^start\s+(?:\w+\s+)*(?:music|song|playback)?$/i,
      /^continue\s+(?:\w+\s+)*(?:music|song|playback)?$/i,
      /^unpause\s+(?:\w+\s+)*(?:music|song|playback)?$/i,
      /^play\s+(?:\w+\s+)*(?:music|song|playback)$/i
    ]
  },
  'play': {
    execute: (args?: string, token?: string) => {
      if (args && token) {
        // Remove trigger phrases like "hey iris" or "play" from the beginning
        const cleanedQuery = args
          .replace(/^(?:hey\s+iris\s+)?(?:play\s+)?/i, '')  // Remove "hey iris" and/or "play" from start
          .trim();
        
        return spotifyCommands.playSong(cleanedQuery, token);
      }
      console.error('Play command requires both query and token parameters');
      return Promise.resolve();
    },
    patterns: [
      /^play\s+(?:\w+\s+)*song$/i,
      /^play\s+(?:\w+\s+)*track$/i,
      /^play\s+(?:\w+\s+)*music$/i
    ]
  },
  'next': {
    execute: () => spotifyCommands.playNextSong(),
    aliases: ['skip'],
    patterns: [
      /^next\s+(?:\w+\s+)*(?:song|track)?$/i,
      /^skip\s+(?:\w+\s+)*(?:song|track)?$/i,
      /^play\s+(?:\w+\s+)*next\s+(?:\w+\s+)*(?:song|track)?$/i,
      /^go\s+(?:\w+\s+)*next$/i,
      /^forward$/i
    ]
  },
  'previous': {
    execute: () => spotifyCommands.playPreviousSong(),
    aliases: ['back', 'prev'],
    patterns: [
      /^previous\s+(?:\w+\s+)*(?:song|track)?$/i,
      /^prev\s+(?:\w+\s+)*(?:song|track)?$/i,
      /^back\s+(?:\w+\s+)*(?:song|track)?$/i,
      /^play\s+(?:\w+\s+)*previous\s+(?:\w+\s+)*(?:song|track)?$/i,
      /^go\s+(?:\w+\s+)*back$/i,
      /^backward$/i
    ]
  },
  
  // Shuffle and repeat controls
  'shuffle': {
    execute: () => spotifyCommands.toggleShuffle(),
    aliases: ['random'],
    patterns: [
      /^shuffle\s+(?:\w+\s+)/i
    ]
  },
  'repeat': {
    execute: () => spotifyCommands.toggleRepeat(),
    aliases: ['loop']
  },
  'loop one': {
    execute: () => spotifyCommands.loopOne(),
    aliases: ['repeat one', 'repeat song', 'loop song'],
    patterns: [
      /^loop\s+(?:\w+\s+)*one$/i, 
      /^repeat\s+(?:\w+\s+)*one$/i, 
      /^loop\s+(?:\w+\s+)*song$/i, 
      /^repeat\s+(?:\w+\s+)*song$/i
    ]
  },
  'loop context': {
    execute: () => spotifyCommands.loopContext(),
    aliases: ['repeat context', 'repeat album', 'loop album', 'repeat playlist', 'loop playlist'],
    patterns: [
      /^loop\s+(?:\w+\s+)*context$/i,
      /^repeat\s+(?:\w+\s+)*context$/i,
      /^loop\s+(?:\w+\s+)*album$/i,
      /^repeat\s+(?:\w+\s+)*album$/i,
      /^loop\s+(?:\w+\s+)*playlist$/i,
      /^repeat\s+(?:\w+\s+)*playlist$/i
    ]
  },
  'loop off': {
    execute: () => spotifyCommands.loopOff(),
    aliases: ['repeat off', 'no loop', 'no repeat'],
    patterns: [/^loop\s+(?:\w+\s+)*off$/i, /^repeat\s+(?:\w+\s+)*off$/i, /^no\s+(?:\w+\s+)*loop$/i, /^no\s+(?:\w+\s+)*repeat$/i]
  },
  
  // Volume controls
  'volume up': {
    execute: () => spotifyCommands.volumeUp(),
    aliases: ['louder', 'increase volume'],
    patterns: [
      /^(?:turn|make)?\s*(?:the)?\s*volume\s+(?:\w+\s+)*up$/i, 
      /^louder$/i, /^increase\s+(?:\w+\s+)*volume$/i
    ]
  },
  'volume down': {
    execute: () => spotifyCommands.volumeDown(),
    aliases: ['quieter', 'decrease volume', 'lower volume'],
    patterns: [
      /^(?:turn|make)?\s*(?:the)?\s*volume\s+(?:\w+\s+)*down$/i, 
      /^quieter$/i,
      /^decrease\s+(?:\w+\s+)*volume$/i, 
      /^lower\s+(?:\w+\s+)*volume$/i
    ]
  },
  'mute': {
    execute: () => spotifyCommands.mute(),
    aliases: ['silence', 'mute song'],
    patterns: [
      /^mute\s+(?:\w+\s+)*volume$/i,
      /^mute\s+(?:\w+\s+)*song$/i
    ]
  },
  'unmute': {
    execute: () => spotifyCommands.unmute(),
    aliases: ['unsilence', 'unmute song'],
    patterns: [
      /^unmute\s+(?:\w+\s+)*volume$/i,
      /^unmute\s+(?:\w+\s+)*song$/i
    ]
  },

  // Discord Voice Controls
  'discord mute': {
    execute: () => discordCommands.mute(),
    aliases: ['mute mic', 'mute discord', 'discord mic mute'],
    patterns: [
      /^discord\s+(?:\w+\s+)*mute$/i,
      /^mute\s+(?:\w+\s+)*mic(?:rophone)?$/i,
      /^mute\s+(?:\w+\s+)*discord$/i,
      /^unmute\s+(?:\w+\w)/i
    ]
  },
  'discord unmute': {
    execute: () => discordCommands.unmute(),
    aliases: ['unmute mic', 'unmute discord', 'discord mic unmute'],
    patterns: [
      /^discord\s+(?:\w+\s+)*unmute$/i,
      /^unmute\s+(?:\w+\s+)*mic(?:rophone)?$/i,
      /^unmute\s+(?:\w+\s+)*discord$/i,
      /^unmute\s+(?:\w+\w)/i
    ]
  },
  'discord deafen': {
    execute: () => discordCommands.deafen(),
    aliases: ['deafen', 'deaf', 'discord deaf'],
    patterns: [
      /^discord\s+(?:\w+\s+)*deafen$/i,
      /^deafen\s+(?:\w+\s+)*discord?$/i,
      /^deaf(?:en)?$/i
    ]
  },
  'discord undeafen': {
    execute: () => discordCommands.undeafen(),
    aliases: ['undeafen', 'undeaf', 'discord undeaf'],
    patterns: [
      /^discord\s+(?:\w+\s+)*undeafen$/i,
      /^undeafen\s+(?:\w+\s+)*discord?$/i,
      /^undeaf(?:en)?$/i
    ]
  },
  'leave call': {
    execute: () => discordCommands.leaveCall(),
    aliases: ['hang up', 'end call', 'disconnect call'],
    patterns: [
      /^leave\s+(?:\w+\s+)*call$/i,
      /^hang\s+(?:\w+\s+)*up$/i,
      /^end\s+(?:\w+\s+)*call$/i,
      /^disconnect\s+(?:\w+\s+)*call$/i
    ]
  },
  // 'accept call': {
  //   execute: () => discordCommands.acceptCall(),
  //   aliases: ['answer call', 'pick up', 'join call'],
  //   patterns: [
  //     /^accept\s+(?:\w+\s+)*call$/i,
  //     /^answer\s+(?:\w+\s+)*call$/i,
  //     /^pick\s+(?:\w+\s+)*up$/i,
  //     /^join\s+(?:\w+\s+)*call$/i
  //   ]
  // }
};

// Create a mapping of all command phrases (including aliases) to their primary command
const commandAliasMap: Record<string, string> = {};

// Store pattern-based commands for flexible matching
const patternCommands: Array<{pattern: RegExp, command: string}> = [];

// Initialize the alias map
function initializeAliasMap() {
  // Add each primary command to the map
  Object.keys(commands).forEach(cmdName => {
    // Add the primary command
    commandAliasMap[cmdName.toLowerCase()] = cmdName;
    
    // Add all aliases for this command
    const aliases = commands[cmdName].aliases || [];
    aliases.forEach(alias => {
      commandAliasMap[alias.toLowerCase()] = cmdName;
    });
    
    // Add all patterns for this command
    const patterns = commands[cmdName].patterns || [];
    patterns.forEach(pattern => {
      patternCommands.push({ pattern, command: cmdName });
    });
  });
}

// Initialize the alias map when this module loads
initializeAliasMap();

/**
 * Removes trigger phrases from the input text
 * @param text - The input text to clean
 * @returns Cleaned text without trigger phrases
 */
export function removeTriggerPhrases(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/^(?:hey\s+iris\s+)/i, '')  // Remove "hey iris" from start
    .replace(/^(?:iris\s+)/i, '')         // Remove "iris" from start
    .replace(/^(?:hey\s+)/i, '')          // Remove "hey" from start
    .trim();
}

/**
 * Executes a command if it exists in the commands map
 * @param commandPhrase - The phrase to execute (can be primary command or alias)
 * @param args - Optional arguments for the command
 * @param token - Optional token for authenticated commands
 * @returns True if the command was found and executed, false otherwise
 */
export function executeCommand(commandPhrase: string, args?: string, token?: string): boolean {
  // Clean the command phrase by removing trigger words
  const cleanedCommandPhrase = removeTriggerPhrases(commandPhrase);
  
  // First try exact match
  const primaryCommand = commandAliasMap[cleanedCommandPhrase.toLowerCase()];
  
  if (primaryCommand) {
    const command = commands[primaryCommand];
    try {
      // Clean args if provided
      const cleanedArgs = args ? removeTriggerPhrases(args) : args;
      command.execute(cleanedArgs, token);
      return true;
    } catch (error) {
      console.error(`Error executing command ${cleanedCommandPhrase}:`, error);
      return false;
    }
  }
  
  // If no exact match, try pattern matching
  for (const { pattern, command } of patternCommands) {
    if (pattern.test(cleanedCommandPhrase)) {
      try {
        // Clean args if provided
        const cleanedArgs = args ? removeTriggerPhrases(args) : args;
        commands[command].execute(cleanedArgs, token);
        return true;
      } catch (error) {
        console.error(`Error executing pattern command ${cleanedCommandPhrase}:`, error);
        return false;
      }
    }
  }
  
  return false;
}

/**
 * Gets a list of all available commands including their aliases
 * @param includeAliases - Whether to include aliases in the result
 * @returns Array of command names and optionally their aliases
 */
export function getAvailableCommands(includeAliases: boolean = false): string[] {
  if (includeAliases) {
    return Object.keys(commandAliasMap);
  }
  return Object.keys(commands);
}

/**
 * Gets all aliases for a specific command
 * @param commandName - The primary command name
 * @returns Array of aliases or empty array if none exist
 */
export function getCommandAliases(commandName: string): string[] {
  const command = commands[commandName];
  return command?.aliases || [];
}

/**
 * Helper function to create a command with flexible word patterns
 * @param baseCommand - The base command (e.g., "loop")
 * @param endWord - The ending word (e.g., "playlist")
 * @returns A RegExp that matches the command with optional words in between
 */
export function createFlexibleCommandPattern(baseCommand: string, endWord: string): RegExp {
  return new RegExp(`^${baseCommand}\\s+(?:\\w+\\s+)*${endWord}$`, 'i');
}