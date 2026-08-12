import type { GitConfig, BackupData } from '../types';
import { exportBackupData } from './storage';

/**
 * Base64 helper supporting UTF-8 strings
 */
function utf8ToBase64(str: string): string {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  ));
}

function base64ToUtf8(str: string): string {
  return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c: string) =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
}

/**
 * Clean & sanitize GitHub/GitLab repository parameters if full URLs were pasted
 */
export function sanitizeGitRepoParams(ownerInput: string, repoInput: string): { owner: string; repo: string } {
  let owner = (ownerInput || '').trim();
  let repo = (repoInput || '').trim();

  // If full GitHub URL was pasted: e.g. https://github.com/fcolista/ritenute.git
  const fullMatch = (owner + '/' + repo).match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (fullMatch) {
    owner = fullMatch[1];
    repo = fullMatch[2].replace(/\.git$/, '');
    return { owner, repo };
  }

  // Clean owner
  owner = owner.replace(/^https?:\/\/github\.com\//, '').split('/')[0].trim();

  // Clean repo
  repo = repo.replace(/\.git$/, '').split('/').pop()?.trim() || repo;

  return { owner, repo };
}

/**
 * Push backup JSON data to a Git repository via REST API
 */
export async function pushToGit(gitConfig: GitConfig): Promise<{ success: boolean; message: string }> {
  const { owner, repo } = sanitizeGitRepoParams(gitConfig.repoOwner, gitConfig.repoName);
  const cleanToken = (gitConfig.token || '').trim();

  if (!cleanToken || !owner || !repo) {
    return { success: false, message: 'Configurazione Git incompleta. Inserire Token, Owner (es. fcolista) e Repository (es. ritenute).' };
  }

  const backupJsonStr = exportBackupData();
  const filePath = gitConfig.filePath || 'webritenuta_backup.json';
  const branch = gitConfig.branch || 'main';
  const commitMessage = `Update Ritenute Backup [${new Date().toLocaleString('it-IT')}]`;

  try {
    if (gitConfig.provider === 'github' || !gitConfig.provider) {
      // 1. First test repo connectivity and PAT permissions via repo GET
      const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const authHeader = cleanToken.startsWith('github_pat_') ? `Bearer ${cleanToken}` : `token ${cleanToken}`;
      
      const testHeaders: Record<string, string> = {
        'Authorization': authHeader,
        'Accept': 'application/vnd.github.v3+json',
      };

      let testRes: Response;
      try {
        testRes = await fetch(repoApiUrl, { headers: testHeaders });
      } catch (networkError: any) {
        return {
          success: false,
          message: `Impossibile raggiungere GitHub (Failed to fetch). Verifica la connessione di rete, disabilita eventuali estensioni AdBlocker/Brave Shields o controlla l'URL.`,
        };
      }

      if (!testRes.ok) {
        if (testRes.status === 401) {
          return { success: false, message: 'Token GitHub (PAT) non valido o scaduto. Crea un nuovo Personal Access Token da GitHub.' };
        }
        if (testRes.status === 404) {
          return { success: false, message: `Repository non trovato (https://github.com/${owner}/${repo}). Verifica che il nome sia corretto e che il Token abbia permessi 'repo' per repository privati.` };
        }
        return { success: false, message: `Errore GitHub API HTTP ${testRes.status}` };
      }

      // 2. Check if backup file already exists to obtain blob sha
      const fileApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      let fileSha: string | undefined;

      try {
        const getRes = await fetch(`${fileApiUrl}?ref=${branch}`, { headers: testHeaders });
        if (getRes.ok) {
          const getJson = await getRes.json();
          fileSha = getJson.sha;
        }
      } catch (e) {
        console.warn('Backup file does not exist yet on GitHub repository:', e);
      }

      // 3. Put/Create file via GitHub REST API
      const bodyData = {
        message: commitMessage,
        content: utf8ToBase64(backupJsonStr),
        branch: branch,
        ...(fileSha ? { sha: fileSha } : {}),
      };

      const putRes = await fetch(fileApiUrl, {
        method: 'PUT',
        headers: {
          ...testHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      if (!putRes.ok) {
        const errJson = await putRes.json().catch(() => ({}));
        return { success: false, message: errJson.message || `Errore scrittura su GitHub: HTTP ${putRes.status}` };
      }

      return { success: true, message: `Backup pushato con successo su GitHub (${owner}/${repo})!` };
    }

    if (gitConfig.provider === 'gitlab') {
      const baseUrl = gitConfig.apiUrl || 'https://gitlab.com';
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const filePathEnc = encodeURIComponent(filePath);
      const url = `${baseUrl}/api/v4/projects/${projectPath}/repository/files/${filePathEnc}`;

      const headers: Record<string, string> = {
        'PRIVATE-TOKEN': cleanToken,
        'Content-Type': 'application/json',
      };

      let method = 'POST';
      try {
        const checkRes = await fetch(`${url}?ref=${branch}`, { headers });
        if (checkRes.ok) {
          method = 'PUT';
        }
      } catch (e) {}

      const bodyData = {
        branch: branch,
        commit_message: commitMessage,
        content: backupJsonStr,
      };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Errore HTTP ${res.status}`);
      }

      return { success: true, message: `Backup pushato con successo su GitLab!` };
    }

    if (gitConfig.provider === 'gitea') {
      const baseUrl = (gitConfig.apiUrl || 'https://gitea.com').replace(/\/$/, '');
      const url = `${baseUrl}/api/v1/repos/${owner}/${repo}/contents/${filePath}`;

      const headers: Record<string, string> = {
        'Authorization': `token ${cleanToken}`,
        'Content-Type': 'application/json',
      };

      let sha: string | undefined;
      try {
        const checkRes = await fetch(`${url}?ref=${branch}`, { headers });
        if (checkRes.ok) {
          const getJson = await checkRes.json();
          sha = getJson.sha;
        }
      } catch (e) {}

      const bodyData = {
        message: commitMessage,
        content: utf8ToBase64(backupJsonStr),
        branch: branch,
        ...(sha ? { sha } : {}),
      };

      const res = await fetch(url, {
        method: sha ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Errore HTTP ${res.status}`);
      }

      return { success: true, message: `Backup pushato con successo su Gitea!` };
    }

    return { success: false, message: 'Provider Git non supportato.' };
  } catch (err: any) {
    console.error('Git Push Error:', err);
    return { success: false, message: `Errore Push Git: ${err.message || err}` };
  }
}

/**
 * Pull backup JSON data from Git repository via REST API
 */
export async function pullFromGit(gitConfig: GitConfig): Promise<{ success: boolean; data?: BackupData; message: string }> {
  const { owner, repo } = sanitizeGitRepoParams(gitConfig.repoOwner, gitConfig.repoName);
  const cleanToken = (gitConfig.token || '').trim();

  if (!cleanToken || !owner || !repo) {
    return { success: false, message: 'Configurazione Git incompleta. Inserire Token, Owner e Repository.' };
  }

  const filePath = gitConfig.filePath || 'webritenuta_backup.json';
  const branch = gitConfig.branch || 'main';

  try {
    if (gitConfig.provider === 'github' || !gitConfig.provider) {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
      const authHeader = cleanToken.startsWith('github_pat_') ? `Bearer ${cleanToken}` : `token ${cleanToken}`;

      const headers: Record<string, string> = {
        'Authorization': authHeader,
        'Accept': 'application/vnd.github.v3+json',
      };

      let res: Response;
      try {
        res = await fetch(url, { headers });
      } catch (e: any) {
        return { success: false, message: 'Impossibile connettersi a GitHub API (Failed to fetch). Riprova tra poco.' };
      }

      if (!res.ok) {
        if (res.status === 404) {
          return { success: false, message: `File ${filePath} o repository non trovato su GitHub. Fai prima un 'Push su Git'.` };
        }
        return { success: false, message: `Impossibile scaricare il file. HTTP ${res.status}` };
      }

      const json = await res.json();
      const decodedStr = base64ToUtf8(json.content);
      const backupData: BackupData = JSON.parse(decodedStr);

      return { success: true, data: backupData, message: 'Backup scaricato con successo da GitHub!' };
    }

    if (gitConfig.provider === 'gitlab') {
      const baseUrl = gitConfig.apiUrl || 'https://gitlab.com';
      const projectPath = encodeURIComponent(`${owner}/${repo}`);
      const filePathEnc = encodeURIComponent(filePath);
      const url = `${baseUrl}/api/v4/projects/${projectPath}/repository/files/${filePathEnc}/raw?ref=${branch}`;

      const headers: Record<string, string> = {
        'PRIVATE-TOKEN': cleanToken,
      };

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Impossibile scaricare il file da GitLab. HTTP ${res.status}`);
      }

      const backupStr = await res.text();
      const backupData: BackupData = JSON.parse(backupStr);

      return { success: true, data: backupData, message: 'Backup scaricato con successo da GitLab!' };
    }

    if (gitConfig.provider === 'gitea') {
      const baseUrl = (gitConfig.apiUrl || 'https://gitea.com').replace(/\/$/, '');
      const url = `${baseUrl}/api/v1/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

      const headers: Record<string, string> = {
        'Authorization': `token ${cleanToken}`,
      };

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Impossibile scaricare il file da Gitea. HTTP ${res.status}`);
      }

      const json = await res.json();
      const decodedStr = base64ToUtf8(json.content);
      const backupData: BackupData = JSON.parse(decodedStr);

      return { success: true, data: backupData, message: 'Backup scaricato con successo da Gitea!' };
    }

    return { success: false, message: 'Provider Git non riconosciuto.' };
  } catch (err: any) {
    console.error('Git Pull Error:', err);
    return { success: false, message: `Errore Pull Git: ${err.message || err}` };
  }
}
