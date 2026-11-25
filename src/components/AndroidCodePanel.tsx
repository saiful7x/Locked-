import { useState } from 'react';
import { Check, Copy, Download, FileCode2, GitBranch } from 'lucide-react';
import { ANDROID_KOTLIN_FILES } from '../data/androidKotlinTemplates';
import { createZipBlob } from '../utils/zipBuilder';

export function AndroidCodePanel() {
  const [selectedId, setSelectedId] = useState<string>(ANDROID_KOTLIN_FILES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const activeFile =
    ANDROID_KOTLIN_FILES.find((f) => f.id === selectedId) ?? ANDROID_KOTLIN_FILES[0];
  const workflowFile = ANDROID_KOTLIN_FILES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setCopiedId(activeFile.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback ignored in restricted clipboard contexts
    }
  };

  const handleCopyWorkflow = async () => {
    try {
      await navigator.clipboard.writeText(workflowFile.code);
      setCopiedWorkflow(true);
      setSelectedId(workflowFile.id);
      setTimeout(() => setCopiedWorkflow(false), 2000);
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
              Mobile Browser-Friendly: Upload ZIP + Paste build-apk.yml in New Workflow
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={handleCopyWorkflow}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-cyan-600/50 bg-cyan-950/50 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-900/60 whitespace-nowrap shrink-0"
          >
            {copiedWorkflow ? (
              <>
                <Check className="h-3.5 w-3.5 text-cyan-400" />
                Workflow Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Workflow YAML
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
      <div className="flex flex-col gap-1 border-b border-emerald-900/30 bg-[#050b08] px-4 py-2.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <GitBranch className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <strong className="text-emerald-400">
            ফোন থেকে GitHub APK Build করার নিয়ম (সহজ পদ্ধতি):
          </strong>
        </div>
        <p className="leading-relaxed text-slate-300">
          ১) <strong>Download GitHub ZIP</strong> চাপুন এবং GitHub Repo-তে{' '}
          <code className="text-cyan-300">Add file → Upload files</code> দিয়ে সরাসরি{' '}
          <code className="text-emerald-300">saiful-lock-ai-android-github.zip</code>{' '}
          ফাইলটি আপলোড করে Commit করুন।
        </p>
        <p className="leading-relaxed text-slate-300">
          ২) আপনার স্ক্রিনশটের <strong>Actions</strong> ট্যাবে থাকা{' '}
          <strong className="text-cyan-300">New workflow → set up a workflow yourself</strong>{' '}
          চাপুন, ফাইলের নাম দিন <code className="text-emerald-300">build-apk.yml</code>,
          তারপর <strong>Copy Workflow YAML</strong> বাটন থেকে কোড পেস্ট করে Commit করুন।
          ১–২ মিনিট পর Actions থেকে APK ডাউনলোড করতে পারবেন।
        </p>
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
