/**
 * Loads the koala Lottie JSON and recolors it to match the app theme.
 * Also creates different animation variants per mood by modifying
 * frame ranges and playback properties.
 */

type ColorRGBA = [number, number, number, number];

function deepClone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

/** Recursively walk JSON and replace color arrays */
function replaceColors(obj: any, colorMap: Map<string, ColorRGBA>): any {
    if (Array.isArray(obj)) {
        // Check if this is a color array [r, g, b, a] with values 0-1
        if (obj.length === 4 && obj.every((v: any) => typeof v === 'number')) {
            for (const [key, replacement] of colorMap) {
                const target = key.split(',').map(Number);
                if (
                    Math.abs(obj[0] - target[0]) < 0.02 &&
                    Math.abs(obj[1] - target[1]) < 0.02 &&
                    Math.abs(obj[2] - target[2]) < 0.02
                ) {
                    return [...replacement];
                }
            }
        }
        return obj.map((item: any) => replaceColors(item, colorMap));
    }
    if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const k of Object.keys(obj)) {
            result[k] = replaceColors(obj[k], colorMap);
        }
        return result;
    }
    return obj;
}

/** Modify the out-point (op) to control animation length */
function setFrameRange(data: any, ip: number, op: number, speed: number): any {
    const clone = deepClone(data);
    clone.ip = ip;
    clone.op = op;
    // Also adjust layers
    if (clone.layers) {
        for (const layer of clone.layers) {
            if (layer.ip !== undefined) layer.ip = Math.max(layer.ip, ip);
            if (layer.op !== undefined) layer.op = Math.min(layer.op, op);
        }
    }
    if (clone.assets) {
        for (const asset of clone.assets) {
            if (asset.layers) {
                for (const layer of asset.layers) {
                    if (layer.ip !== undefined) layer.ip = Math.max(layer.ip, ip);
                    if (layer.op !== undefined) layer.op = Math.min(layer.op, op);
                }
            }
        }
    }
    return clone;
}

// Cache
let baseAnimationData: any = null;
const variantCache: Record<string, any> = {};

async function loadBase(): Promise<any> {
    if (baseAnimationData) return baseAnimationData;
    const resp = await fetch('/assets/koala_19004113.json');
    baseAnimationData = await resp.json();
    return baseAnimationData;
}

// Color palettes (RGB 0-1)
const BLACK: ColorRGBA = [0, 0, 0, 1];
const TEAL: ColorRGBA = [0.2, 0.8, 0.8, 1];

// App colors
const LIGHT: ColorRGBA = [0.925, 0.925, 0.933, 1];      // #ececef
const ACCENT: ColorRGBA = [0.424, 0.447, 0.796, 1];      // #6c72cb
const MUTED: ColorRGBA = [0.45, 0.45, 0.5, 1];           // muted gray
const DARK: ColorRGBA = [0.1, 0.1, 0.12, 1];             // near-black for light bg
const WARM: ColorRGBA = [0.85, 0.55, 0.2, 1];            // warm amber
const DARK_ACCENT: ColorRGBA = [0.3, 0.32, 0.6, 1];      // darker accent for light bg

export type KoalaMood = 'idle' | 'happy' | 'directing' | 'celebrating' | 'sad' | 'waving' | 'sleeping';

interface MoodConfig {
    baseColor: ColorRGBA;
    highlightColor: ColorRGBA;
    speed: number;
    /** Frame range [start, end] — full animation is 0-180 */
    frames?: [number, number];
    direction?: 1 | -1;
}

// The full animation (180 frames at 60fps = 3s) has:
// - Body sway + branch rotation: frames 5-175 (slow wave)
// - Leg 1 kicking: alternates every ~15 frames (frames 5-170)
// - Leg 2 kicking: alternates every ~15 frames, offset (frames 5-175)
// - Head tilt: frames 5-175 (slow rotation -12° to 6°)
// - Eye blinks: frames 140-170 (two quick blinks)
// - Cheek/leg3 bouncing: frames 5-167
//
// For different moods we vary speed, direction, and color:

const moodConfigs: Record<KoalaMood, MoodConfig> = {
    idle: {
        baseColor: LIGHT, highlightColor: ACCENT,
        speed: 0.6,
    },
    happy: {
        baseColor: LIGHT, highlightColor: ACCENT,
        speed: 1.4,
    },
    directing: {
        baseColor: LIGHT, highlightColor: ACCENT,
        speed: 1.0,
    },
    celebrating: {
        baseColor: LIGHT, highlightColor: WARM,
        speed: 2.0,
    },
    sad: {
        baseColor: MUTED, highlightColor: MUTED,
        speed: 0.25,
    },
    waving: {
        baseColor: LIGHT, highlightColor: ACCENT,
        speed: 1.2,
    },
    sleeping: {
        baseColor: MUTED, highlightColor: ACCENT,
        speed: 0.12,
    },
};

export interface AnimationResult {
    data: any;
    speed: number;
    direction: 1 | -1;
}

export async function getKoalaAnimation(mood: KoalaMood = 'idle', dark = false): Promise<AnimationResult> {
    const base = await loadBase();
    const config = moodConfigs[mood];

    // Build color map
    const baseColor = dark ? DARK : config.baseColor;
    const highlightColor = dark ? DARK_ACCENT : config.highlightColor;
    const cacheKey = `${mood}-${dark ? 'dark' : 'light'}`;

    if (!variantCache[cacheKey]) {
        const colorMap = new Map<string, ColorRGBA>();
        colorMap.set('0,0,0', baseColor);
        colorMap.set('0.2,0.8,0.8', highlightColor);

        let recolored = replaceColors(base, colorMap);

        if (config.frames) {
            recolored = setFrameRange(recolored, config.frames[0], config.frames[1], config.speed);
        }

        variantCache[cacheKey] = recolored;
    }

    return {
        data: variantCache[cacheKey],
        speed: config.speed,
        direction: config.direction || 1,
    };
}

export { moodConfigs };
