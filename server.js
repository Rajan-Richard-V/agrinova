const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const CONFIG = require('./config.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('Sending message to DeepSeek:', message);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': `http://localhost:${CONFIG.PORT}`,
                'X-Title': 'AI Chatbot'
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant. Provide clear, well-structured responses with bullet points and headings when appropriate.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API Error:', errorData);
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            console.log('✅ Response received successfully');
            res.json({ response: data.choices[0].message.content });
        } else {
            throw new Error('Invalid response format');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online',
        message: 'Chatbot server is running',
        model: CONFIG.MODEL 
    });
});

// Start server
app.listen(CONFIG.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${CONFIG.PORT}`);
    console.log(`🔑 API Key loaded: ${CONFIG.OPENROUTER_API_KEY.substring(0, 15)}...`);
    console.log(`🤖 Model: ${CONFIG.MODEL}`);
    console.log('📝 Ready to chat!');
});