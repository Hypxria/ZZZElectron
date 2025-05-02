import { spotifyService } from '../../../spotifyServices/SpotifyService.ts'

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

export async function loopOne() {
    spotifyService.setRepeatMode(2)
}

export async function loopContext() {
    spotifyService.setRepeatMode(1)
}

export async function loopOff() {
    spotifyService.setRepeatMode(0)
}