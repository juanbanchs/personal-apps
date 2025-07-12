import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

// Color palette with 24 colors - more variety
const COLOR_PALETTE = [
    '#000000', '#1a1a1a', '#333333', '#4a4a4a',
    '#666666', '#808080', '#999999', '#b3b3b3',
    '#cccccc', '#e6e6e6', '#f0f0f0', '#ffffff',
    '#ff6b6b', '#ff9500', '#ffd700', '#90ee90',
    '#4ecdc4', '#45b7d1', '#6a5acd', '#da70d6',
    '#8b4513', '#228b22', '#ff1493', '#00ced1'
];

// Language options
const LANGUAGES = {
    'auto': 'Auto Detect',
    'en-US': 'English',
    'zh-CN': 'Chinese',
    'es-ES': 'Spanish',
    'fr-FR': 'French',
    'de-DE': 'German',
    'it-IT': 'Italian',
    'pt-PT': 'Portuguese',
    'ru-RU': 'Russian',
    'ja-JP': 'Japanese',
    'ko-KR': 'Korean',
    'ar-SA': 'Arabic',
    'hi-IN': 'Hindi'
};

function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [currentText, setCurrentText] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('#000000');
    const [sourceLanguage, setSourceLanguage] = useState('en-US');
    const [targetLanguage, setTargetLanguage] = useState('zh-CN');
    const [showLanguageSelect, setShowLanguageSelect] = useState(false);
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const [recognition, setRecognition] = useState(null);
    const textContainerRef = useRef(null);
    const currentTranscriptRef = useRef([]);
    const currentTextRef = useRef('');
    const currentLanguageRef = useRef('en-US');

    // Get text color based on background
    const getTextColor = useCallback((bgColor) => {
        const hex = bgColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#333333' : '#e6e6e6';
    }, []);

    // Convert locale codes to 2-letter language codes for translation API
    const getLanguageCode = (locale) => {
        const codeMap = {
            'en-US': 'en',
            'zh-CN': 'zh',
            'es-ES': 'es',
            'fr-FR': 'fr',
            'de-DE': 'de',
            'it-IT': 'it',
            'pt-PT': 'pt',
            'ru-RU': 'ru',
            'ja-JP': 'ja',
            'ko-KR': 'ko',
            'ar-SA': 'ar',
            'hi-IN': 'hi'
        };
        return codeMap[locale] || locale.split('-')[0];
    };

    // Translate text using MyMemory API
    const translateText = useCallback(async (text, fromLang, toLang) => {
        if (!text || !text.trim() || fromLang === toLang) return text;

        try {
            const fromCode = getLanguageCode(fromLang);
            const toCode = getLanguageCode(toLang);

            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${fromCode}|${toCode}`;
            console.log("Translation URL:", url);
            console.log(`Translating "${text}" from ${fromLang}(${fromCode}) to ${toLang}(${toCode})`);

            const response = await fetch(url);
            const data = await response.json();

            console.log("Translation API response:", data);

            if (data && data.responseData && data.responseData.translatedText) {
                return data.responseData.translatedText;
            }

            console.warn("No translation found, returning original text");
            return text;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }, []);

    // Auto-detect language from text
    const detectLanguage = useCallback(async (text) => {
        if (!text || !text.trim()) return 'en-US';

        try {
            // Simple language detection based on common words and patterns
            const lowerText = text.toLowerCase().trim();
            console.log("Detecting language for:", lowerText);

            // Spanish detection - better patterns
            const spanishWords = ['hola', 'gracias', 'por favor', 'buenos días', 'buenas tardes', 'cómo estás',
                'arreglamos', 'qué', 'dónde', 'cuándo', 'entonces', 'ahora', 'siempre', 'nunca',
                'también', 'todavía', 'después', 'antes', 'mientras', 'aunque'];
            const spanishPattern = /\b(lo|la|el|los|las|un|una|del|al|con|por|para|desde|hasta|entre|sobre|bajo|sin|según)\b/;

            const hasSpanishWords = spanishWords.some(word => lowerText.includes(word));
            const hasSpanishPattern = spanishPattern.test(lowerText);

            if (hasSpanishWords || hasSpanishPattern) {
                console.log("Detected Spanish due to words/patterns");
                return 'es-ES';
            }

            // French detection  
            if (lowerText.includes('bonjour') || lowerText.includes('merci') || lowerText.includes('s\'il vous plaît') ||
                lowerText.includes('comment allez-vous') || lowerText.includes('au revoir')) {
                console.log("Detected French");
                return 'fr-FR';
            }

            // German detection
            if (lowerText.includes('hallo') || lowerText.includes('danke') || lowerText.includes('bitte') ||
                lowerText.includes('guten tag') || lowerText.includes('wie geht es')) {
                console.log("Detected German");
                return 'de-DE';
            }

            // Italian detection
            if (lowerText.includes('ciao') || lowerText.includes('grazie') || lowerText.includes('prego') ||
                lowerText.includes('buongiorno') || lowerText.includes('come stai')) {
                console.log("Detected Italian");
                return 'it-IT';
            }

            // Portuguese detection
            if (lowerText.includes('olá') || lowerText.includes('obrigado') || lowerText.includes('por favor') ||
                lowerText.includes('bom dia') || lowerText.includes('como você está')) {
                console.log("Detected Portuguese");
                return 'pt-PT';
            }

            // Chinese detection (basic)
            if (/[\u4e00-\u9fff]/.test(text)) {
                console.log("Detected Chinese");
                return 'zh-CN';
            }

            // Default to English
            console.log("Defaulting to English");
            return 'en-US';
        } catch (error) {
            console.error('Language detection error:', error);
            return 'en-US';
        }
    }, []);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
            const speechRecognition = new window.webkitSpeechRecognition();
            speechRecognition.continuous = true;
            speechRecognition.interimResults = true;
            speechRecognition.lang = sourceLanguage === "auto" ? "en-US" : sourceLanguage;

            speechRecognition.onresult = (event) => {
                console.log("Speech recognition event received:", event);
                let finalTranscript = "";
                let interimTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    console.log(`Result ${i}: "${transcript}" (final: ${event.results[i].isFinal})`);
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                console.log("Final:", finalTranscript, "Interim:", interimTranscript);

                // Show interim results while speaking
                if (interimTranscript && interimTranscript.trim()) {
                    setCurrentText(interimTranscript.trim());
                }

                if (finalTranscript && finalTranscript.trim()) {
                    console.log("Processing final transcript:", finalTranscript);

                    // Don't block the UI - add the original text immediately
                    const newEntry = {
                        id: Date.now(),
                        original: finalTranscript.trim(),
                        translated: 'Translating...', // Temporary placeholder
                        language: 'en-US',
                        timestamp: new Date(),
                        targetLanguage: targetLanguage
                    };

                    console.log("Adding entry:", newEntry);
                    currentTranscriptRef.current = [...currentTranscriptRef.current, newEntry];
                    setTranscript([...currentTranscriptRef.current]);
                    setCurrentText('');
                    currentTextRef.current = '';

                    // Translate in background without blocking
                    (async () => {
                        try {
                            // Use auto-detection only if source language is set to "auto"
                            const fromLang = sourceLanguage === 'auto'
                                ? await detectLanguage(finalTranscript)
                                : sourceLanguage;

                            console.log("Source language setting:", sourceLanguage);
                            console.log("Using language:", fromLang);
                            console.log("Target language:", targetLanguage);

                            // Don't translate if source and target are the same
                            if (getLanguageCode(fromLang) === getLanguageCode(targetLanguage)) {
                                console.log("Same language detected, skipping translation");
                                const updatedTranscript = currentTranscriptRef.current.map(entry =>
                                    entry.id === newEntry.id
                                        ? { ...entry, translated: finalTranscript.trim(), language: fromLang }
                                        : entry
                                );
                                currentTranscriptRef.current = updatedTranscript;
                                setTranscript(updatedTranscript);
                                return;
                            }

                            const translatedText = await translateText(finalTranscript, fromLang, targetLanguage);
                            console.log("Original:", finalTranscript);
                            console.log("Translation result:", translatedText);

                            // Update the entry with the translation
                            const updatedTranscript = currentTranscriptRef.current.map(entry =>
                                entry.id === newEntry.id
                                    ? { ...entry, translated: translatedText || finalTranscript.trim(), language: fromLang }
                                    : entry
                            );
                            currentTranscriptRef.current = updatedTranscript;
                            setTranscript(updatedTranscript);
                            console.log("Translation completed successfully");
                        } catch (error) {
                            console.error("Translation failed:", error);
                            // Fallback to original text if translation fails
                            const updatedTranscript = currentTranscriptRef.current.map(entry =>
                                entry.id === newEntry.id
                                    ? { ...entry, translated: finalTranscript.trim() }
                                    : entry
                            );
                            currentTranscriptRef.current = updatedTranscript;
                            setTranscript(updatedTranscript);
                        }
                    })();
                }
            };

            speechRecognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
            };

            speechRecognition.onstart = () => {
                console.log("Speech recognition started");
            };

            speechRecognition.onend = () => {
                console.log("Speech recognition ended");
            };

            setRecognition(speechRecognition);
        } else {
            console.error("Speech recognition not supported");
        }
    }, [sourceLanguage, targetLanguage]);

    // Auto-scroll to bottom when new content is added
    useEffect(() => {
        if (isAutoScrolling && textContainerRef.current) {
            textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
        }
    }, [transcript, currentText, isAutoScrolling]);

    // Handle recording toggle
    const toggleRecording = () => {
        if (!recognition) {
            alert("Speech recognition not supported in this browser");
            return;
        }

        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        } else {
            recognition.start();
            setIsRecording(true);
        }
    };

    // Handle language change
    const handleLanguageChange = async (type, language) => {
        console.log(`Language change: ${type} -> ${language}`);
        if (type === 'source') {
            setSourceLanguage(language);
            console.log("Source language set to:", language);
        } else {
            setTargetLanguage(language);
            console.log("Target language set to:", language);
            // Don't re-translate existing text - only new text will use the new target language
            // This preserves the original translations as they were when spoken
        }
        setShowLanguageSelect(false);
    };

    // Handle scroll
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setIsAutoScrolling(isAtBottom);
    };

    // Jump to bottom
    const jumpToBottom = () => {
        if (textContainerRef.current) {
            textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
            setIsAutoScrolling(true);
        }
    };

    const textColor = getTextColor(backgroundColor);

    return (
        <div className="app" style={{ backgroundColor, color: textColor }}>
            {/* Main text display area */}
            <div
                ref={textContainerRef}
                className="text-container"
                onScroll={handleScroll}
                style={{
                    '--scrollbar-color': textColor,
                    '--bg-color': backgroundColor
                }}
            >
                <div className="text-content">
                    {transcript.map((entry) => (
                        <div key={entry.id} className="text-block">
                            <div className="original-text">{entry.original}</div>
                            <div className="translated-text">{entry.translated}</div>
                        </div>
                    ))}
                    {currentText && (
                        <div className="text-block current">
                            <div className="original-text">{currentText}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Jump to bottom button */}
            {!isAutoScrolling && (
                <button
                    className="jump-to-bottom"
                    onClick={jumpToBottom}
                    style={{
                        backgroundColor: textColor,
                        color: backgroundColor
                    }}
                >
                    ↓
                </button>
            )}

            {/* Control panel */}
            <div className="control-panel">
                {/* Language selector */}
                <div className="language-section">
                    <button
                        className="language-button"
                        onClick={() => {
                            // Stop recording when opening language selector
                            if (!showLanguageSelect && isRecording && recognition) {
                                console.log("Stopping recording to change language");
                                recognition.stop();
                                setIsRecording(false);
                            }
                            setShowLanguageSelect(!showLanguageSelect);
                        }}
                        style={{
                            backgroundColor: textColor,
                            color: backgroundColor
                        }}
                    >
                        <span>{LANGUAGES[sourceLanguage]}</span>
                        <span>→</span>
                        <span>{LANGUAGES[targetLanguage]}</span>
                    </button>

                    {showLanguageSelect && (
                        <div className="language-dropdown" style={{ backgroundColor: textColor, color: backgroundColor }}>
                            <div className="language-column">
                                <h4>From</h4>
                                {Object.entries(LANGUAGES).slice(0, 8).map(([code, name]) => (
                                    <button
                                        key={code}
                                        className={sourceLanguage === code ? 'active' : ''}
                                        onClick={() => handleLanguageChange('source', code)}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                            <div className="language-column">
                                <h4>To</h4>
                                {Object.entries(LANGUAGES).slice(1).map(([code, name]) => (
                                    <button
                                        key={code}
                                        className={targetLanguage === code ? 'active' : ''}
                                        onClick={() => handleLanguageChange('target', code)}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Record button */}
                <button
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                >
                    {isRecording ? (
                        <div className="pause-icon">
                            <div className="bar"></div>
                            <div className="bar"></div>
                        </div>
                    ) : (
                        <div className="play-icon"></div>
                    )}
                </button>

                {/* Color palette */}
                <div className="color-section">
                    <button
                        className="color-button"
                        onClick={() => setShowColorPalette(!showColorPalette)}
                        style={{
                            backgroundColor: textColor,
                            color: backgroundColor
                        }}
                    >
                        <div className="color-preview" style={{ backgroundColor }}></div>
                    </button>

                    {showColorPalette && (
                        <div className="color-palette" style={{ backgroundColor: textColor }}>
                            {COLOR_PALETTE.map((color) => (
                                <button
                                    key={color}
                                    className={`color-option ${backgroundColor === color ? 'active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                        setBackgroundColor(color);
                                        setShowColorPalette(false);
                                    }}
                                ></button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App; 