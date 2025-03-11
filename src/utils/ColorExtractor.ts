export interface Swatch {
    rgb: [number, number, number];
    population: number;
    hex: string;
    hsl: [number, number, number];
}

export interface Palette {
    Vibrant?: Swatch;
    Muted?: Swatch;
    DarkVibrant?: Swatch;
    DarkMuted?: Swatch;
    LightVibrant?: Swatch;
    LightMuted?: Swatch;
}

export class ColorExtractor {
    private static readonly SAMPLE_COUNT = 100;
    private static readonly TARGET_DARK_LUMA = 0.26;
    private static readonly MAX_DARK_LUMA = 0.45;
    private static readonly MIN_LIGHT_LUMA = 0.55;
    private static readonly TARGET_LIGHT_LUMA = 0.74;
    private static readonly MIN_NORMAL_LUMA = 0.3;
    private static readonly MAX_NORMAL_LUMA = 0.7;
    private static readonly TARGET_MUTED_SATURATION = 0.3;
    private static readonly MAX_MUTED_SATURATION = 0.4;
    private static readonly TARGET_VIBRANT_SATURATION = 1.0;
    private static readonly MIN_VIBRANT_SATURATION = 0.35;

    static async from(imageUrl: string): Promise<Palette> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const pixels = this.getPixelArray(imageData);
                const swatches = this.generateSwatches(pixels);
                const palette = this.generatePalette(swatches);
                
                resolve(palette);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = imageUrl;
        });
    }

    private static getPixelArray(imageData: ImageData): Array<[number, number, number]> {
        const pixels: Array<[number, number, number]> = [];
        const data = imageData.data;
        const pixelCount = data.length / 4;
        const step = Math.max(Math.round(pixelCount / this.SAMPLE_COUNT), 1);

        for (let i = 0; i < pixelCount; i += step) {
            const offset = i * 4;
            pixels.push([data[offset], data[offset + 1], data[offset + 2]]);
        }

        return pixels;
    }

    private static generateSwatches(pixels: Array<[number, number, number]>): Swatch[] {
        return pixels.map(rgb => {
            const hsl = this.rgbToHsl(rgb[0], rgb[1], rgb[2]);
            return {
                rgb: rgb,
                population: 1,
                hex: this.rgbToHex(rgb[0], rgb[1], rgb[2]),
                hsl: hsl
            };
        });
    }

    private static generatePalette(swatches: Swatch[]): Palette {
        const palette: Palette = {};
        
        // Group swatches by their characteristics
        const vibrantSwatches = swatches.filter(s => 
            s.hsl[1] >= this.MIN_VIBRANT_SATURATION &&
            s.hsl[2] >= this.MIN_NORMAL_LUMA && 
            s.hsl[2] <= this.MAX_NORMAL_LUMA
        );

        const lightVibrantSwatches = swatches.filter(s =>
            s.hsl[1] >= this.MIN_VIBRANT_SATURATION &&
            s.hsl[2] >= this.MIN_LIGHT_LUMA
        );

        const darkVibrantSwatches = swatches.filter(s =>
            s.hsl[1] >= this.MIN_VIBRANT_SATURATION &&
            s.hsl[2] <= this.MAX_DARK_LUMA
        );

        const mutedSwatches = swatches.filter(s =>
            s.hsl[1] <= this.MAX_MUTED_SATURATION &&
            s.hsl[2] >= this.MIN_NORMAL_LUMA &&
            s.hsl[2] <= this.MAX_NORMAL_LUMA
        );

        const lightMutedSwatches = swatches.filter(s =>
            s.hsl[1] <= this.MAX_MUTED_SATURATION &&
            s.hsl[2] >= this.MIN_LIGHT_LUMA
        );

        const darkMutedSwatches = swatches.filter(s =>
            s.hsl[1] <= this.MAX_MUTED_SATURATION &&
            s.hsl[2] <= this.MAX_DARK_LUMA
        );

        // Find the best matches for each palette slot
        if (vibrantSwatches.length > 0) {
            palette.Vibrant = this.findBestSwatch(vibrantSwatches, this.TARGET_VIBRANT_SATURATION, 0.5);
        }

        if (lightVibrantSwatches.length > 0) {
            palette.LightVibrant = this.findBestSwatch(lightVibrantSwatches, this.TARGET_VIBRANT_SATURATION, this.TARGET_LIGHT_LUMA);
        }

        if (darkVibrantSwatches.length > 0) {
            palette.DarkVibrant = this.findBestSwatch(darkVibrantSwatches, this.TARGET_VIBRANT_SATURATION, this.TARGET_DARK_LUMA);
        }

        if (mutedSwatches.length > 0) {
            palette.Muted = this.findBestSwatch(mutedSwatches, this.TARGET_MUTED_SATURATION, 0.5);
        }

        if (lightMutedSwatches.length > 0) {
            palette.LightMuted = this.findBestSwatch(lightMutedSwatches, this.TARGET_MUTED_SATURATION, this.TARGET_LIGHT_LUMA);
        }

        if (darkMutedSwatches.length > 0) {
            palette.DarkMuted = this.findBestSwatch(darkMutedSwatches, this.TARGET_MUTED_SATURATION, this.TARGET_DARK_LUMA);
        }

        return palette;
    }

    private static findBestSwatch(swatches: Swatch[], targetSaturation: number, targetLuma: number): Swatch {
        let maxScore = 0;
        let bestSwatch = swatches[0];

        for (const swatch of swatches) {
            const saturationScore = 1 - Math.abs(swatch.hsl[1] - targetSaturation);
            const lumaScore = 1 - Math.abs(swatch.hsl[2] - targetLuma);
            const score = saturationScore * lumaScore;

            if (score > maxScore) {
                maxScore = score;
                bestSwatch = swatch;
            }
        }

        return bestSwatch;
    }

    private static rgbToHsl(r: number, g: number, b: number): [number, number, number] {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        return [h, s, l];
    }

    private static rgbToHex(r: number, g: number, b: number): string {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
}