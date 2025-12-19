// Tab switching functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        button.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
        
        // Stop recording if switching away from real-time tab
        if (targetTab !== 'realtime' && recognition && isRecording) {
            stopRecording();
        }
    });
});

// Real-time Speech Recognition
let recognition = null;
let isRecording = false;
let messageCount = 0; // Track message count for alternating speakers
let currentSentence = ''; // Track current sentence being spoken
let lastFinalTranscript = ''; // Track last final transcript to detect new sentences
////////////////////////////////////////////////////////////

// Define stopRecording function globally so it can be called from tab switching
function stopRecording() {
    if (recognition && isRecording) {
        isRecording = false;
        recognition.stop();
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
    }
}
//////////////////////////////////////////
// Function to add message to chat
function addMessageToChat(text, speaker) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Remove placeholder if exists
    const placeholder = chatMessages.querySelector('.chat-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    // Add "Today" header if this is the first message
    if (chatMessages.children.length === 0 || chatMessages.querySelector('.chat-date-header') === null) {
        const dateHeader = document.createElement('div');
        dateHeader.className = 'chat-date-header';
        dateHeader.textContent = 'Today';
        chatMessages.appendChild(dateHeader);
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${speaker}`;
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${speaker}`;
    
    const sender = document.createElement('div');
    sender.className = `message-sender ${speaker}`;
    sender.textContent = speaker === 'salesman' ? 'salesman' : 'customer';
    
    const messageText = document.createElement('p');
    messageText.className = 'message-text';
    messageText.textContent = text;
    
    const time = document.createElement('div');
    time.className = 'message-time';
    const now = new Date();
    time.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    bubble.appendChild(sender);
    bubble.appendChild(messageText);
    bubble.appendChild(time);
    
    messageDiv.appendChild(bubble);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
////////////////////////////////////
// Function to generate suggestions for customer messages
function generateSuggestions(customerMessage) {
    const suggestionsDiv = document.getElementById('suggestions');
    if (!suggestionsDiv) return;
    
    // Clear previous suggestions
    suggestionsDiv.innerHTML = '';
    
    // Analyze the customer message for context
    const lowerMessage = customerMessage.toLowerCase();
    const sentiment = analyzeSentiment(customerMessage);
    const intent = analyzeIntent(customerMessage);
    const entities = analyzeEntities(customerMessage);
    
    let suggestions = [];
    
    // Greeting/Welcome scenarios
    if (/(hi|hello|hey|good morning|good afternoon)/i.test(customerMessage)) {
        suggestions.push("Hello! Welcome to our electronics store. How can I assist you today?");
        suggestions.push("Hi! Thanks for reaching out. What can I help you find today?");
        suggestions.push("Hello! I'm here to help you find exactly what you're looking for. What brings you in today?");
    }
    
    // Product search with budget
    if (/(looking for|need|want|searching|budget|price|cost|dollar|dollars)/i.test(customerMessage)) {
        if (/(smartphone|phone|mobile|device)/i.test(customerMessage)) {
            suggestions.push("Great choice! In the 500-dollar range, the OnePlus Nord is one of the best options. It comes with a 120Hz display, fast performance, and 5G connectivity. Would you like to hear more about it?");
            suggestions.push("Excellent! For around $500, I'd recommend the OnePlus Nord or Samsung Galaxy A series. Both offer great value. Which features matter most to you?");
            suggestions.push("Perfect budget range! We have some excellent options. The OnePlus Nord offers premium features at that price point. Would you like details?");
        } else {
            suggestions.push("I'd be happy to help you find the perfect product! What specific features are you looking for?");
            suggestions.push("Great! Let me show you our best options in that price range. What's most important to you - performance, features, or design?");
        }
    }
    
    // Comparison requests
    if (intent.includes('Comparison') || /(compare|difference|vs|versus|which is better|which one)/i.test(customerMessage)) {
        if (/(oneplus|samsung|nord|galaxy)/i.test(customerMessage)) {
            suggestions.push("Of course! The OnePlus Nord offers a smoother display and a slightly faster processor, while the Samsung Galaxy A series provides better battery life and more storage variants. Both are excellent, but the Nord is usually better for performance, and Samsung is better for long usage. Would you like a recommendation based on your priorities?");
            suggestions.push("Great question! The OnePlus Nord excels in performance and display quality, while Samsung Galaxy A series offers better battery life and more storage options. What matters more to you?");
        } else {
            suggestions.push("I'd be happy to compare those options for you. What specific features would you like me to highlight?");
            suggestions.push("Let me break down the key differences for you. What's your primary use case?");
        }
    }
    
    // Positive response/interest
    if (/(yes|sure|sounds good|that sounds|interested|tell me more|more about)/i.test(customerMessage) && sentiment.sentiment === 'Positive') {
        suggestions.push("Perfect! The OnePlus Nord is an excellent pick if you want smoother multitasking and a great camera experience. Would you like to know the available offers or warranty details?");
        suggestions.push("Excellent choice! Let me provide you with all the details about pricing, features, and available offers.");
        suggestions.push("Great! I'll walk you through everything you need to know. What would you like to learn about first?");
    }
    
    // Payment and delivery inquiries
    if (/(payment|delivery|pay|shipping|emi|upi|card|cash|when|how long)/i.test(customerMessage)) {
        suggestions.push("We support UPI, card payments, EMI, and cash on delivery. For delivery, we offer standard three-day delivery or same-day express delivery in select locations. Would you like me to proceed with the purchase?");
        suggestions.push("Great question! We accept multiple payment methods including UPI, cards, EMI, and cash on delivery. Delivery options include standard 3-day or same-day express. Which works best for you?");
        suggestions.push("We offer flexible payment options - UPI, cards, EMI, and cash on delivery. Delivery is typically 3 days, or same-day express in select areas. Ready to proceed?");
    }
    
    // Purchase confirmation
    if (/(yes|go ahead|proceed|buy|purchase|order|take it)/i.test(customerMessage) && /(buy|purchase|order|proceed|go ahead)/i.test(customerMessage)) {
        suggestions.push("Great! I'll help you complete the order. Thank you for choosing our store!");
        suggestions.push("Excellent! Let me process your order right away. Thank you for your purchase!");
        suggestions.push("Perfect! I'll get everything set up for you. Is there anything else you'd like to add to your order?");
    }
    
    // Feature inquiries
    if (/(feature|specification|specs|what does|what has|tell me about)/i.test(customerMessage)) {
        suggestions.push("I'd be happy to explain all the features! The OnePlus Nord comes with a 120Hz AMOLED display, Snapdragon processor, 5G connectivity, and a triple camera setup. Would you like more details on any specific feature?");
        suggestions.push("Great question! Let me highlight the key features: premium display, fast performance, excellent cameras, and 5G support. What interests you most?");
    }
    
    // Generic professional suggestions
    if (suggestions.length === 0) {
        if (intent.includes('Inquiry')) {
            suggestions.push("I'd be happy to help with that! Let me provide you with all the information you need.");
            suggestions.push("Great question! Let me explain that in detail for you.");
        } else if (sentiment.sentiment === 'Negative') {
            suggestions.push("I understand your concern. Let me help resolve this for you right away.");
            suggestions.push("I'm sorry to hear that. How can I make this right for you?");
        } else {
            suggestions.push("Thank you for your interest! How can I assist you further today?");
            suggestions.push("I'm here to help! What would you like to know more about?");
            suggestions.push("That's a great point! Let me provide you with more information.");
        }
    }
    
    // Display suggestions (limit to 3-4)
    suggestions.slice(0, 4).forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        const suggestionText = document.createElement('p');
        suggestionText.className = 'suggestion-text';
        suggestionText.textContent = suggestion;
        suggestionItem.appendChild(suggestionText);
        suggestionsDiv.appendChild(suggestionItem);
    });
}
///////////////////
// Check if browser supports Web Speech API
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    let finalTranscript = '';
    
    recognition.onstart = () => {
        isRecording = true;
        messageCount = 0; // Reset message count
        currentSentence = '';
        lastFinalTranscript = '';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        // Clear chat and show placeholder
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '<div class="chat-placeholder"><p>Conversation started...</p><p class="chat-hint">First sentence = Salesman | Second sentence = Customer</p></div>';
        }
        
        // Clear suggestions
        const suggestionsDiv = document.getElementById('suggestions');
        if (suggestionsDiv) {
            suggestionsDiv.innerHTML = '<p class="suggestion-placeholder">Suggestions will appear here when customer speaks...</p>';
        }
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let newFinalText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
                newFinalText += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        const fullText = finalTranscript + interimTranscript;
        
        // Check if we have a new final sentence
        if (newFinalText.trim().length > 0) {
            // Determine speaker based on message count (even = salesman, odd = customer)
            const speaker = messageCount % 2 === 0 ? 'salesman' : 'customer';
            
            // Add message to chat
            addMessageToChat(newFinalText.trim(), speaker);
            
            // If customer spoke, generate suggestions
            if (speaker === 'customer') {
                generateSuggestions(newFinalText.trim());
            } else {
                // Clear suggestions when salesman speaks
                const suggestionsDiv = document.getElementById('suggestions');
                if (suggestionsDiv) {
                    suggestionsDiv.innerHTML = '<p class="suggestion-placeholder">Waiting for customer response...</p>';
                }
            }
            
            messageCount++;
            lastFinalTranscript = finalTranscript;
        }
        
        // Perform analysis on the full text
        if (fullText.trim().length > 0) {
            performAnalysis(fullText, 'realtime');
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
    };
    
    recognition.onend = () => {
        if (isRecording) {
            // Restart recognition if still recording
            try {
                recognition.start();
            } catch (e) {
                stopRecording();
            }
        }
    };
    
    startBtn.addEventListener('click', () => {
        finalTranscript = '';
        recognition.start();
    });
    
    stopBtn.addEventListener('click', () => {
        stopRecording();
    });
    
    clearBtn.addEventListener('click', () => {
        finalTranscript = '';
        messageCount = 0;
        currentSentence = '';
        lastFinalTranscript = '';
        
        // Clear chat messages
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '<div class="chat-placeholder"><p>Click "Start Recording" to begin the conversation</p><p class="chat-hint">First sentence = Salesman | Second sentence = Customer</p></div>';
        }
        
        // Clear suggestions
        const suggestionsDiv = document.getElementById('suggestions');
        if (suggestionsDiv) {
            suggestionsDiv.innerHTML = '<p class="suggestion-placeholder">Suggestions will appear here when customer speaks...</p>';
        }
        
        clearAnalysis('realtime');
    });
} else {
    // Browser doesn't support speech recognition
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '<div class="chat-placeholder"><p style="color: #8b7355;">Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.</p></div>';
    }
    document.getElementById('start-btn').disabled = true;
}

