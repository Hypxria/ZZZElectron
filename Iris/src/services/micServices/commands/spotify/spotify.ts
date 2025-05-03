import { spotifyService } from '../../../spotifyServices/SpotifyService.ts'
import { search } from './spotifyAPI.ts'

let beforeUnmute 
export async function pause() {
    spotifyService.pausePlayback()
} 

export async function resume() {
    spotifyService.resumePlayback()
} 

export async function playNextSong() {
    spotifyService.playNextSong()
}

export async function playPreviousSong() {
    spotifyService.playPreviousSong()
}

export async function toggleShuffle() {
    spotifyService.toggleShuffle()
}

export async function toggleRepeat() {
    spotifyService.toggleRepeatMode()
}

export async function loopOne() {
    spotifyService.setRepeatMode(2)
}

export async function loopContext() {
    spotifyService.setRepeatMode(1)
}

export async function loopOff() {
    spotifyService.setRepeatMode(0)
}

export async function playSong(q: string, token:string) {
    spotifyService.playUri(await search(q, token))
}

export async function skip() {
    spotifyService.playNextSong()
}

export async function back() {
    spotifyService.playPreviousSong()
}

export async function volumeUp() {
    spotifyService.increaseVolume()
}

export async function volumeDown() {
    spotifyService.decreaseVolume()
}

export async function mute() {
    spotifyService.muteVolume()
}

export async function unmute() {
    spotifyService.unmuteVolume()
}