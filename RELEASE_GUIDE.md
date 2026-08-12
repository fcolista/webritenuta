# 🏷️ Guida al Versionamento e Rilascio Release su GitHub

Questa guida descrive la procedura da seguire per aggiornare la versione di **WebRitenuta**, creare un Git Tag e pubblicare una nuova Release su GitHub.

---

## 📋 Procedura di Rilascio in 4 Passaggi

### 1. ✏️ Aggiorna il numero di versione nel codice
Apri il file `package.json` ed incrementa il valore della proprietà `"version"` seguendo lo standard [Semantic Versioning](https://semver.org/lang/it/) (`MAJOR.MINOR.PATCH`):

```json
{
  "name": "webritenuta",
  "version": "1.2.0"
}
```

> **Nota**: Il compilatore Vite legge automaticamente la versione da `package.json` ed aggiorna la dicitura in basso a sinistra nell'applicazione senza bisogno di modificare altri file.

---

### 2. 📝 Esegui il Commit su Git
Apri il terminale nella cartella del progetto ed esegui:

```bash
# Aggiungi tutti i file modificati
git add .

# Crea il commit di rilascio
git commit -m "chore(release): bump version to 1.2.0"

# Invia il commit su GitHub
git push origin main
```

---

### 3. 🏷️ Crea ed Invia il Git Tag
Crea il tag di versione con prefisso `v` e spingilo sul repository remoto:

```bash
# Crea il tag annotato con una breve descrizione
git tag -a v1.2.0 -m "Release v1.2.0: Descrizione sintetica delle novità"

# Invia il tag su GitHub
git push origin v1.2.0
```

---

### 4. 🚀 Pubblica la Release su GitHub Web UI
1. Apri il browser e vai sul tuo repository GitHub (`https://github.com/tuo-username/webritenuta`).
2. Nella colonna di destra clicca su **Releases** → **Draft a new release**.
3. Clicca su **Choose a tag** e seleziona il tag appena inviato (es. `v1.2.0`).
4. Imposta il titolo della release: `WebRitenuta v1.2.0`.
5. Compila le note di rilascio (*Changelog*):
   ```markdown
   ## 🌟 Novità della Versione 1.2.0
   - ✨ Nuova funzionalità X
   - 🎨 Miglioramento interfaccia Y
   - 🐛 Correzione bug Z
   ```
6. Clicca su **Publish release**.

---

## 🐳 Aggiornamento del Container Docker in Produzione

Dopo aver creato il tag e pubblicato la release, aggiorna l'istanza Docker sul tuo server con:

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```