// Audio File Transcription
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const transcribeFileBtn = document.getElementById('transcribe-file-btn');
const fileTranscript = document.getElementById('file-transcript');
const clearFileBtn = document.getElementById('clear-file-btn');

let selectedFile = null;
let audioContext = null;
let mediaStreamDestination = null;
let audioElement = null;

// File input change handler
fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
});

// Drag and drop handlers
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('audio/') || file.name.endsWith('.wav'))) {
        handleFileSelect(file);
    } else {
        alert('Please select a valid audio file (.wav)');
    }
});

function handleFileSelect(file) {
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'flex';
    fileTranscript.innerHTML = '<p class="placeholder">Ready to transcribe. Click "Transcribe Audio" button...</p>';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

transcribeFileBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        alert('Please select an audio file first');
        return;
    }
    
    if (!recognition) {
        fileTranscript.innerHTML = '<p style="color: #e74c3c;">Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.</p>';
        return;
    }
    
    transcribeFileBtn.disabled = true;
    transcribeFileBtn.innerHTML = '<span class="btn-icon">⏳</span> Transcribing...';
    fileTranscript.innerHTML = '<p class="placeholder">Transcribing audio file... This may take a moment.</p>';
    
    try {
        await transcribeAudioFile(selectedFile);
    } catch (error) {
        console.error('Transcription error:', error);
        fileTranscript.innerHTML = `<p style="color: #e74c3c;">Error: ${error.message}</p>`;
    } finally {
        transcribeFileBtn.disabled = false;
        transcribeFileBtn.innerHTML = '<span class="btn-icon">🎵</span> Transcribe Audio';
    }
});


