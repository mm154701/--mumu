import React from 'react';

interface AudioPlayerProps {
    src: string;
    title: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title }) => (
    <div className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3">
        <p className="text-sm font-semibold text-gray-300 mb-2">{title}</p>
        <audio controls src={src} className="w-full">
            您的浏览器不支持音频元素。
        </audio>
    </div>
);