# 🔧 Troubleshooting - Jarvis Deployment

## ❌ Il Deployment Non è Visibile Online

Se hai aggiunto il secret ma il sito non è ancora online, segui questi passaggi:

---

## 1️⃣ Verifica lo Stato del Workflow

### Vai su GitHub Actions
1. Apri: https://github.com/ettoretitotto-prog/Jarvis/actions
2. Dovresti vedere il workflow "Deploy to GitHub Pages" in esecuzione
3. Aspetta che sia completato (verde ✓)

### Se il Workflow è Fallito (❌)
1. Clicca sul workflow fallito
2. Controlla i log per vedere l'errore
3. Comuni errori:
   - **"Secret not found"** → Il secret non è stato aggiunto correttamente
   - **"Build failed"** → Problema nel build (controlla i log)
   - **"Permission denied"** → Problema di permessi GitHub Pages

---

## 2️⃣ Verifica la Configurazione di GitHub Pages

### Vai su Settings → Pages
1. Apri: https://github.com/ettoretitotto-prog/Jarvis/settings/pages
2. Verifica che:
   - ✅ **Source** sia impostato su "GitHub Actions"
   - ✅ **Branch** sia "main" (se applicabile)
   - ✅ Non ci siano errori di deployment

### Se il Source è Impostato su "Deploy from a branch"
1. Cambia a "GitHub Actions"
2. Salva le modifiche
3. Il workflow dovrebbe riavviarsi automaticamente

---

## 3️⃣ Riavvia il Workflow Manualmente

Se il workflow non si è avviato:

1. Vai su: https://github.com/ettoretitotto-prog/Jarvis/actions
2. Clicca sul workflow "Deploy to GitHub Pages"
3. Clicca su "Re-run jobs" (o "Re-run all jobs")
4. Aspetta che il workflow sia completato

---

## 4️⃣ Verifica il Secret

### Controlla che il Secret sia Configurato Correttamente
1. Vai a: https://github.com/ettoretitotto-prog/Jarvis/settings/secrets/actions
2. Dovresti vedere `VITE_SUPABASE_ANON_KEY` nella lista
3. Se non c'è, aggiungilo di nuovo:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Secret**: `sb_publishable_srOIHnEfjRUFXpflbQKPyA_1EIvZzw9`

---

## 5️⃣ Verifica il Build Locale

Se il workflow fallisce, verifica che il build locale funzioni:

```bash
cd /Users/ettoretitotto/Desktop/PROGRAMMI/Jarvis-main

# Installa le dipendenze
npm install

# Fai il build
npm run build

# Controlla che /dist sia stato generato
ls -la dist/
```

Se il build locale fallisce, controlla:
- ✅ Node.js è installato (versione 18+)
- ✅ npm è installato
- ✅ Il file `.env` contiene `VITE_SUPABASE_ANON_KEY`

---

## 6️⃣ Verifica l'URL del Sito

Una volta che il deployment è completato, il sito dovrebbe essere disponibile su:

```
https://ettoretitotto-prog.github.io/Jarvis/
```

### Se l'URL è Diverso
1. Vai a: https://github.com/ettoretitotto-prog/Jarvis/settings/pages
2. Controlla l'URL nel campo "Your site is live at"
3. Usa quell'URL per accedere al sito

---

## 7️⃣ Cancella la Cache del Browser

Se il sito è online ma non vedi le modifiche:

1. **Cancella la cache del browser**:
   - Chrome: Ctrl+Shift+Delete (o Cmd+Shift+Delete su Mac)
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E

2. **Oppure usa una finestra in incognito**:
   - Chrome: Ctrl+Shift+N
   - Firefox: Ctrl+Shift+P
   - Safari: Cmd+Option+N

3. **Oppure forza il refresh**:
   - Chrome/Firefox: Ctrl+F5 (o Cmd+Shift+R su Mac)
   - Safari: Cmd+Option+R

---

## 8️⃣ Verifica che il Tasto di Eliminazione Funzioni

Una volta che il sito è online:

1. Vai a: https://ettoretitotto-prog.github.io/Jarvis/
2. Scorri fino alla sezione "Diario personale"
3. Dovresti vedere gli allenamenti con il tasto cestino (🗑️) accanto
4. Clicca sul tasto cestino per eliminare un allenamento
5. Conferma l'eliminazione nel dialog

---

## 🆘 Problemi Comuni

### Problema: "Permission to ettoretitotto-prog/Jarvis.git denied"
**Soluzione**: Questo errore è stato risolto. Se appare ancora:
1. Verifica che il token GITHUB_TOKEN abbia i permessi corretti
2. Vai a Settings → Actions → General
3. Verifica che "Workflow permissions" sia impostato su "Read and write permissions"

### Problema: "Build failed - VITE_SUPABASE_ANON_KEY is undefined"
**Soluzione**: Il secret non è stato aggiunto correttamente
1. Vai a: https://github.com/ettoretitotto-prog/Jarvis/settings/secrets/actions
2. Verifica che `VITE_SUPABASE_ANON_KEY` sia presente
3. Se non c'è, aggiungilo di nuovo

### Problema: "404 - Page not found"
**Soluzione**: Il deployment non è stato completato
1. Vai a: https://github.com/ettoretitotto-prog/Jarvis/actions
2. Verifica che il workflow sia completato (verde ✓)
3. Se è fallito, controlla i log per l'errore

### Problema: "Sito online ma senza modifiche"
**Soluzione**: Cancella la cache del browser (vedi punto 7️⃣)

---

## 📞 Supporto Aggiuntivo

Se il problema persiste:

1. **Controlla i log del workflow**:
   - Vai a: https://github.com/ettoretitotto-prog/Jarvis/actions
   - Clicca sul workflow fallito
   - Leggi i log per capire l'errore

2. **Verifica la configurazione locale**:
   - Esegui `npm run build` localmente
   - Se fallisce, controlla l'errore

3. **Verifica GitHub Pages Settings**:
   - Vai a: https://github.com/ettoretitotto-prog/Jarvis/settings/pages
   - Assicurati che tutto sia configurato correttamente

---

## ✅ Checklist di Verifica

- [ ] Ho aggiunto il secret `VITE_SUPABASE_ANON_KEY` su GitHub
- [ ] Il workflow "Deploy to GitHub Pages" è completato (verde ✓)
- [ ] GitHub Pages è configurato su "GitHub Actions"
- [ ] Ho cancellato la cache del browser
- [ ] Il sito è disponibile su https://ettoretitotto-prog.github.io/Jarvis/
- [ ] Vedo il tasto cestino (🗑️) accanto agli allenamenti
- [ ] Posso eliminare un allenamento cliccando il tasto cestino

---

## 🎉 Se Tutto Funziona

Congratulazioni! Il deployment è completato e il tasto di eliminazione è operativo. Puoi ora:
- ✅ Eliminare gli allenamenti dal database Supabase
- ✅ Vedere la lista aggiornarsi automaticamente
- ✅ Vedere i totali (km e uscite) aggiornarsi

Buon lavoro! 🚀