async function transcribeAudioFile(file) {
    return new Promise((resolve, reject) => {
        // Note: Web Speech API requires microphone input
        // We'll play the audio file and use the microphone to capture it
        // This requires user interaction and microphone permission
        
        const audioUrl = URL.createObjectURL(file);
        audioElement = new Audio(audioUrl);
        
        // Create a new recognition instance for file transcription
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const fileRecognition = new SpeechRecognition();
        fileRecognition.continuous = true;
        fileRecognition.interimResults = true;
        fileRecognition.lang = 'en-US';
        
        let transcriptText = '';
        let isPlaying = false;
        
        fileRecognition.onresult = (event) => {
            let interimText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    transcriptText += transcript + ' ';
                } else {
                    interimText += transcript;
                }
            }
            const fullText = transcriptText + interimText;
            fileTranscript.innerHTML = `<p>${transcriptText}<span style="color: #999;">${interimText}</span></p>`;
            
            // Perform analysis on the full text
            if (fullText.trim().length > 0) {
                performAnalysis(fullText, 'file');
            }
        };
        
        fileRecognition.onerror = (event) => {
            console.error('File transcription error:', event.error);
            if (event.error === 'no-speech') {
                // This is normal, just continue
                return;
            }
            if (event.error !== 'aborted') {
                fileTranscript.innerHTML = `<p style="color: #e74c3c;">Error: ${event.error}. Please ensure your microphone is enabled and try again.</p>`;
                reject(new Error(event.error));
            }
        };
        
        fileRecognition.onend = () => {
            if (isPlaying) {
                // Restart recognition if audio is still playing
                try {
                    fileRecognition.start();
                } catch (e) {
                    // Recognition ended, stop audio
                    if (audioElement) {
                        audioElement.pause();
                    }
                    isPlaying = false;
                }
            } else {
                // Cleanup
                URL.revokeObjectURL(audioUrl);
                if (audioContext) {
                    audioContext.close();
                }
                if (!transcriptText.trim()) {
                    fileTranscript.innerHTML = '<p class="placeholder">No speech detected. Make sure your microphone can hear the audio playback.</p>';
                }
                resolve();
            }
        };
        
        // Show instruction
        fileTranscript.innerHTML = '<p class="placeholder">Starting transcription... Please ensure your microphone is enabled and can hear the audio playback.</p>';
        
        // Start recognition first
        try {
            fileRecognition.start();
            
            // Then play audio after a short delay
            setTimeout(() => {
                audioElement.play().then(() => {
                    isPlaying = true;
                    fileTranscript.innerHTML = '<p class="placeholder">Playing audio... Transcribing...</p>';
                }).catch(error => {
                    fileRecognition.stop();
                    reject(new Error('Failed to play audio file. Please check the file format.'));
                });
            }, 500);
            
            // Handle audio end
            audioElement.onended = () => {
                isPlaying = false;
                setTimeout(() => {
                    fileRecognition.stop();
                }, 1000);
            };
            
            audioElement.onerror = (error) => {
                isPlaying = false;
                fileRecognition.stop();
                reject(new Error('Failed to play audio file. Please ensure it\'s a valid audio file.'));
            };
        } catch (error) {
            URL.revokeObjectURL(audioUrl);
            reject(new Error('Failed to start recognition. Please ensure microphone access is granted.'));
        }
    });
}

