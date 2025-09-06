import React from 'react';

export const Header: React.FC = () => (
    <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-2">
            音频静音修剪器
        </h1>
        <p className="text-lg text-gray-400">
            自动缩短音频文件中的静音部分。
        </p>
    </header>
);