import React from 'react';
import { CogIcon } from './Icons';

interface SettingsPanelProps {
    silenceThreshold: number;
    setSilenceThreshold: (value: number) => void;
    minSilenceDuration: number;
    setMinSilenceDuration: (value: number) => void;
    padding: number;
    setPadding: (value: number) => void;
    newSilenceDuration: number;
    setNewSilenceDuration: (value: number) => void;
    onProcess: () => void;
    isProcessing: boolean;
}

// Slider for dB value (no text input)
const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; description: string; }> = ({ label, value, min, max, step, unit, onChange, description }) => (
    <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-300">
            {label}: <span className="font-bold text-cyan-400">{value.toFixed(0)}{unit}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
);

// New component combining a slider and a number input for millisecond values
const SliderWithInput: React.FC<{
    label: string;
    value: number; // in seconds
    min: number;   // in ms for slider
    max: number;   // in ms for slider and input
    step: number;  // in ms for slider
    onChange: (value: number) => void; // expects seconds
    description: string;
}> = ({ label, value, min, max, step, onChange, description }) => {
    const valueInMs = Math.round(value * 1000);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValueInMs = Number(e.target.value);
        onChange(newValueInMs / 1000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        if (rawValue === '') {
            onChange(0);
            return;
        }

        const newValueInMs = parseInt(rawValue, 10);
        if (!isNaN(newValueInMs)) {
            // Clamp value between 0 and max.
            const clampedValue = Math.max(0, Math.min(max, newValueInMs));
            onChange(clampedValue / 1000);
        }
    };
    
    return (
        <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-300">
                {label}
            </label>
            <div className="flex items-center gap-4">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={valueInMs}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="relative flex-shrink-0">
                    <input
                        type="number"
                        value={valueInMs}
                        min={0}
                        max={max}
                        step={1} // Allow any integer value
                        onChange={handleInputChange}
                        onFocus={(e) => e.target.select()} // Select all text on focus
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-28 pl-3 pr-10 py-2.5"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 pointer-events-none">ms</span>
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
    );
};


export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    silenceThreshold,
    setSilenceThreshold,
    minSilenceDuration,
    setMinSilenceDuration,
    padding,
    setPadding,
    newSilenceDuration,
    setNewSilenceDuration,
    onProcess,
    isProcessing
}) => (
    <div className="border-t border-b border-gray-700 my-6 py-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center"><CogIcon className="w-6 h-6 mr-2 text-cyan-400"/>处理设置</h3>
        <div className="grid grid-cols-1 gap-4">
            <Slider
                label="静音阈值"
                value={silenceThreshold}
                min={-60}
                max={-20}
                step={1}
                unit="dB"
                onChange={(e) => setSilenceThreshold(Number(e.target.value))}
                description="低于此分贝的声音将被视为空白。数值越低，检测越严格。"
            />
            <SliderWithInput
                label="最小静音时长"
                value={minSilenceDuration}
                min={0}
                max={2000}
                step={50}
                onChange={setMinSilenceDuration}
                description="短于此时长的静音将被保留。有助于保持自然的停顿。"
            />
             <SliderWithInput
                label="静音填充"
                value={padding}
                min={0}
                max={500}
                step={10}
                onChange={setPadding}
                description="在每个音频片段的开头和结尾添加少量静音，以防止声音突然中断。"
            />
            <SliderWithInput
                label="新静音间隔"
                value={newSilenceDuration}
                min={0}
                max={1000}
                step={50}
                onChange={setNewSilenceDuration}
                description="在保留的音频片段之间插入的静音时长。"
            />
        </div>
        <button
            onClick={onProcess}
            disabled={isProcessing}
            className="mt-6 w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
            {isProcessing ? '处理中...' : '修剪静音'}
        </button>
    </div>
);