clearFileBtn.addEventListener('click', () => {
    if (audioElement) {
        audioElement.pause();
        audioElement = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    fileTranscript.innerHTML = '<p class="placeholder">Upload a .wav file to transcribe...</p>';
    fileInfo.style.display = 'none';
    selectedFile = null;
    fileInput.value = '';
    clearAnalysis('file');
});

// Analysis Functions
function performAnalysis(text, type) {
    const sentiment = analyzeSentiment(text);
    const intent = analyzeIntent(text);
    const entities = analyzeEntities(text);
    
    const prefix = type === 'realtime' ? '' : 'file-';
    
    displaySentiment(sentiment, prefix + 'sentiment-result');
    displayIntent(intent, prefix + 'intent-result');
    displayEntities(entities, prefix + 'entity-result');
}

function clearAnalysis(type) {
    const prefix = type === 'realtime' ? '' : 'file-';
    const sentimentEl = document.getElementById(prefix + 'sentiment-result');
    const intentEl = document.getElementById(prefix + 'intent-result');
    const entityEl = document.getElementById(prefix + 'entity-result');
    
    if (sentimentEl) sentimentEl.innerHTML = '<span class="analysis-placeholder">Waiting for transcription...</span>';
    if (intentEl) intentEl.innerHTML = '<span class="analysis-placeholder">Waiting for transcription...</span>';
    if (entityEl) entityEl.innerHTML = '<span class="analysis-placeholder">Waiting for transcription...</span>';
}

function analyzeSentiment(text) {
    const lowerText = text.toLowerCase();
    
    // Positive keywords
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'loved', 'perfect', 'awesome', 'brilliant', 'outstanding', 'satisfied', 'happy', 'pleased', 'impressed', 'best', 'better', 'nice', 'fine', 'thank', 'thanks', 'appreciate'];
    
    // Negative keywords
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'hated', 'disappointed', 'disappointing', 'poor', 'worst', 'worse', 'problem', 'problems', 'issue', 'issues', 'broken', 'damaged', 'defective', 'faulty', 'wrong', 'error', 'complaint', 'refund', 'return'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeCount++;
    });
    
    // Check for negation patterns
    const negationPatterns = /(not|no|never|don't|doesn't|didn't|won't|can't|cannot)\s+\w+/gi;
    const negations = lowerText.match(negationPatterns);
    
    if (negations) {
        negations.forEach(neg => {
            if (positiveWords.some(word => neg.includes(word))) {
                negativeCount++;
                positiveCount = Math.max(0, positiveCount - 1);
            }
        });
    }
    
    if (positiveCount > negativeCount && positiveCount > 0) {
        return { sentiment: 'Positive', confidence: Math.min(100, (positiveCount / (positiveCount + negativeCount + 1)) * 100) };
    } else if (negativeCount > positiveCount && negativeCount > 0) {
        return { sentiment: 'Negative', confidence: Math.min(100, (negativeCount / (positiveCount + negativeCount + 1)) * 100) };
    } else {
        return { sentiment: 'Neutral', confidence: 50 };
    }
}

