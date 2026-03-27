#!/usr/bin/env node

/**
 * Quick test script for AI Report Service
 * Usage: node test-ai-service.mjs
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_API_KEY);

// Mock session data
const mockSessionData = {
  game1: { score: 12, errors: 2, duration: 45000 },
  game2: { score: 18, errors: 3, duration: 25000 },
  game3: { score: 4, errors: 1, duration: 32000 },
  game4: { score: 245, errors: 1, duration: 120000 },
  game5: { score: 2850, errors: 0, duration: 35000, avgReactionTime: 320, falseStarts: 0 },
  game6: { score: 420, errors: 2, gridScore: 420, quizScore: 2, duration: 45000 },
  game7: { score: 85, errors: 1, efficiency: 85, duration: 60000 },
};

async function testAIReportGeneration() {
  console.log('🧪 Testing AI Report Generation...\n');
  console.log('📋 Mock Session Data:', JSON.stringify(mockSessionData, null, 2));
  console.log('\n⏳ Calling Google Gemini API (configurable model, default gemini-1.5-flash-latest)...\n');

  try {
    const prompt = `Eres un experto en evaluación de talento y recursos humanos. 

Analiza los siguientes resultados de pruebas cognitivas de un candidato:

1. Memoria (score: ${mockSessionData.game1.score}, errores: ${mockSessionData.game1.errors})
2. Atención (score: ${mockSessionData.game2.score}, errores: ${mockSessionData.game2.errors})
3. Velocidad (score: ${mockSessionData.game3.score}, errores: ${mockSessionData.game3.errors})
4. Concentración (score: ${mockSessionData.game4.score}, errores: ${mockSessionData.game4.errors})
5. Reacción (score: ${mockSessionData.game5.score}, tiempo promedio: ${mockSessionData.game5.avgReactionTime}ms)
6. Optimización (gridScore: ${mockSessionData.game6.gridScore}, quizScore: ${mockSessionData.game6.quizScore})
7. Vigilancia (efficiency: ${mockSessionData.game7.efficiency}%)

Proporciona un análisis JSON con este formato exacto:
{
  "summary": "resumén ejecutivo de 2-3 párrafos",
  "strengths": ["fortaleza1", "fortaleza2"],
  "areasToMonitor": ["area1", "area2"],
  "careerRecommendations": [{"role": "Puesto", "fit": "razón"}],
  "recommendation": "HIGHLY RECOMMEND|RECOMMEND WITH RESERVATIONS|BORDERLINE FIT|REQUIRES FOLLOW-UP",
  "confidenceScore": 75
}`;

    const modelName = process.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash-latest';
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log('📥 Raw Gemini Response:\n', responseText);
    console.log('\n✅ API Call Successful!\n');

    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const report = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON Parsed Successfully!\n');
        console.log('📊 Final Report:\n', JSON.stringify(report, null, 2));
        return true;
      } catch (e) {
        console.error('⚠️ JSON parsing failed:', e.message);
        return false;
      }
    } else {
      console.warn('⚠️ No JSON found in response');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('API key')) {
      console.error('🔑 Please check your VITE_GOOGLE_API_KEY in .env file');
    }
    return false;
  }
}

// Run test
console.log('═══════════════════════════════════════════════════\n');
testAIReportGeneration().then(success => {
  console.log('\n═══════════════════════════════════════════════════');
  if (success) {
    console.log('✅ Test PASSED - AI integration is working!');
  } else {
    console.log('❌ Test FAILED - Check error messages above');
  }
  process.exit(success ? 0 : 1);
});
