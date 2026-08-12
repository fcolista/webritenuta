import React, { useState, useRef } from 'react';
import type { AppSettings, Prestatore, Committente, TaxConfig, NumberingConfig, ThemeColor, UserProfile, GitConfig } from '../types';
import { SignatureUploader } from './SignatureUploader';
import { exportBackupData, importBackupData, saveSettings, saveReceipts } from '../services/storage';
import { pushToGit, pullFromGit } from '../services/gitSync';
import { THEMES, applyThemeToDOM } from '../utils/theme';
import { 
  User, 
  Building2, 
  Sliders, 
  Hash, 
  Download, 
  Upload, 
  Save, 
  Plus, 
  Check,
  Palette,
  Users,
  Trash2,
  UserCheck,
  GitBranch,
  CloudUpload,
  CloudDownload,
  Key,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [prestatore, setPrestatore] = useState<Prestatore>(settings.prestatore);
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(settings.taxConfig);
  const [numberingConfig, setNumberingConfig] = useState<NumberingConfig>(settings.numberingConfig);
  const [committenti, setCommittenti] = useState<Committente[]>(settings.committenti);
  const [defaultCommittenteId, setDefaultCommittenteId] = useState<string>(settings.defaultCommittenteId || '');
  const [firmaBase64, setFirmaBase64] = useState<string | null>(settings.firmaBase64);
  const [themeColor, setThemeColor] = useState<ThemeColor>(settings.themeColor || 'blue');
  const [profiles, setProfiles] = useState<UserProfile[]>(settings.profiles || []);
  const [activeProfileId, setActiveProfileId] = useState<string | undefined>(settings.activeProfileId);
  const [gitConfig, setGitConfig] = useState<GitConfig>(settings.gitConfig || {
    enabled: false,
    provider: 'github',
    repoOwner: '',
    repoName: '',
    branch: 'main',
    token: '',
    filePath: 'webritenuta_backup.json',
    autoSyncOnSave: false,
  });

  const [gitSyncLoading, setGitSyncLoading] = useState(false);
  const [gitSyncStatus, setGitSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'prestatore' | 'profiles' | 'theme' | 'committenti' | 'fiscal' | 'numbering' | 'backup'>('prestatore');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const backupInputRef = useRef<HTMLInputElement>(null);

  // Active edit committente state
  const [editingCommittente, setEditingCommittente] = useState<Committente | null>(null);
  const [newProfileName, setNewProfileName] = useState('');

  const handleSaveAll = () => {
    const updatedSettings: AppSettings = {
      prestatore,
      taxConfig,
      numberingConfig,
      committenti,
      defaultCommittenteId,
      firmaBase64,
      themeColor,
      profiles,
      activeProfileId,
      gitConfig,
    };
    onSaveSettings(updatedSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleGitPush = async () => {
    setGitSyncLoading(true);
    setGitSyncStatus(null);
    const result = await pushToGit(gitConfig);
    setGitSyncLoading(false);
    if (result.success) {
      const updatedGitConfig = { ...gitConfig, lastSyncTimestamp: new Date().toISOString() };
      setGitConfig(updatedGitConfig);
      onSaveSettings({
        prestatore,
        taxConfig,
        numberingConfig,
        committenti,
        defaultCommittenteId,
        firmaBase64,
        themeColor,
        profiles,
        activeProfileId,
        gitConfig: updatedGitConfig,
      });
      setGitSyncStatus({ type: 'success', message: result.message });
    } else {
      setGitSyncStatus({ type: 'error', message: result.message });
    }
  };

  const handleGitPull = async () => {
    setGitSyncLoading(true);
    setGitSyncStatus(null);
    const result = await pullFromGit(gitConfig);
    setGitSyncLoading(false);
    if (result.success && result.data) {
      saveSettings(result.data.settings);
      saveReceipts(result.data.receipts);
      setGitSyncStatus({ type: 'success', message: result.message + ' Ricaricamento in corso...' });
      setTimeout(() => window.location.reload(), 2000);
    } else {
      setGitSyncStatus({ type: 'error', message: result.message });
    }
  };

  // Multi-User Profile Management
  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      alert('Inserire un nome identificativo per il nuovo profilo utente.');
      return;
    }
    const newProf: UserProfile = {
      id: 'prof_' + Date.now(),
      name: newProfileName.trim(),
      prestatore: { ...prestatore },
      firmaBase64,
      themeColor,
    };
    const updatedProfiles = [...profiles, newProf];
    setProfiles(updatedProfiles);
    setActiveProfileId(newProf.id);
    setNewProfileName('');
    alert(`Profilo "${newProf.name}" creato ed attivato con successo!`);
  };

  const handleSwitchProfile = (prof: UserProfile) => {
    setActiveProfileId(prof.id);
    setPrestatore({ ...prof.prestatore });
    setFirmaBase64(prof.firmaBase64);
    setThemeColor(prof.themeColor);
  };

  const handleDeleteProfile = (profId: string) => {
    if (confirm('Eliminare questo profilo utente?')) {
      const updated = profiles.filter((p) => p.id !== profId);
      setProfiles(updated);
      if (activeProfileId === profId) {
        setActiveProfileId(updated[0]?.id);
      }
    }
  };

  // Committenti directory handlers
  const handleAddCommittente = () => {
    const newComm: Committente = {
      id: 'comm_' + Date.now(),
      denominazione: '',
      denominazioneSeconda: '',
      indirizzo: '',
      cap: '',
      citta: '',
      provincia: '',
      nazione: 'Italia',
      partitaIva: '',
      codiceFiscale: '',
    };
    setEditingCommittente(newComm);
  };

  const handleSaveCommittente = () => {
    if (!editingCommittente || !editingCommittente.denominazione.trim()) {
      alert('Inserire la denominazione dell\'azienda committente.');
      return;
    }
    const existingIndex = committenti.findIndex((c) => c.id === editingCommittente.id);
    let updated: Committente[];
    if (existingIndex >= 0) {
      updated = [...committenti];
      updated[existingIndex] = editingCommittente;
    } else {
      updated = [...committenti, editingCommittente];
    }
    setCommittenti(updated);
    if (!defaultCommittenteId) {
      setDefaultCommittenteId(editingCommittente.id);
    }
    setEditingCommittente(null);
  };

  const handleDeleteCommittente = (id: string) => {
    if (confirm('Eliminare il committente selezionato?')) {
      const updated = committenti.filter((c) => c.id !== id);
      setCommittenti(updated);
      if (defaultCommittenteId === id) {
        setDefaultCommittenteId(updated[0]?.id || '');
      }
    }
  };

  // Backup Export/Import
  const handleExportBackup = () => {
    const dataStr = exportBackupData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Ritenute_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupData(content);
      if (success) {
        alert('Backup importato con successo! La pagina verrà ricaricata.');
        window.location.reload();
      } else {
        alert('Errore durante l\'importazione del file di backup. Verificare il formato JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Impostazioni Applicazione</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestisci dati prestatore, profili utente, temi colore, committenti e regole fiscali.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <Check size={14} className="w-3.5 h-3.5" /> Salvato!
            </span>
          )}
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Save size={16} className="w-4 h-4" />
            <span>Salva Impostazioni</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('prestatore')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'prestatore' ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User size={16} className="w-4 h-4" /> Dati Prestatore
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'theme' ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette size={16} className="w-4 h-4" /> Tema & Colori
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profiles' ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={16} className="w-4 h-4" /> Profili Utente ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab('committenti')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'committenti' ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 size={16} className="w-4 h-4" /> Committenti ({committenti.length})
        </button>
        <button
          onClick={() => setActiveTab('fiscal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'fiscal' ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders size={16} className="w-4 h-4" /> Regole Fiscali
        </button>
        <button
          onClick={() => setActiveTab('numbering')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'numbering' ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Hash size={16} className="w-4 h-4" /> Numerazione
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'backup' ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Download size={16} className="w-4 h-4" /> Backup & Privacy
        </button>
      </div>

      {/* Tab 1: Prestatore Profile */}
      {activeTab === 'prestatore' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Generalità e Dati Fiscali del Prestatore d'Opera
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={prestatore.nome}
                  onChange={(e) => setPrestatore({ ...prestatore, nome: e.target.value })}
                  placeholder="es. Mario"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cognome *</label>
                <input
                  type="text"
                  value={prestatore.cognome}
                  onChange={(e) => setPrestatore({ ...prestatore, cognome: e.target.value })}
                  placeholder="es. Rossi"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Codice Fiscale *</label>
                <input
                  type="text"
                  value={prestatore.codiceFiscale}
                  onChange={(e) => setPrestatore({ ...prestatore, codiceFiscale: e.target.value.toUpperCase() })}
                  placeholder="16 caratteri alfanumerici"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Partita IVA (opzionale)</label>
                <input
                  type="text"
                  value={prestatore.partitaIva || ''}
                  onChange={(e) => setPrestatore({ ...prestatore, partitaIva: e.target.value })}
                  placeholder="Eventuale P.IVA"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Indirizzo di Residenza</label>
                <input
                  type="text"
                  value={prestatore.indirizzo}
                  onChange={(e) => setPrestatore({ ...prestatore, indirizzo: e.target.value })}
                  placeholder="es. Via Garibaldi, 12"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CAP</label>
                  <input
                    type="text"
                    value={prestatore.cap}
                    onChange={(e) => setPrestatore({ ...prestatore, cap: e.target.value })}
                    placeholder="00100"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Città</label>
                  <input
                    type="text"
                    value={prestatore.citta}
                    onChange={(e) => setPrestatore({ ...prestatore, citta: e.target.value })}
                    placeholder="Roma"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Provincia</label>
                  <input
                    type="text"
                    value={prestatore.provincia}
                    onChange={(e) => setPrestatore({ ...prestatore, provincia: e.target.value })}
                    placeholder="RM"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Coordinate Bancarie IBAN</label>
                <input
                  type="text"
                  value={prestatore.iban || ''}
                  onChange={(e) => setPrestatore({ ...prestatore, iban: e.target.value.toUpperCase() })}
                  placeholder="IT60X0000000000000000000000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={prestatore.email || ''}
                  onChange={(e) => setPrestatore({ ...prestatore, email: e.target.value })}
                  placeholder="mario.rossi@email.it"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefono</label>
                <input
                  type="text"
                  value={prestatore.telefono || ''}
                  onChange={(e) => setPrestatore({ ...prestatore, telefono: e.target.value })}
                  placeholder="+39 340 1234567"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>

          {/* Digital Signature Component */}
          <SignatureUploader
            signatureBase64={firmaBase64}
            onSignatureChange={setFirmaBase64}
          />
        </div>
      )}

      {/* Tab: Theme Color Picker */}
      {activeTab === 'theme' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Palette size={18} className="text-blue-600" />
            Personalizzazione Tema Colore Interfaccia e PDF
          </h3>
          <p className="text-xs text-slate-500">
            Scegli il tema di colore principale che verrà applicato all'interfaccia dell'applicazione e alla grafica dei PDF generati.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {(Object.keys(THEMES) as ThemeColor[]).map((tKey) => {
              const theme = THEMES[tKey];
              const isSelected = themeColor === tKey;
              return (
                <div
                  key={tKey}
                  onClick={() => {
                    setThemeColor(tKey);
                    applyThemeToDOM(tKey);
                    onSaveSettings({
                      ...settings,
                      prestatore,
                      taxConfig,
                      numberingConfig,
                      committenti,
                      defaultCommittenteId,
                      firmaBase64,
                      profiles,
                      activeProfileId,
                      themeColor: tKey,
                    });
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    isSelected ? 'shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  style={{
                    borderColor: isSelected ? theme.hexAccent : undefined,
                    backgroundColor: isSelected ? theme.hexLight : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full shadow-xs flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: theme.hexAccent }}
                    >
                      {isSelected && <Check size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{theme.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{theme.hexAccent}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: User Profiles */}
      {activeTab === 'profiles' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
          <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            Gestione Profili Multi-Utente
          </h3>

          <p className="text-xs text-slate-600">
            Crea e gestisci profili diversi per prestatori d'opera multipli (es. Mario Rossi, Laura Bianchi). Selezionando un profilo si caricheranno automaticamente i suoi dati fiscali, la firma ed il colore del tema.
          </p>

          {/* Create new profile card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-800 text-xs">Salva l'attuale prestatore come nuovo Profilo</h4>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="es. Profilo Mario Rossi - Consulente"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
              />
              <button
                onClick={handleCreateProfile}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shrink-0"
              >
                <Plus size={16} /> Salva Profilo
              </button>
            </div>
          </div>

          {/* Profiles list */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs">Profili Salvati</h4>
            {profiles.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nessun profilo multi-utente salvato. Salva il profilo corrente dal campo in alto.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {profiles.map((prof) => {
                  const isActive = activeProfileId === prof.id;
                  return (
                    <div key={prof.id} className={`p-3.5 flex items-center justify-between gap-4 ${isActive ? 'bg-blue-50/50' : 'bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: THEMES[prof.themeColor || 'blue'].hexAccent }}
                        >
                          {prof.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs flex items-center gap-2">
                            {prof.name}
                            {isActive && (
                              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <UserCheck size={12} /> Attivo
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {prof.prestatore.nome} {prof.prestatore.cognome} ({prof.prestatore.codiceFiscale || 'CF non specificato'})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <button
                            onClick={() => handleSwitchProfile(prof)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
                          >
                            Attiva Profilo
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProfile(prof.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Committenti Directory */}
      {activeTab === 'committenti' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Elenco Committenti Memorizzati</h3>
              <button
                onClick={handleAddCommittente}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                <Plus size={16} className="w-4 h-4" /> Nuovo Committente
              </button>
            </div>

            {/* Committente Form Modal / Inline Edit */}
            {editingCommittente && (
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">
                  {editingCommittente.id ? 'Modifica Committente' : 'Nuovo Committente'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700">Denominazione Azienda *</label>
                    <input
                      type="text"
                      value={editingCommittente.denominazione}
                      onChange={(e) => setEditingCommittente({ ...editingCommittente, denominazione: e.target.value })}
                      placeholder="DATAITALIA S.r.l."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">Partita IVA</label>
                    <input
                      type="text"
                      value={editingCommittente.partitaIva}
                      onChange={(e) => setEditingCommittente({ ...editingCommittente, partitaIva: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">Codice Fiscale</label>
                    <input
                      type="text"
                      value={editingCommittente.codiceFiscale}
                      onChange={(e) => setEditingCommittente({ ...editingCommittente, codiceFiscale: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700">Indirizzo completa</label>
                    <input
                      type="text"
                      value={editingCommittente.indirizzo}
                      onChange={(e) => setEditingCommittente({ ...editingCommittente, indirizzo: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingCommittente(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSaveCommittente}
                    className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg cursor-pointer"
                  >
                    Salva Committente
                  </button>
                </div>
              </div>
            )}

            {/* Committenti List */}
            <div className="divide-y divide-slate-100">
              {committenti.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{c.denominazione}</p>
                    <p className="text-xs text-slate-500">
                      {c.indirizzo} - P.IVA: {c.partitaIva || 'N/D'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingCommittente(c)}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDeleteCommittente(c.id)}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Fiscal Rules */}
      {activeTab === 'fiscal' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
          <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Impostazioni Fiscali di Calcolo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Aliquota Ritenuta d'Acconto (%)
              </label>
              <input
                type="number"
                value={taxConfig.ritenutaPercentuale}
                onChange={(e) => setTaxConfig({ ...taxConfig, ritenutaPercentuale: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Valore consueto per prestazioni occasionali: 20%</p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cfgInps"
                  checked={taxConfig.hasContributoPrevidenziale}
                  onChange={(e) => setTaxConfig({ ...taxConfig, hasContributoPrevidenziale: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="cfgInps" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Abilita Rivalsa Previdenziale (es. INPS 4%)
                </label>
              </div>

              {taxConfig.hasContributoPrevidenziale && (
                <div className="pl-6 space-y-2">
                  <input
                    type="text"
                    value={taxConfig.contributoLabel}
                    onChange={(e) => setTaxConfig({ ...taxConfig, contributoLabel: e.target.value })}
                    placeholder="Rivalsa INPS (4%)"
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cfgInpsBase"
                      checked={taxConfig.contributoInclusoInBaseRitenuta}
                      onChange={(e) => setTaxConfig({ ...taxConfig, contributoInclusoInBaseRitenuta: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <label htmlFor="cfgInpsBase" className="text-[11px] text-slate-600 cursor-pointer">
                      Includi contributo previdenziale nella base imponibile della ritenuta
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cfgBollo"
                  checked={taxConfig.hasMarcaDaBollo}
                  onChange={(e) => setTaxConfig({ ...taxConfig, hasMarcaDaBollo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="cfgBollo" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Abilita Marca da Bollo automatica
                </label>
              </div>
              <p className="text-[11px] text-slate-500 pl-6">
                Applica automaticamente marca da bollo da € 2,00 per importi superiori alla soglia di € 77,47.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Numbering */}
      {activeTab === 'numbering' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Numerazione Progressiva Documenti
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prefisso Opzionale</label>
              <input
                type="text"
                value={numberingConfig.prefisso}
                onChange={(e) => setNumberingConfig({ ...numberingConfig, prefisso: e.target.value })}
                placeholder="es. 2026/"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prossimo Numero</label>
              <input
                type="number"
                value={numberingConfig.numeroProssimo}
                onChange={(e) => setNumberingConfig({ ...numberingConfig, numeroProssimo: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cifre Minime (Pad Zero)</label>
              <input
                type="number"
                value={numberingConfig.cifreMinime}
                onChange={(e) => setNumberingConfig({ ...numberingConfig, cifreMinime: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Backup, Privacy & Git Sync */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Option A: Local JSON Backup */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <Download size={18} className="text-blue-600" />
              Opzione A: Backup Locale JSON (Senza Server)
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              I tuoi dati fiscali, le ritenute create e l'immagine della firma rimangono <strong>esclusivamente sul tuo browser</strong> (Local-First).
              Puoi scaricare il file JSON di backup per trasferire i dati manualmente su un altro dispositivo o conservarne una copia di sicurezza.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              <button
                onClick={handleExportBackup}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer"
              >
                <Download size={16} className="w-4 h-4" />
                Esporta Backup JSON
              </button>

              <input
                type="file"
                ref={backupInputRef}
                onChange={handleImportBackup}
                accept=".json"
                className="hidden"
              />

              <button
                onClick={() => backupInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
              >
                <Upload size={16} className="w-4 h-4" />
                Importa Backup JSON
              </button>
            </div>
          </div>

          {/* Option B: Git Repository Sync */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <GitBranch size={18} className="text-blue-600" />
                Opzione B: Sincronizzazione Repository Git (GitHub / GitLab / Gitea)
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableGitSync"
                  checked={gitConfig.enabled}
                  onChange={(e) => setGitConfig({ ...gitConfig, enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="enableGitSync" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Abilita Git Sync
                </label>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sincronizza automaticamente le tue ritenute d'acconto ed impostazioni su un repository Git privato (GitHub, GitLab o Gitea).
              Ogni salvataggio creera un commit col versionamento di tutte le ritenute.
            </p>

            {gitConfig.enabled && (
              <div className="space-y-4 pt-2">
                {/* Status Message */}
                {gitSyncStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold border ${
                      gitSyncStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {gitSyncStatus.message}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Provider Git</label>
                    <select
                      value={gitConfig.provider}
                      onChange={(e) => setGitConfig({ ...gitConfig, provider: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                    >
                      <option value="github">GitHub</option>
                      <option value="gitlab">GitLab</option>
                      <option value="gitea">Gitea / Self-Hosted</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Username *</label>
                    <input
                      type="text"
                      value={gitConfig.repoOwner}
                      onChange={(e) => setGitConfig({ ...gitConfig, repoOwner: e.target.value.trim() })}
                      placeholder="fcolista"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Es: per <code>https://github.com/fcolista/ritenute</code> inserisci <strong>fcolista</strong></p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Repository *</label>
                    <input
                      type="text"
                      value={gitConfig.repoName}
                      onChange={(e) => setGitConfig({ ...gitConfig, repoName: e.target.value.trim() })}
                      placeholder="ritenute"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Es: inserisci <strong>ritenute</strong> (senza .git o l'URL intero)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                    <input
                      type="text"
                      value={gitConfig.branch || 'main'}
                      onChange={(e) => setGitConfig({ ...gitConfig, branch: e.target.value.trim() })}
                      placeholder="main"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Personal Access Token (PAT) *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Richiede permessi di repo/write</span>
                    </label>
                    <div className="relative">
                      <Key size={14} className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={gitConfig.token}
                        onChange={(e) => setGitConfig({ ...gitConfig, token: e.target.value.trim() })}
                        placeholder="ghp_... o glpat-..."
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                      />
                    </div>
                  </div>

                  {gitConfig.provider === 'gitea' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">URL Istanza Self-Hosted (Gitea/GitLab)</label>
                      <input
                        type="text"
                        value={gitConfig.apiUrl || ''}
                        onChange={(e) => setGitConfig({ ...gitConfig, apiUrl: e.target.value.trim() })}
                        placeholder="https://gitea.mio-dominio.com"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Git Push & Pull Action Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    {gitConfig.lastSyncTimestamp ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <ShieldCheck size={14} />
                        Ultimo Sync Git: {new Date(gitConfig.lastSyncTimestamp).toLocaleString('it-IT')}
                      </span>
                    ) : (
                      <span>Nessuna sincronizzazione Git effettuata.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleGitPull}
                      disabled={gitSyncLoading}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer"
                    >
                      {gitSyncLoading ? <RefreshCw size={14} className="animate-spin" /> : <CloudDownload size={14} />}
                      <span>📥 Pull da Git</span>
                    </button>

                    <button
                      onClick={handleGitPush}
                      disabled={gitSyncLoading}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {gitSyncLoading ? <RefreshCw size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                      <span>📤 Push su Git</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

