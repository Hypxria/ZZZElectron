export async function mute() {
    window.discord.voice.mute()
}

export async function unmute() {
    window.discord.voice.unmute()
}

export async function deafen() {
    window.discord.voice.deafen()
}

export async function undeafen() {
    window.discord.voice.undeafen()
}

export async function leaveCall() {
    window.discord.voice.leave()
}
