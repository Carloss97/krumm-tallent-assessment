# Sprint 1 - LLM Integration Testing Guide

## 📋 Quick Start

**Development server is running at:** `http://localhost:5174/`

---

## 🧪 Testing Scenarios

### Scenario 1: Basic Assessment Flow (5 minutes)
1. Open browser to http://localhost:5174
2. Click "Quick Demo" to run through all 7 games quickly
3. **Expected Result:**
   - 7 games execute in sequence
   - After completion, you'll see "Analyzing..." spinner for ~8 seconds
   - Spinner text should show "🤖 Calling AI model..." (not "Calculating heuristic")
   - Final report should display with AI-generated content

### Scenario 2: Verify AI Report Content
After quick demo completes, **observe the report section:**
- ✅ **Summary section**: 2-3 paragraphs of narrative analysis
- ✅ **Recommendation**: One of: HIGHLY RECOMMEND, RECOMMEND WITH RESERVATIONS, BORDERLINE FIT, REQUIRES FOLLOW-UP
- ✅ **Strengths**: Green section with 2+ bullet points
- ✅ **Areas to Monitor**: Amber section with 2+ relevant concerns
- ✅ **Career Recommendations**: Grid showing 3-5 suggested roles with fit rationale
- ✅ **Confidence Score**: 0-100 displayed somewhere on report

### Scenario 3: Toggle AI/Heuristic Modes
1. After AI report is generated, look for toggle button
2. Click "🤖 AI Mode" button (or toggle switch)
3. Should switch to "⚙️ Heuristic Mode"
4. **Expected Result:**
   - Report regenerates instantly (no 8s delay)
   - Content changes to simpler metric-based scoring
   - Shows "⚙️ Heuristic" source on report

### Scenario 4: Retry Report Generation
1. With Heuristic mode active, toggle back to AI mode
2. Click "Regenerate Report" (or similar button)
3. **Expected Result:**
   - 8 second wait time resumes
   - Fresh AI analysis appears
   - May contain different insights than first generation

---

## ⚠️ Known Issues & Status

### API Quota Management
- **Model Used**: `gemini-1.5-flash` (higher free tier quota than 2.0-flash)
- **Quota Reset**: Every 60 seconds (15 requests/min limit on free tier)
- **Workaround**: If you hit quota limit, wait 30-60 seconds before testing again
- **Fallback**: If Gemini API fails for any reason, heuristic report generates automatically

### Browser Console Debug Info
Open Developer Tools (F12) and check **Console tab** for:
```
✅ AI Report Generated - Check report for content
⏳ Fallback activated - Using heuristic mode
❌ Error: [specific error] - Check API key in .env
```

---

## 🔧 Troubleshooting

### Issue: "Analyzing..." never completes
- **Cause**: API quota exceeded or network error
- **Solution**: 
  1. Wait 30 seconds for quota reset
  2. Open DevTools (F12) → Console tab to see error
  3. Check that `.env` file has valid `VITE_GOOGLE_API_KEY`

### Issue: Report shows only heuristic metrics (no summary)
- **Expected** if fallback activated
- **Check**: Browser console should show fallback message
- **Action**: Try again in 1-2 minutes after quota resets

### Issue: No games run or app crashes
- **Check**: Run `npm run dev` again in terminal
- **Action**: Refresh browser with Ctrl+Shift+Delete (hard refresh)

---

## 📊 Success Criteria

Sprint 1 is **COMPLETE** when:
- [ ] All 7 games execute without errors
- [ ] AI report generates within 8-12 seconds
- [ ] Report contains all required fields (summary, strengths, risks, recommendations)
- [ ] Toggle between AI/Heuristic modes works smoothly
- [ ] Heuristic fallback triggers when API fails
- [ ] No console errors blocking functionality

---

## 🚀 Next Steps (Sprint 2)

Once testing validates Sprint 1 objectives:
1. Create 7 new games (Weeks 3-4)
2. Add backend SQLite storage (Week 5)
3. Implement user/session management
4. Launch pilot testing with companies

## 🛠️ Sprint 3 (Started)

- Backend API Node + Express + SQLite creado
- Proxy Vite /api configurado a http://localhost:4000
- Endpoint POST /api/session functionality added
- Report component now guarda sesión automáticamente usando backend
- `npm run dev:server` y `npm run dev` funcionan
- `npm run dev:full` preparado con concurrently

---

## 💾 Dev Environment Info
- **Frontend**: React 19 + Vite 8
- **LLM**: Google Gemini 1.5 Flash API
- **Port**: 5174 (if 5173 is occupied)
- **Build**: `npm run dev` (development mode)
- **Test Report Scripts**: `node test-ai-service.mjs` (Node.js direct test)
