import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AudioPlayer } from './components/AudioPlayer';
import { ProcessingModal } from './components/ProcessingModal';
import { SettingsPanel } from './components/SettingsPanel';
import { ResultsDisplay } from './components/ResultsDisplay';
import { processAudio, bufferToWave } from './services/audioProcessor';
import { Footer } from './components/Footer';

const App: React.FC = () => {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalAudioBuffer, setOriginalAudioBuffer] = useState<AudioBuffer | null>(null);
    const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
    const [processedAudioBuffer, setProcessedAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const [silenceThreshold, setSilenceThreshold] = useState<number>(-40);
    const [minSilenceDuration, setMinSilenceDuration] = useState<number>(0.5);
    const [padding, setPadding] = useState<number>(0.1);
    const [newSilenceDuration, setNewSilenceDuration] = useState<number>(0.2);

    const originalAudioUrl = useMemo(() => {
        if (!originalFile) return null;
        return URL.createObjectURL(originalFile);
    }, [originalFile]);

    const handleFileSelect = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setOriginalFile(file);
        setProcessedAudioUrl(null);
        setProcessedBlob(null);
        setProcessedAudioBuffer(null);

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setOriginalAudioBuffer(decodedBuffer);
        } catch (err) {
            console.error("Error decoding audio file:", err);
            setError("无法处理所选文件。请尝试其他音频文件（例如 MP3、WAV）。");
            setOriginalFile(null);
            setOriginalAudioBuffer(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleProcessAudio = useCallback(async () => {
        if (!originalAudioBuffer) {
            setError("未加载要处理的音频文件。");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // Using a timeout to ensure the UI updates to show the loading modal
            await new Promise(resolve => setTimeout(resolve, 50));

            const processedBuffer = await processAudio(originalAudioBuffer, {
                threshold: silenceThreshold,
                minSilenceDuration: minSilenceDuration,
                padding: padding,
                newSilenceDuration: newSilenceDuration,
            });

            setProcessedAudioBuffer(processedBuffer);

            if(processedBuffer.length === 0) {
                setError("处理结果为空音频文件。请尝试调整静音阈值。");
                setIsLoading(false);
                return;
            }

            const wavBlob = bufferToWave(processedBuffer);
            setProcessedBlob(wavBlob);
            setProcessedAudioUrl(URL.createObjectURL(wavBlob));
        } catch (err) {
            console.error("Error processing audio:", err);
            setError("处理过程中发生意外错误。");
        } finally {
            setIsLoading(false);
        }
    }, [originalAudioBuffer, silenceThreshold, minSilenceDuration, padding, newSilenceDuration]);

    const handleDownload = () => {
        if (!processedBlob || !originalFile) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(processedBlob);
        const originalName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.'));
        link.download = `${originalName}_trimmed.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetState = () => {
        setOriginalFile(null);
        setOriginalAudioBuffer(null);
        setProcessedAudioUrl(null);
        setProcessedBlob(null);
        setProcessedAudioBuffer(null);
        setError(null);
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
            <ProcessingModal isOpen={isLoading} />
            <div className="w-full max-w-3xl">
                <Header />
                <main className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
                    {!originalFile && <FileUpload onFileSelect={handleFileSelect} />}
                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-4" role="alert">
                            <strong className="font-bold">错误: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    {originalFile && (
                        <>
                            <div className="mb-6">
                               <p className="text-center text-gray-400 mb-4">
                                  已加载: <span className="font-semibold text-cyan-400">{originalFile.name}</span>
                                </p>
                                {originalAudioUrl && <AudioPlayer src={originalAudioUrl} title="原始音频" />}
                            </div>

                            <SettingsPanel
                                silenceThreshold={silenceThreshold}
                                setSilenceThreshold={setSilenceThreshold}
                                minSilenceDuration={minSilenceDuration}
                                setMinSilenceDuration={setMinSilenceDuration}
                                padding={padding}
                                setPadding={setPadding}
                                newSilenceDuration={newSilenceDuration}
                                setNewSilenceDuration={setNewSilenceDuration}
                                onProcess={handleProcessAudio}
                                isProcessing={isLoading}
                            />

                            {processedAudioUrl && originalAudioBuffer && processedAudioBuffer && (
                                <ResultsDisplay
                                    processedAudioUrl={processedAudioUrl}
                                    originalDuration={originalAudioBuffer.duration}
                                    processedDuration={processedAudioBuffer.duration}
                                    onDownload={handleDownload}
                                    onReset={resetState}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default App;