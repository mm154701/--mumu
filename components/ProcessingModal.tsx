import React from 'react';
import { SpinnerIcon } from './Icons';

interface ProcessingModalProps {
    isOpen: boolean;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({ isOpen }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 transition-opacity">
            <div className="flex items-center justify-center text-white">
                <SpinnerIcon className="w-12 h-12 mr-4" />
                <div>
                    <h2 className="text-2xl font-bold">正在处理音频...</h2>
                    <p className="text-gray-300">请稍候，这可能需要一些时间。</p>
                </div>
            </div>
        </div>
    );
};