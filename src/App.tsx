import { useState, useEffect } from 'react';
import type { ViewMode, Receipt, AppSettings } from './types';
import { 
  loadSettings, 
  saveSettings, 
  loadReceipts, 
  saveReceipt, 
  deleteReceipt 
} from './services/storage';
import { generateDocumentNumber, getTodayISO } from './utils/formatters';
import { applyThemeToDOM } from './utils/theme';
import { pushToGit } from './services/gitSync';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ReceiptForm } from './components/ReceiptForm';
import { DocumentPreview } from './components/DocumentPreview';
import { Archive } from './components/Archive';
import { Settings } from './components/Settings';

export function App() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings());
  const [receipts, setReceiptsState] = useState<Receipt[]>(loadReceipts());
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);

  // Apply theme color dynamically to DOM on settings update
  useEffect(() => {
    applyThemeToDOM(settings.themeColor);
  }, [settings.themeColor]);

  // Save settings updates
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  // Save receipt
  const handleSaveReceipt = (receiptToSave: Receipt) => {
    const updatedList = saveReceipt(receiptToSave);
    setReceiptsState(updatedList);

    // Auto-increment numbering config next number if creating a new receipt
    if (!receipts.some((r) => r.id === receiptToSave.id)) {
      const updatedNumbering = {
        ...settings.numberingConfig,
        numeroProssimo: (settings.numberingConfig.numeroProssimo || 1) + 1,
      };
      handleSaveSettings({
        ...settings,
        numberingConfig: updatedNumbering,
      });
    }

    // Background auto-sync to Git repository if configured
    if (settings.gitConfig?.enabled && settings.gitConfig?.token) {
      pushToGit(settings.gitConfig).catch((err) => console.warn('Background Git Sync warning:', err));
    }

    setActiveReceipt(receiptToSave);
    setCurrentView('preview');
  };

  // Delete receipt
  const handleDeleteReceipt = (id: string) => {
    const updated = deleteReceipt(id);
    setReceiptsState(updated);
    if (activeReceipt?.id === id) {
      setActiveReceipt(null);
    }
  };

  // Duplicate receipt
  const handleDuplicateReceipt = (source: Receipt) => {
    const nextNum = generateDocumentNumber(settings.numberingConfig);
    const duplicated: Receipt = {
      ...source,
      id: 'rec_' + Date.now(),
      numero: nextNum,
      data: getTodayISO(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveReceipt(duplicated);
    setCurrentView('edit-receipt');
  };

  // Navigation action handlers
  const handleNavigate = (view: ViewMode) => {
    if (view === 'new-receipt') {
      setActiveReceipt(null);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditReceipt = (receipt: Receipt) => {
    setActiveReceipt(receipt);
    setCurrentView('edit-receipt');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviewReceipt = (receipt: Receipt) => {
    setActiveReceipt(receipt);
    setCurrentView('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* Navigation Bar / Sidebar */}
      <Navigation
        currentView={currentView}
        onNavigate={handleNavigate}
        receiptCount={receipts.length}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 min-h-screen">
        {currentView === 'dashboard' && (
          <Dashboard
            receipts={receipts}
            settings={settings}
            onNavigate={handleNavigate}
            onEditReceipt={handleEditReceipt}
            onPreviewReceipt={handlePreviewReceipt}
          />
        )}

        {(currentView === 'new-receipt' || currentView === 'edit-receipt') && (
          <ReceiptForm
            initialReceipt={activeReceipt}
            settings={settings}
            onSave={handleSaveReceipt}
            onPreview={handlePreviewReceipt}
            onCancel={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'preview' && activeReceipt && (
          <DocumentPreview
            receipt={activeReceipt}
            themeColor={settings.themeColor}
            onEdit={handleEditReceipt}
            onBack={() => handleNavigate('archive')}
          />
        )}

        {currentView === 'archive' && (
          <Archive
            receipts={receipts}
            themeColor={settings.themeColor}
            onNavigate={handleNavigate}
            onEdit={handleEditReceipt}
            onPreview={handlePreviewReceipt}
            onDuplicate={handleDuplicateReceipt}
            onDelete={handleDeleteReceipt}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </main>
    </div>
  );
}

export default App;
