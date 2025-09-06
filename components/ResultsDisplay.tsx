import React from 'react';
import { AudioPlayer } from './AudioPlayer';
import { DownloadIcon, RefreshIcon } from './Icons';

interface ResultsDisplayProps {
    processedAudioUrl: string;
    originalDuration: number;
    processedDuration: number;
    onDownload: () => void;
    onReset: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
    processedAudioUrl,
    originalDuration,
    processedDuration,
    onDownload,
    onReset
}) => {
    const timeSaved = originalDuration - processedDuration;
    const percentageSaved = (timeSaved / originalDuration) * 100;

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = (seconds % 60).toFixed(1);
        return `${minutes}:${remainingSeconds.padStart(4, '0')}`;
    };

    return (
        <div className="mt-6 animate-fade-in">
            <h3 className="text-xl font-semibold mb-4">处理结果</h3>
            <AudioPlayer src={processedAudioUrl} title="修剪后的音频" />

            <div className="my-6 p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                <h4 className="font-semibold text-lg text-cyan-400 mb-3">统计数据</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-400">原始长度</p>
                        <p className="text-xl font-bold">{formatDuration(originalDuration)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">新的长度</p>
                        <p className="text-xl font-bold">{formatDuration(processedDuration)}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <p className="text-sm text-gray-400">节省时间</p>
                        <p className="text-xl font-bold text-green-400">
                            {formatDuration(timeSaved)} ({percentageSaved.toFixed(1)}%)
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onDownload}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center"
                >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    下载 WAV
                </button>
                <button
                    onClick={onReset}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center"
                >
                    <RefreshIcon className="w-5 h-5 mr-2" />
                    处理另一个文件
                </button>
            </div>
        </div>
    );
};