function analyzeIntent(text) {
    const lowerText = text.toLowerCase();
    const intents = [];
    
    // Buying intent
    if (/(buy|purchase|order|want to buy|looking for|need|interested in|price|cost|how much)/i.test(text)) {
        intents.push('Buying');
    }
    
    // Feedback intent
    if (/(feedback|opinion|think|feel|experience|thought)/i.test(text)) {
        intents.push('Feedback');
    }
    
    // Review intent
    if (/(review|rate|rating|reviewing|how is|how was|opinion about)/i.test(text)) {
        intents.push('Review');
    }
    
    // Return/Refund intent
    if (/(return|refund|exchange|send back|give back|take back|money back)/i.test(text)) {
        intents.push('Return/Refund');
    }
    
    // Complaint intent
    if (/(complaint|complain|problem|issue|wrong|broken|defective|faulty|not working|damaged)/i.test(text)) {
        intents.push('Complaint');
    }
    
    // Inquiry intent
    if (/(question|ask|wonder|want to know|tell me|information|details|specifications|specs|what|how|when|where|why)/i.test(text)) {
        intents.push('Inquiry');
    }
    
    // Support intent
    if (/(help|support|assistance|guide|how to|troubleshoot|fix)/i.test(text)) {
        intents.push('Support');
    }
    
    // Comparison intent
    if (/(compare|comparison|vs|versus|better|difference|between|which|should i)/i.test(text)) {
        intents.push('Comparison');
    }
    
    return intents.length > 0 ? intents : ['General Conversation'];
}

