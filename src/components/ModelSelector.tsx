'use client';

import React from 'react';
import { AI_MODELS, AIModel } from '@/constants/ai';

interface ModelSelectorProps {
    selectedModel: string;
    onModelChange: (model: AIModel) => void;
    disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModel,
    onModelChange,
    disabled = false,
}) => {
    const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const model = AI_MODELS.find(m => m.id === e.target.value);
        if (model) {
            onModelChange(model);
        }
    };

    // Group models by provider
    const geminiModels = AI_MODELS.filter(m => m.provider === 'gemini');
    const openRouterModels = AI_MODELS.filter(m => m.provider === 'openrouter');

    return (
        <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
                <select
                    value={selectedModel}
                    onChange={handleChange}
                    disabled={disabled}
                    className={`
                        appearance-none
                        bg-white/10 backdrop-blur-md
                        border border-white/20
                        text-white text-[10px] sm:text-xs md:text-sm
                        rounded-lg sm:rounded-xl
                        px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 pr-7 sm:pr-8 md:pr-10
                        cursor-pointer
                        transition-all duration-300
                        hover:bg-white/15 hover:border-white/30
                        focus:outline-none focus:ring-2 focus:ring-red-500/50
                        disabled:opacity-50 disabled:cursor-not-allowed
                        max-w-[140px] sm:max-w-[180px] md:max-w-none
                        truncate
                    `}
                >
                    <optgroup label="Google Gemini" className="bg-slate-800 text-white">
                        {geminiModels.map((model) => (
                            <option
                                key={model.id}
                                value={model.id}
                                className="bg-slate-800 text-white py-2"
                            >
                                {model.name} {model.isFree ? '(Free)' : ''}
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="OpenRouter" className="bg-slate-800 text-white">
                        {openRouterModels.map((model) => (
                            <option
                                key={model.id}
                                value={model.id}
                                className="bg-slate-800 text-white py-2"
                            >
                                {model.name} {model.isFree ? '(Free)' : ''}
                            </option>
                        ))}
                    </optgroup>
                </select>

                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                    <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-white/60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </div>

            {/* Provider badge - hidden on very small screens */}
            <div
                className={`
                    hidden sm:block
                    px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium
                    ${currentModel.provider === 'gemini'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }
                `}
            >
                {currentModel.provider === 'gemini' ? 'Gemini' : 'OpenRouter'}
            </div>
        </div>
    );
};

export default ModelSelector;
