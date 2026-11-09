/*
 * A built-in soundtrack, synthesised live with the Web Audio API - no audio
 * files, so nothing to license or download. Two moods; platforms also let
 * sellers swap in a trending sound when they post.
 */

export type SoundStyle = "off" | "upbeat" | "chill";

const CHORDS = [
	[261.63, 329.63, 392.0], // C
	[220.0, 261.63, 329.63], // Am
	[174.61, 220.0, 261.63], // F
	[196.0, 246.94, 293.66], // G
];

function noiseBuffer(ctx: BaseAudioContext) {
	const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
	return buffer;
}

/**
 * Schedule `seconds` of music into `destination`, starting at `ctx.currentTime + delay`.
 * Returns a stop function (for cancelling a preview or a render).
 */
export function playSoundtrack(ctx: AudioContext, destination: AudioNode, style: Exclude<SoundStyle, "off">, seconds: number, delay = 0.05) {
	const start = ctx.currentTime + delay;
	const end = start + seconds;
	const master = ctx.createGain();
	master.gain.setValueAtTime(0, start);
	master.gain.linearRampToValueAtTime(style === "upbeat" ? 0.55 : 0.45, start + 0.3);
	master.gain.setValueAtTime(style === "upbeat" ? 0.55 : 0.45, Math.max(start + 0.3, end - 0.9));
	master.gain.linearRampToValueAtTime(0, end);
	master.connect(destination);

	const bpm = style === "upbeat" ? 116 : 82;
	const beat = 60 / bpm;
	const noise = noiseBuffer(ctx);
	const nodes: AudioScheduledSourceNode[] = [];

	for (let t = start, n = 0; t < end; t += beat, n += 1) {
		// Kick on every beat (upbeat) or on 1 and 3 (chill).
		if (style === "upbeat" || n % 2 === 0) {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.frequency.setValueAtTime(140, t);
			osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
			gain.gain.setValueAtTime(style === "upbeat" ? 0.9 : 0.6, t);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
			osc.connect(gain).connect(master);
			osc.start(t);
			osc.stop(t + 0.22);
			nodes.push(osc);
		}
		// Off-beat hats (upbeat) or a soft shaker (chill).
		const hat = ctx.createBufferSource();
		hat.buffer = noise;
		const hp = ctx.createBiquadFilter();
		hp.type = "highpass";
		hp.frequency.value = style === "upbeat" ? 7000 : 5000;
		const hg = ctx.createGain();
		const ht = t + beat / 2;
		hg.gain.setValueAtTime(style === "upbeat" ? 0.25 : 0.1, ht);
		hg.gain.exponentialRampToValueAtTime(0.001, ht + 0.06);
		hat.connect(hp).connect(hg).connect(master);
		hat.start(ht);
		hat.stop(ht + 0.08);
		nodes.push(hat);
		// A chord pad every bar.
		if (n % 4 === 0) {
			const chord = CHORDS[(n / 4) % CHORDS.length];
			const lp = ctx.createBiquadFilter();
			lp.type = "lowpass";
			lp.frequency.value = style === "upbeat" ? 1800 : 1100;
			const pg = ctx.createGain();
			pg.gain.setValueAtTime(0, t);
			pg.gain.linearRampToValueAtTime(0.09, t + 0.08);
			pg.gain.linearRampToValueAtTime(0.0, t + beat * 4);
			lp.connect(pg).connect(master);
			for (const freq of chord) {
				const osc = ctx.createOscillator();
				osc.type = style === "upbeat" ? "sawtooth" : "triangle";
				osc.frequency.value = freq / 2;
				osc.connect(lp);
				osc.start(t);
				osc.stop(Math.min(end, t + beat * 4));
				nodes.push(osc);
			}
		}
	}

	return () => {
		for (const node of nodes) {
			try {
				node.stop();
			} catch {
				// Already stopped.
			}
		}
		master.disconnect();
	};
}
