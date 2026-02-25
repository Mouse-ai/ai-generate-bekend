const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;
const YANDEX_API_KEY = process.env.YANDEX_API_KEY;

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await axios.post(
      'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
      {
        modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt/latest`,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: 2000
        },
        messages: [
          {
            role: 'system',
            text: 'Сгенерируй идею на русском языке для поста в блоге о современных технологиях.'
          },
          {
            role: 'user',
            text: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Api-Key ${YANDEX_API_KEY}`
        }
      }
    );

    console.log('📦 Ответ от YandexGPT:', JSON.stringify(response.data, null, 2));

    // Правильная проверка структуры ответа
    if (
      response.data &&
      response.data.result &&
      response.data.result.alternatives &&
      response.data.result.alternatives.length > 0 &&
      response.data.result.alternatives[0].message &&
      response.data.result.alternatives[0].message.text
    ) {
      const generatedText = response.data.result.alternatives[0].message.text;
      res.json({ generatedText });
    } else {
      console.error('❌ Неожиданная структура ответа:', response.data);
      res.status(500).json({ error: 'Ошибка от YandexGPT: неверный формат ответа' });
    }
  } catch (error) {
    console.error('YandexGPT API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ошибка генерации контента' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});