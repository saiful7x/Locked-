import { useState } from 'react';
import { Check, Copy, Download, FileCode2, GitBranch } from 'lucide-react';
import { ANDROID_KOTLIN_FILES } from '../data/androidKotlinTemplates';
import { createZipBlob } from '../utils/zipBuilder';

export function AndroidCodePanel() {
  const [selectedId, setSelectedId] = useState<string>(ANDROID_KOTLIN_FILES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const activeFile =
    ANDROID_KOTLIN_FILES.find((f) => f.id === selectedId) ?? ANDROID_KOTLIN_FILES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setCopiedId(activeFile.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback ignored in restricted clipboard contexts
    }
  };

  const handleDownloadZip = () => {
    const entries = ANDROID_KOTLIN_FILES.map((file) => ({
      path: file.path,
      content: file.code,
    }));
    const blob = createZipBlob(entries);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'saiful-lock-ai-android-github.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-emerald-900/50 bg-[#070b09]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <FileCode2 className="h-4 w-4 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              GitHub Actions Android APK Project
            </h3>
            <p className="text-xs text-slate-400">
              Complete Gradle + Kotlin + GitHub Workflow (.github/workflows/build-apk.yml)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadZip}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 whitespace-nowrap shrink-0"
          >
            {downloaded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                ZIP Downloaded
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Download GitHub ZIP
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-emerald-700/50 bg-emerald-950/60 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/70 whitespace-nowrap shrink-0"
          >
            {copiedId === activeFile.id ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy File
              </>
            )}
          </button>
        </div>
      </div>

      {/* GitHub Build Quick Steps */}
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-900/30 bg-[#050b08] px-4 py-2 text-xs text-slate-300">
        <GitBranch className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
        <span>
          <strong className="text-emerald-400">GitHub APK Build:</strong>{' '}
          1) Download GitHub ZIP করে Unzip করুন · 2) `.github` ফোল্ডারসহ GitHub Repo-তে Push/Upload করুন · 3) Actions ট্যাব থেকে `app-debug.apk` ডাউনলোড করুন।
        </span>
      </div>

      {/* File Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-emerald-900/30 bg-[#040806] px-3 py-2">
        {ANDROID_KOTLIN_FILES.map((file) => {
          const isActive = file.id === activeFile.id;
          return (
            <button
              key={file.id}
              type="button"
              onClick={() => setSelectedId(file.id)}
              className={`min-h-[34px] rounded-lg px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'border border-emerald-500/40 bg-emerald-600/20 text-emerald-300'
                  : 'border border-transparent text-slate-400 hover:bg-emerald-950/40 hover:text-slate-200'
              }`}
            >
              {file.filename}
            </button>
          );
        })}
      </div>

      {/* File summary & path */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/25 bg-[#050907] px-4 py-2 text-xs">
        <span className="font-mono text-cyan-400">{activeFile.path}</span>
        <span className="text-slate-400">{activeFile.summary}</span>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="font-mono text-xs leading-relaxed text-emerald-100/90">
          <code>{activeFile.code}</code>
        </pre>
      </div>
    </div>
  );
}