function analyzeEntities(text) {
    const entities = {
        products: [],
        brands: [],
        models: [],
        categories: []
    };
    
    const lowerText = text.toLowerCase();
    
    // Common product categories
    const productCategories = {
        'smartphone': ['phone', 'smartphone', 'mobile', 'cell phone', 'iphone', 'android phone'],
        'laptop': ['laptop', 'notebook', 'computer', 'macbook', 'pc'],
        'tablet': ['tablet', 'ipad'],
        'headphones': ['headphones', 'earphones', 'earbuds', 'airpods'],
        'camera': ['camera', 'dslr', 'mirrorless'],
        'tv': ['tv', 'television', 'smart tv'],
        'watch': ['watch', 'smartwatch', 'apple watch'],
        'speaker': ['speaker', 'bluetooth speaker'],
        'car': ['car', 'vehicle', 'automobile', 'sedan', 'suv'],
        'shoes': ['shoes', 'sneakers', 'boots'],
        'clothing': ['shirt', 'pants', 'jeans', 'dress', 'jacket']
    };
    
    // Common brands
    const brands = ['apple', 'samsung', 'sony', 'lg', 'nike', 'adidas', 'microsoft', 'google', 'huawei', 'xiaomi', 'oneplus', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'canon', 'nikon', 'bose', 'jbl', 'toyota', 'honda', 'ford', 'bmw', 'mercedes', 'audi'];
    
    // Check for brands
    brands.forEach(brand => {
        if (lowerText.includes(brand)) {
            entities.brands.push(brand.charAt(0).toUpperCase() + brand.slice(1));
        }
    });
    
    // Check for product categories
    Object.keys(productCategories).forEach(category => {
        productCategories[category].forEach(keyword => {
            if (lowerText.includes(keyword)) {
                if (!entities.categories.includes(category)) {
                    entities.categories.push(category);
                }
            }
        });
    });
    
    // Extract model numbers (common patterns)
    const modelPatterns = [
        /\b([A-Z]{1,3}[-]?\d{3,4}[A-Z]?)\b/g,  // iPhone 14, Galaxy S21, etc.
        /\b(pro|max|plus|mini|ultra)\b/gi,      // Pro, Max, Plus variants
        /\b(\d{4})\b/g                          // Year models like 2023, 2024
    ];
    
    modelPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                if (!entities.models.includes(match)) {
                    entities.models.push(match);
                }
            });
        }
    });
    
    // Extract specific product mentions
    const productPatterns = [
        /(iphone|galaxy|pixel|oneplus|redmi|note|pro max|airpods|macbook|ipad|watch)/gi
    ];
    
    productPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                if (!entities.products.includes(match)) {
                    entities.products.push(match);
                }
            });
        }
    });
    
    return entities;
}

function displaySentiment(sentiment, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return; // Safety check
    
    const className = sentiment.sentiment === 'Positive' ? 'sentiment-positive' : 
                     sentiment.sentiment === 'Negative' ? 'sentiment-negative' : 
                     'sentiment-neutral';
    
    element.innerHTML = `<span class="${className}">${sentiment.sentiment}</span> <span style="color: #666; font-size: 0.9em;">(${Math.round(sentiment.confidence)}% confidence)</span>`;
}

function displayIntent(intents, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return; // Safety check
    
    if (intents.length === 0) {
        element.innerHTML = '<span class="analysis-placeholder">No clear intent detected</span>';
        return;
    }
    
    const badges = intents.map(intent => `<span class="intent-badge">${intent}</span>`).join('');
    element.innerHTML = badges;
}

function displayEntities(entities, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return; // Safety check
    
    const allEntities = [];
    
    if (entities.brands.length > 0) {
        entities.brands.forEach(brand => {
            allEntities.push(`<span class="entity-item">${brand}<span class="entity-category">(Brand)</span></span>`);
        });
    }
    
    if (entities.categories.length > 0) {
        entities.categories.forEach(cat => {
            allEntities.push(`<span class="entity-item">${cat}<span class="entity-category">(Category)</span></span>`);
        });
    }
    
    if (entities.products.length > 0) {
        entities.products.forEach(product => {
            allEntities.push(`<span class="entity-item">${product}<span class="entity-category">(Product)</span></span>`);
        });
    }
    
    if (entities.models.length > 0) {
        entities.models.forEach(model => {
            allEntities.push(`<span class="entity-item">${model}<span class="entity-category">(Model)</span></span>`);
        });
    }
    
    if (allEntities.length === 0) {
        element.innerHTML = '<span class="analysis-placeholder">No entities detected</span>';
    } else {
        element.innerHTML = allEntities.join('');
    }
}

