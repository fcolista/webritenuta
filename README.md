# 📄 WebRitenuta

> **PWA Local-First moderna, elegante e professionale per la compilazione, calcolo fiscale e generazione di Ritenute d'Acconto in formato PDF A4 vettoriale.**

---

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-emerald.svg)
![PWA](https://img.shields.io/badge/PWA-Offline_Ready-purple.svg)
![Docker](https://img.shields.io/badge/Docker-Alpine_3.24-blue.svg)

---

## 📋 Indice
1. [Descrizione del Progetto](#-descrizione-del-progetto)
2. [Caratteristiche e Funzionalità](#-caratteristiche-e-funzionalità)
3. [Stack Tecnologico](#-stack-tecnologico)
4. [Avvio Rapido](#-avvio-rapido)
   - [Esecuzione in Sviluppo (Node.js)](#esecuzione-in-sviluppo-nodejs)
   - [Esecuzione in Produzione con Docker](#esecuzione-in-produzione-con-docker)
5. [Struttura del Progetto](#-struttura-del-progetto)
6. [Guida al Backup e Sincronizzazione](#-guida-al-backup-e-sincronizzazione)
7. [Privacy & Licenza](#-privacy--licenza)

---

## 🎯 Descrizione del Progetto

**WebRitenuta** è una web application PWA (*Progressive Web App*) progettata per consentire a liberi professionisti, consulenti e lavoratori autonomi occasionali italiani di compilare velocemente ritenute d'acconto, eseguire i calcoli fiscali in tempo reale e generare documenti PDF professionali pronti per la stampa e l'invio al committente.

L'applicazione adotta una filosofia **Local-First**: tutti i dati anagrafici, le ritenute create, l'immagine della firma ed i profili utenti rimangono custoditi **esclusivamente nel browser dell'utente**, garantendo riservatezza totale, funzionamento offline al 100% e zero costi di mantenimento server.

---

## ✨ Caratteristiche e Funzionalità

### ✍️ 1. Compilazione & Motore Fiscale Live
- **Dati Documento**: Numero progressivo automatico o manuale, data e oggetto della prestazione.
- **Prestazioni Illimitate**: Aggiunta, modifica, eliminazione e riordino dinamico delle righe di servizio con calcolo istantaneo.
- **Calcolo Fiscale Parametrico**:
  - Compensi lordi totali.
  - Rivalsa Previdenziale (es. INPS 4%) inclusa o esclusa dalla base imponibile.
  - Aliquota Ritenuta d'Acconto configurabile (default 20%).
  - Imposta di Bollo automatica di € 2,00 per importi superiori alla soglia di legge (€ 77,47 ai sensi del D.P.R. 642/1972).
  - Totale **Netto da Corrispondere** formattato in valuta `€ 1.234,56`.

### 📄 2. Anteprima & PDF Vettoriale A4 Professionale
- **Vero PDF Vettoriale**: Generato nativamente in formato A4 con testo selezionabile e ricercabile (nessuno screenshot HTML).
- **Anteprima Interattiva**: Visualizzazione a schermo in formato foglio A4 prima del download.
- **Firma Digitale PNG**: Upload ed inserimento di firme trasparenti PNG con mantenimento delle proporzioni grafiche.
- **Azioni veloci**: Scarica PDF, Stampa nativa, Modifica e Condivisione tramite Web Share API.
- **Nome File Standardizzato**: Formato automatico `Ritenuta_2026-001_2026-08-12.pdf`.

### 🎨 3. Personalizzazione Temi Colore
Scegli tra **5 palette cromatiche professionali** con anteprima istantanea a schermo e colore coordinato applicato direttamente alla testata ed ai riquadri dei PDF:
- 🔵 **Blu Istituzionale** *(Default)*
- 🟢 **Verde Smeraldo / Contabile**
- 🟣 **Viola Elegante / Creative**
- 🔘 **Grigio Ardesia / Tech**
- 🔴 **Bordeaux Rose / Classico**

### 👥 4. Profili Multi-Utente (Prestatori Multipli)
- Crea e salva profili autonomi per prestatori d'opera multipli (es. *"Mario Rossi - Consulente"*, *"Laura Bianchi - Designer"*).
- Cambia profilo attivo con un click: dati fiscali, IBAN, firma e tema colore si aggiornano istantaneamente.

### 🗄️ 5. Archivio Storico & Rubrica Committenti
- **Archivio Ritenute**: Ricerca rapida per numero, data, committente o oggetto.
- **Azioni sull'Archivio**: Visualizza, Modifica, Duplica (genera una nuova ritenuta con il progressivo successivo e data odierna) ed Elimina.
- **Rubrica Committenti**: Salva la denominazione multilinea (es. *Spett.le DATAITALIA Servizi per l'informatica s.r.l.*), P.IVA, C.F. e indirizzo per l'autocompilazione.

### 📦 6. Backup Locale & Sincronizzazione Git
- **Opzione A - Backup Locale (JSON)**: Esportazione ed importazione in 1-click di tutti i dati in formato file JSON.
- **Opzione B - Git Sync (GitHub / GitLab / Gitea)**: Sincronizzazione ed auto-push in background su repository Git privati tramite Personal Access Token (PAT).

---

## 🛠️ Stack Tecnologico

- **Frontend Core**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + PostCSS
- **Iconografia**: [Lucide React](https://lucide.dev/)
- **Generatore PDF**: [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Containerizzazione**: [Docker](https://www.docker.com/) + Multi-stage build su **Alpine Linux 3.24** + Nginx Web Server

---

## 🚀 Avvio Rapido

### Esecuzione in Sviluppo (Node.js)

1. Clona il repository ed entra nella cartella del progetto:
   ```bash
   cd webritenuta
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Avvia il server di sviluppo locale:
   ```bash
   npm run dev -- --host
   ```
   Apri il browser su `http://localhost:5173`.

---

### Esecuzione in Produzione con Docker

L'applicazione include una configurazione Docker pronta per la produzione basata su **Alpine Linux 3.24** e **Nginx**.

1. Avvia il container tramite Docker Compose:
   ```bash
   docker compose up -d --build
   ```

2. Apri il browser su:
   👉 **`http://localhost:8080`**

*(Puoi modificare la porta esterna creando un file `.env` ed impostando la variabile `PORT=3000`).*

---

## 📁 Struttura del Progetto

```text
webritenuta/
├── public/
│   ├── favicon.svg          # Favicon applicazione
│   ├── manifest.webmanifest # PWA Web App Manifest
│   └── sw.js                # Service Worker per uso offline
├── src/
│   ├── components/          # Componenti React
│   │   ├── Navigation.tsx   # Sidebar Desktop e Bottom Bar Mobile
│   │   ├── Dashboard.tsx    # Riepilogo e statistiche veloci
│   │   ├── ReceiptForm.tsx  # Form di creazione/modifica ritenuta
│   │   ├── DocumentPreview.tsx # Anteprima foglio A4 e download
│   │   ├── Archive.tsx      # Archivio e ricerca ritenute
│   │   ├── Settings.tsx     # Impostazioni, Temi, Profili e Git Sync
│   │   └── SignatureUploader.tsx # Caricamento e anteprima firma PNG
│   ├── services/            # Moduli di servizio
│   │   ├── taxEngine.ts     # Motore di calcolo fiscale
│   │   ├── pdfGenerator.ts  # Generatore PDF A4 vettoriale (jsPDF)
│   │   ├── storage.ts       # Gestore localStorage & Backup JSON
│   │   └── gitSync.ts       # Sincronizzatore REST API GitHub/GitLab/Gitea
│   ├── utils/               # Formattatori e utility
│   │   ├── formatters.ts    # Formattazione valuta (€) e date (DD/MM/YYYY)
│   │   ├── validators.ts    # Validazione C.F., P.IVA e campi form
│   │   └── theme.ts         # Utility palette cromatiche e variabili CSS
│   ├── types/
│   │   └── index.ts         # Definizione delle interfacce TypeScript
│   ├── App.tsx              # Componente radice e navigazione viste
│   ├── main.tsx             # Entrypoint React e registrazione SW PWA
│   └── index.css            # Stili CSS globali e direttive Tailwind
├── nginx/
│   └── nginx.conf           # Configurazione Nginx SPA per Alpine Linux
├── Dockerfile               # Dockerfile multi-stage su Alpine 3.24
├── docker-compose.yml       # Configurazione Docker Compose
├── postcss.config.js        # Configurazione PostCSS
├── tailwind.config.js       # Configurazione Tailwind CSS
├── vite.config.ts           # Configurazione Vite
└── package.json
```

---

## 📦 Guida al Backup e Sincronizzazione

Nel pannello **Impostazioni > Backup & Git Sync** sono disponibili due modalità:

### 📥 Opzione A: Backup Locale JSON
- **Esporta**: Clicca su *Esporta Backup JSON* per scaricare un file `.json` contenente l'intero archivio e la firma.
- **Importa**: Clicca su *Importa Backup JSON* su un nuovo browser per caricare i dati in 1-click.

### 🐙 Opzione B: Git Sync (GitHub / GitLab / Gitea)
1. Crea un repository privato ed un Personal Access Token (PAT) con permessi di scrittura.
2. Inserisci i dati (Owner, Repo, Branch, Token) in *Impostazioni*.
3. Usa **Push su Git** per salvare o **Pull da Git** per scaricare i dati da qualsiasi computer.
4. Ogni salvataggio di ritenuta eseguirà l'**auto-push in background**.

---

## 🔒 Privacy & Licenza

- **Privacy**: Nessun dato personale o fiscale lascia il dispositivo dell'utente senza autorizzazione esplicita.
- **Licenza**: Distribuito sotto licenza **MIT**. Uso libero sia per scopi personali che commerciali.
