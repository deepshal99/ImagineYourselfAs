import React, { useEffect, useState, useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { getKoalaAnimation, KoalaMood } from '../utils/koalaAnimation';

export type PosteyMood = 'idle' | 'happy' | 'directing' | 'celebrating' | 'sad' | 'waving' | 'sleeping';

interface PosteyProps {
    size?: number;
    mood?: PosteyMood;
    animate?: boolean;
    className?: string;
    /** Use dark strokes (for light/white backgrounds) */
    dark?: boolean;
}

/* ─────────────────────────────────────────────
   Koala Face SVG — extracted from the Lottie
   animation head layer for visual consistency.
   ───────────────────────────────────────────── */
const KoalaFace: React.FC<{ size: number; mood: PosteyMood; dark: boolean; className: string }> = ({
    size, mood, dark, className
}) => {
    const headTilt = mood === 'sad' ? -6 : mood === 'waving' ? 5 : mood === 'celebrating' ? 3 : 0;

    const animClass =
        mood === 'idle' ? 'postey-float' :
        mood === 'happy' ? 'postey-bounce' :
        mood === 'celebrating' ? 'postey-bounce-fast' :
        mood === 'waving' ? 'postey-wave' :
        mood === 'sleeping' ? 'postey-breathe' :
        '';

    const stroke = dark ? '#1a1a1f' : 'currentColor';
    const eyeStroke = dark ? '#5a5fb8' : '#6c72cb';

    // Eye line half-length varies by mood
    const es = mood === 'sleeping' ? 0.2 :
        mood === 'happy' || mood === 'celebrating' || mood === 'waving' ? 0.5 :
        mood === 'sad' ? 1.4 : 1;

    // Eye centers (from Lottie Grupo 2 + offset [251.837, 161.935])
    // Left eye center: (223.334, 156.769), direction ~(-0.18, 0.98)
    // Right eye center: (280.34, 167.102), direction ~(-0.18, 0.98)
    const ed = 2.067; // half-length of original eye line
    const dx = -0.18, dy = 0.98; // normalized direction

    return (
        <svg
            width={size}
            height={size}
            viewBox="155 62 202 202"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} ${animClass}`}
            style={{ overflow: 'visible' }}
        >
            <g transform={`rotate(${headTilt} 256 163)`}>
                {/* Head outline — Lottie Trazado 2 */}
                <path
                    d="M186.17,172.02 C180.74,201.97 204.01,231.26 238.15,237.45 C272.29,243.64 304.36,224.38 309.79,194.43 C315.22,164.48 293.65,125.79 259.51,119.6 C225.37,113.41 191.6,142.07 186.17,172.02Z"
                    stroke={stroke} strokeWidth="15.4" strokeLinecap="round" strokeLinejoin="round"
                />
                {/* Right ear — Lottie Trazado 3 */}
                <path
                    d="M310.02,176.43 C324.88,176.49 338.05,165.59 340.18,150.2 C342.29,134.9 332.34,120.24 317.33,116.59 C308.33,114.41 299.42,116.44 292.52,121.33 C289.05,123.79 286.1,126.99 283.9,130.73"
                    stroke={stroke} strokeWidth="15.4" strokeLinecap="round" strokeLinejoin="round"
                />
                {/* Left ear — Lottie Trazado 4 */}
                <path
                    d="M192.27,155.09 C178.73,150.07 170.31,135.93 172.98,121.22 C175.97,104.73 191.76,93.78 208.26,96.77 C221.15,99.1 230.65,109.26 232.77,121.46"
                    stroke={stroke} strokeWidth="15.4" strokeLinecap="round" strokeLinejoin="round"
                />
                {/* Nose — Lottie Trazado 1 */}
                <path
                    d="M243.66,207.03 C252.03,208.54 260.05,202.99 261.56,194.62 L263.35,184.79 C264.86,176.43 259.31,168.41 250.94,166.89 C242.57,165.38 234.56,170.93 233.04,179.3 L231.26,189.13 C229.74,197.5 235.3,205.51 243.66,207.03Z"
                    stroke={stroke} strokeWidth="15.4" strokeLinecap="round" strokeLinejoin="round"
                />
                {/* Left eye — Lottie Grupo 2 Trazado 1 */}
                <line
                    x1={223.334 - dx * ed * es} y1={156.769 - dy * ed * es}
                    x2={223.334 + dx * ed * es} y2={156.769 + dy * ed * es}
                    stroke={eyeStroke} strokeWidth="15.4" strokeLinecap="round"
                />
                {/* Right eye — Lottie Grupo 2 Trazado 2 */}
                <line
                    x1={280.34 + dx * ed * es} y1={167.102 - dy * ed * es}
                    x2={280.34 - dx * ed * es} y2={167.102 + dy * ed * es}
                    stroke={eyeStroke} strokeWidth="15.4" strokeLinecap="round"
                />
            </g>
        </svg>
    );
};

/* ─────────────────────────────────────────────
   Lottie Koala — full body animation, used
   ONLY for loading / directing states.
   ───────────────────────────────────────────── */
const KoalaLottie: React.FC<{ size: number; mood: PosteyMood; dark: boolean; className: string }> = ({
    size, mood, dark, className
}) => {
    const [anim, setAnim] = useState<{ data: any; speed: number; direction: 1 | -1 } | null>(null);
    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        let cancelled = false;
        const koalaMood: KoalaMood = mood === 'directing' ? 'directing' :
            mood === 'celebrating' ? 'celebrating' : 'idle';
        getKoalaAnimation(koalaMood, dark).then((result) => {
            if (!cancelled) setAnim(result);
        });
        return () => { cancelled = true; };
    }, [mood, dark]);

    useEffect(() => {
        if (lottieRef.current && anim) {
            lottieRef.current.setSpeed(anim.speed);
            lottieRef.current.setDirection(anim.direction);
        }
    }, [anim]);

    if (!anim) {
        return <div style={{ width: size, height: size }} className={className} />;
    }

    return (
        <div style={{ width: size, height: size }} className={className}>
            <Lottie
                lottieRef={lottieRef}
                animationData={anim.data}
                loop
                autoplay
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

/* ─────────────────────────────────────────────
   Postey — main export. Picks the right
   renderer based on mood.
   ───────────────────────────────────────────── */
const Postey: React.FC<PosteyProps> = ({
    size = 48,
    mood = 'idle',
    animate = true,
    className = '',
    dark = false,
}) => {
    // Use the full Lottie animation only for loading states
    const useLottie = mood === 'directing';

    if (useLottie) {
        return <KoalaLottie size={size} mood={mood} dark={dark} className={className} />;
    }

    return <KoalaFace size={size} mood={mood} dark={dark} className={className} />;
};

export default Postey;
