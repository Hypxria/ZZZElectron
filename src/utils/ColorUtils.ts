// ColorUtils.ts
import { FastAverageColor } from 'fast-average-color';

interface ColorScheme {
  avgColor: string;
  brighterColor: string;
  dimmerColor: string;
}

interface ColorContextType {
  colorScheme: ColorScheme;
  generateColors: (imageUrl: string) => Promise<void>;
}

export const generateColorsFromImage = async (imageUrl: string) => {
  if (!imageUrl) return null;

  try {
    const fac = new FastAverageColor();
    const result = await fac.getColorAsync(imageUrl);
    
    const [r, g, b] = result.value.slice(0, 3);
    
    const brighterFactor = 1.3;
    const dimmerFactor = 0.7;

    const clamp = (num: number) => Math.min(255, Math.max(0, Math.round(num)));

    const brighterR = clamp(r * brighterFactor);
    const brighterG = clamp(g * brighterFactor);
    const brighterB = clamp(b * brighterFactor);

    const dimmerR = clamp(r * dimmerFactor);
    const dimmerG = clamp(g * dimmerFactor);
    const dimmerB = clamp(b * dimmerFactor);

    const toHex = (r: number, g: number, b: number) => 
    `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;

    const brighterHex = toHex(brighterR, brighterG, brighterB);
    const dimmerHex = toHex(dimmerR, dimmerG, dimmerB);

    return {
      avgColor: result.hex,
      brighterColor: brighterHex,
      dimmerColor: dimmerHex
    };
  } catch (error) {
    console.error('Error generating colors:', error);
    return null;
  }
};
