import { useCallback, useEffect, useState } from 'react';
import {
  BellPlus,
  Code2,
  KeyRound,
  Lock,
  Maximize2,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Unlock,
} from 'lucide-react';
import {
  PhoneExperience,
  PhoneNotification,
  PhoneRoute,
} from './components/PhoneExperience';
import { AndroidCodePanel } from './components/AndroidCodePanel';

const INITIAL_NOTIFICATIONS: PhoneNotification[] = [
  {
    id: 'n1',
    app: 'Telegram',
    title: 'Saiful Sir',
    body: 'প্যানেল কানেক্ট হয়েছে, লক টেস্ট করুন।',
    time: '5:06 PM',
  },
  {
    id: 'n2',
    app: 'System Shield',
    title: 'Overlay Channel Ready',
    body: 'Display over other apps permission active.',
    time: '5:07 PM',
  },
];

export default function App() {
  const [route, setRoute] = useState<PhoneRoute>('app-permission');
  const [displayOverlayGranted, setDisplayOverlayGranted] = useState(false);
  const [accessibilityGranted, setAccessibilityGranted] = useState(false);
  const [notificationBlockGranted, setNotificationBlockGranted] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [pinCode, setPinCode] = useState('1234');
  const [pinDraft, setPinDraft] = useState('1234');
  const [pinSavedMsg, setPinSavedMsg] = useState(false);
  const [notifications, setNotifications] =
    useState<PhoneNotification[]>(INITIAL_NOTIFICATIONS);
  const [blockedAttempts, setBlockedAttempts] = useState(0);
  const [lastEventLog, setLastEventLog] = useState<string>(
    'Permission Step ready — tap button inside phone to grant Display permission.'
  );
  const [fullViewportLock, setFullViewportLock] = useState(false);
  const [mobileShowCode, setMobileShowCode] = useState(false);

  const handleToggleOverlayPermission = (granted: boolean) => {
    setDisplayOverlayGranted(granted);
    setLastEventLog(
      granted
        ? 'Display over other apps granted (SYSTEM_ALERT_WINDOW).'
        : 'Display over other apps revoked.'
    );
  };

  const handleToggleAccessibility = (granted: boolean) => {
    setAccessibilityGranted(granted);
    setLastEventLog(
      granted
        ? 'Accessibility shutter & navigation blocker enabled.'
        : 'Accessibility shutter blocker turned off.'
    );
  };

  const handleToggleNotificationBlock = (granted: boolean) => {
    setNotificationBlockGranted(granted);
    setLastEventLog(
      granted
        ? 'Notification shield enabled.'
        : 'Notification shield disabled.'
    );
  };

  const activateLock = useCallback(
    async (useFullscreen = false) => {
      if (!displayOverlayGranted) {
        setRoute('android-overlay-settings');
        setLastEventLog('Display permission required before locking.');
        return;
      }
      setBlockedAttempts(0);
      setIsLocked(true);
      setMobileShowCode(false);

      if (useFullscreen) {
        setFullViewportLock(true);
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch {
          // Fullscreen API may be blocked in embedded iframe; CSS fixed overlay still works
        }
      }

      setLastEventLog(
        'Phone LOCKED — Shutter, notifications & navigation blocked until PIN unlock.'
      );
    },
    [displayOverlayGranted]
  );

  const handleUnlockSuccess = useCallback(async () => {
    setIsLocked(false);
    setFullViewportLock(false);
    setRoute('phone-home');
    setLastEventLog(
      'PIN verified — Phone UNLOCKED. Shutter, notifications & apps restored.'
    );
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen exit errors
    }
  }, []);

  // Keep fullViewportLock synced if user exits browser fullscreen with Esc
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && fullViewportLock && !isLocked) {
        setFullViewportLock(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [fullViewportLock, isLocked]);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    const cleaned = pinDraft.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length === 4) {
      setPinCode(cleaned);
      setPinDraft(cleaned);
      setPinSavedMsg(true);
      setLastEventLog(`Unlock PIN updated to ${cleaned}.`);
      setTimeout(() => setPinSavedMsg(false), 1800);
    }
  };

  const handleSendTestNotification = () => {
    const samples = [
      {
        app: 'WhatsApp',
        title: 'New Message',
        body: isLocked
          ? 'Hidden while phone is locked'
          : 'লক ছাড়া অবস্থায় নোটিফিকেশন দেখা যাচ্ছে।',
      },
      {
        app: 'Phone Call',
        title: 'Incoming Voice Call',
        body: isLocked
          ? 'Blocked behind lock shield'
          : 'Call alert visible in notification shutter.',
      },
    ];
    const pick = samples[notifications.length % samples.length];
    const next: PhoneNotification = {
      id: `n-${Date.now()}`,
      app: pick.app,
      title: pick.title,
      body: pick.body,
      time: '5:08 PM',
    };
    setNotifications((prev) => [next, ...prev]);
    setLastEventLog(
      isLocked
        ? `Incoming ${pick.app} notification suppressed behind lock overlay.`
        : `Sent test ${pick.app} notification — pull down top status bar to view.`
    );
  };

  const handleResetFlow = () => {
    if (isLocked) return;
    setDisplayOverlayGranted(false);
    setAccessibilityGranted(false);
    setNotificationBlockGranted(true);
    setBlockedAttempts(0);
    setRoute('app-permission');
    setLastEventLog('Flow reset to initial Permission Step.');
  };

  return (
    <div className="min-h-screen bg-[#030605] text-slate-100">
      {/* Top Studio Header */}
      <header className="border-b border-emerald-900/40 bg-[#050907]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold tracking-tight text-emerald-400 whitespace-nowrap shrink-0">
              Saiful Lock AI
            </span>
            <span className="hidden text-xs text-slate-500 sm:inline">
              Screen Lock &amp; Shutter Shield Studio
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isLocked && (
              <button
                type="button"
                onClick={() => setMobileShowCode((v) => !v)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-950/50 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/60 lg:hidden whitespace-nowrap shrink-0"
              >
                {mobileShowCode ? (
                  <>
                    <Smartphone className="h-3.5 w-3.5" />
                    Phone View
                  </>
                ) : (
                  <>
                    <Code2 className="h-3.5 w-3.5" />
                    GitHub APK Code
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              disabled={!displayOverlayGranted || isLocked}
              onClick={() => activateLock(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Fullscreen Lock Test
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[400px_1fr]">
          {/* Left Column: Interactive Android Device */}
          <div
            className={`flex flex-col items-center ${
              mobileShowCode && !isLocked ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <PhoneExperience
              route={route}
              setRoute={setRoute}
              displayOverlayGranted={displayOverlayGranted}
              onToggleOverlayPermission={handleToggleOverlayPermission}
              accessibilityGranted={accessibilityGranted}
              onToggleAccessibility={handleToggleAccessibility}
              notificationBlockGranted={notificationBlockGranted}
              onToggleNotificationBlock={handleToggleNotificationBlock}
              isLocked={isLocked}
              onStartLock={() => activateLock(false)}
              onUnlockSuccess={handleUnlockSuccess}
              pinCode={pinCode}
              notifications={notifications}
              onClearNotifications={() => setNotifications([])}
              blockedAttempts={blockedAttempts}
              onBlockedAttempt={(reason) => {
                setBlockedAttempts((c) => c + 1);
                setLastEventLog(`Blocked: ${reason}`);
              }}
              isFullViewportLock={fullViewportLock}
              onExitFullViewportLock={() => setFullViewportLock(false)}
            />

            <p className="mt-3 text-center text-xs text-slate-400">
              উপরের স্ট্যাটাস বার (5:07) টেনে নামিয়ে শাটার টেস্ট করুন · লক থাকা অবস্থায়
              শাটার খুলবে না
            </p>
          </div>

          {/* Right Column: Controls + Native Kotlin Code */}
          <div
            className={`flex flex-col gap-6 ${
              mobileShowCode && !isLocked ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Status & Control Panel */}
            <section className="rounded-2xl border border-emerald-900/50 bg-[#070b09] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/40 pb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Lock Shield Control &amp; Permission State
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    পারমিশন স্টেপ থেকে শুরু করে লক ও আনলক আচরণ লাইভ পরীক্ষা করুন
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  {isLocked ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-red-400">
                      <Lock className="h-3.5 w-3.5" />
                      LOCKED · ALL BLOCKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                      <Unlock className="h-3.5 w-3.5" />
                      UNLOCKED · NORMAL USE
                    </span>
                  )}
                </div>
              </div>

              {/* Permission Matrix */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-900/40 bg-[#040806] p-3.5">
                  <p className="text-[11px] text-slate-400">Display Over Apps</p>
                  <p
                    className={`mt-1 font-mono text-xs font-semibold ${
                      displayOverlayGranted ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {displayOverlayGranted ? 'ALLOWED' : 'PENDING STEP 1'}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-900/40 bg-[#040806] p-3.5">
                  <p className="text-[11px] text-slate-400">
                    Accessibility (Shutter)
                  </p>
                  <p
                    className={`mt-1 font-mono text-xs font-semibold ${
                      accessibilityGranted ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {accessibilityGranted ? 'ALLOWED' : 'OFF · OPTIONAL'}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-900/40 bg-[#040806] p-3.5">
                  <p className="text-[11px] text-slate-400">Notification Shield</p>
                  <p
                    className={`mt-1 font-mono text-xs font-semibold ${
                      notificationBlockGranted ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {notificationBlockGranted ? 'ALLOWED' : 'OFF'}
                  </p>
                </div>
              </div>

              {/* PIN Settings + Action Controls */}
              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-emerald-900/40 pt-4 sm:grid-cols-2">
                <form onSubmit={handleSavePin} className="flex flex-col gap-2">
                  <label
                    htmlFor="pin-input"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-300"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
                    4-Digit Unlock PIN (Default: 1234)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="pin-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      disabled={isLocked}
                      value={pinDraft}
                      onChange={(e) =>
                        setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      className="h-10 w-28 rounded-lg border border-emerald-800/60 bg-[#040806] px-3 font-mono text-sm font-semibold tracking-widest text-emerald-300 focus:border-emerald-500 focus:outline-none disabled:opacity-40"
                    />
                    <button
                      type="submit"
                      disabled={isLocked || pinDraft.length !== 4}
                      className="h-10 rounded-lg border border-emerald-700/50 bg-emerald-950/60 px-3.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {pinSavedMsg ? 'Saved' : 'Update PIN'}
                    </button>
                  </div>
                </form>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-slate-300">
                    Simulation Actions
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendTestNotification}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-cyan-800/50 bg-cyan-950/30 px-3 text-xs font-medium text-cyan-300 hover:bg-cyan-950/50 whitespace-nowrap shrink-0"
                    >
                      <BellPlus className="h-3.5 w-3.5" />
                      Send Notification
                    </button>

                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={handleResetFlow}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Flow
                    </button>
                  </div>
                </div>
              </div>

              {/* Latest Action Feedback */}
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-900/35 bg-[#040806] px-3.5 py-2.5 text-xs">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-slate-300">{lastEventLog}</span>
              </div>

              {/* Honest Platform Clarification */}
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                দ্রষ্টব্য: এটি একটি ওয়েব অ্যাপ ও ইন্টারেক্টিভ মোবাইল সিমুলেটর। ব্রাউজার
                সিকিউরিটির কারণে কোনো ওয়েবসাইট ফোনের আসল Android সিস্টেম শাটার বা অন্যান্য
                অ্যাপ লক করতে পারে না — ফোনে আসল APK হিসেবে চালাতে নিচের Kotlin কোডটি
                Android Studio-তে বিল্ড করুন।
              </p>
            </section>

            {/* Native Android Kotlin Source Code Panel */}
            <div className="h-[520px]">
              <AndroidCodePanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
