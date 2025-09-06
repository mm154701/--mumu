
interface ProcessAudioOptions {
    threshold: number; // in dB
    minSilenceDuration: number; // in seconds
    padding: number; // in seconds
    newSilenceDuration: number; // in seconds
}

// Splits the audio buffer into non-silent chunks based on the provided options.
const getAudioChunks = (audioBuffer: AudioBuffer, options: ProcessAudioOptions): { start: number; end: number }[] => {
    const { threshold, minSilenceDuration, padding } = options;
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0); // Process on first channel

    const amplitudeThreshold = Math.pow(10, threshold / 20);
    const minSilenceSamples = sampleRate * minSilenceDuration;
    const paddingSamples = Math.floor(sampleRate * padding);

    // 1. Find all silent sections
    const silentIntervals = [];
    let silenceStart = -1;
    for (let i = 0; i < channelData.length; i++) {
        const isSilent = Math.abs(channelData[i]) < amplitudeThreshold;
        if (isSilent && silenceStart < 0) {
            silenceStart = i;
        } else if (!isSilent && silenceStart >= 0) {
            silentIntervals.push({ start: silenceStart, end: i });
            silenceStart = -1;
        }
    }
    if (silenceStart >= 0) {
        silentIntervals.push({ start: silenceStart, end: channelData.length });
    }

    // 2. Filter for silences that are long enough to be trimmed
    const longSilences = silentIntervals.filter(
        interval => (interval.end - interval.start) >= minSilenceSamples
    );

    if (longSilences.length === 0) {
        // If no long silences, the whole audio is one chunk
        if (channelData.length > 0) return [{ start: 0, end: channelData.length }];
        return [];
    }
    
    // 3. Create chunks from the sections *between* the long silences
    const chunks: { start: number; end: number }[] = [];
    let lastChunkEnd = 0;
    
    for (const silence of longSilences) {
        const chunkEnd = silence.start;
        if (chunkEnd > lastChunkEnd) {
             chunks.push({ start: lastChunkEnd, end: chunkEnd });
        }
        lastChunkEnd = silence.end;
    }

    // Add the final chunk after the last long silence
    if (lastChunkEnd < channelData.length) {
        chunks.push({ start: lastChunkEnd, end: channelData.length });
    }
    
    // 4. Apply padding to the raw chunks
    const paddedChunks = chunks.map(chunk => ({
        start: Math.max(0, chunk.start - paddingSamples),
        end: Math.min(channelData.length, chunk.end + paddingSamples)
    }));


    // 5. Merge any overlapping chunks that might have been created by padding
    if (paddedChunks.length < 2) return paddedChunks;

    const mergedChunks = [paddedChunks[0]];
    for (let i = 1; i < paddedChunks.length; i++) {
        const last = mergedChunks[mergedChunks.length - 1];
        const current = paddedChunks[i];
        if (current.start < last.end) {
            last.end = Math.max(last.end, current.end);
        } else {
            mergedChunks.push(current);
        }
    }

    return mergedChunks;
};


export const processAudio = async (
    audioBuffer: AudioBuffer,
    options: ProcessAudioOptions
): Promise<AudioBuffer> => {
    const { newSilenceDuration } = options;
    const chunks = getAudioChunks(audioBuffer, options);

    if (chunks.length === 0) {
        // Return an empty buffer if no sound is detected
        const emptyContext = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(1, 1, audioBuffer.sampleRate);
        return emptyContext.startRendering();
    }

    const totalChunkSamples = chunks.reduce((sum, chunk) => sum + (chunk.end - chunk.start), 0);
    const silenceSamples = Math.floor(newSilenceDuration * audioBuffer.sampleRate);
    const totalSilenceSamples = chunks.length > 1 ? (chunks.length - 1) * silenceSamples : 0;
    const totalSamples = totalChunkSamples + totalSilenceSamples;

    if (totalSamples <= 0) {
        const emptyContext = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(1, 1, audioBuffer.sampleRate);
        return emptyContext.startRendering();
    }

    const offlineContext = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
        audioBuffer.numberOfChannels,
        totalSamples,
        audioBuffer.sampleRate
    );

    let currentPosition = 0;
    for (const [index, chunk] of chunks.entries()) {
        const durationSamples = chunk.end - chunk.start;
        if (durationSamples <= 0) continue;

        const chunkBuffer = offlineContext.createBuffer(
            audioBuffer.numberOfChannels,
            durationSamples,
            audioBuffer.sampleRate
        );

        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            // Ensure we don't try to get data outside the original buffer bounds
            const originalChannelData = audioBuffer.getChannelData(i);
            const slicedData = originalChannelData.slice(chunk.start, chunk.end);
            chunkBuffer.copyToChannel(slicedData, i);
        }

        const bufferSource = offlineContext.createBufferSource();
        bufferSource.buffer = chunkBuffer;
        bufferSource.connect(offlineContext.destination);
        bufferSource.start(currentPosition / audioBuffer.sampleRate);
        
        currentPosition += durationSamples;

        // Add silence gap after every chunk except the last one
        if (index < chunks.length - 1) {
            currentPosition += silenceSamples;
        }
    }

    return await offlineContext.startRendering();
};

// Converts an AudioBuffer to a WAV file Blob.
export const bufferToWave = (audioBuffer: AudioBuffer): Blob => {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels: Float32Array[] = [];
    let i: number;
    let sample: number;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(audioBuffer.sampleRate);
    setUint32(audioBuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < audioBuffer.numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: 'audio/wav' });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
};