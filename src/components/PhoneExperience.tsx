import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BellOff,
  Camera,
  CheckCircle2,
  Delete,
  FolderOpen,
  Lock,
  MessageSquare,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Unlock,
  Wifi,
  Signal,
  Sun,
  Flashlight,
  X,
} from 'lucide-react';
import { MatrixRainCanvas } from './MatrixRainCanvas';

export interface PhoneNotification {
  id: string;
  app: string;
  title: string;
  body: string;
  time: string;
}

export type PhoneRoute =
  | 'app-permission'
  | 'android-overlay-settings'
  | 'app-ready'
  | 'android-accessibility-settings'
  | 'phone-home';

interface PhoneExperienceProps {
  route: PhoneRoute;
  setRoute: (route: PhoneRoute) => void;
  displayOverlayGranted: boolean;
  onToggleOverlayPermission: (granted: boolean) => void;
  accessibilityGranted: boolean;
  onToggleAccessibility: (granted: boolean) => void;
  notificationBlockGranted: boolean;
  onToggleNotificationBlock: (granted: boolean) => void;
  isLocked: boolean;
  onStartLock: () => void;
  onUnlockSuccess: () => void;
  pinCode: string;
  notifications: PhoneNotification[];
  onClearNotifications: () => void;
  blockedAttempts: number;
  onBlockedAttempt: (reason: string) => void;
  isFullViewportLock?: boolean;
  onExitFullViewportLock?: () => void;
}

export function PhoneExperience({
  route,
  setRoute,
  displayOverlayGranted,
  onToggleOverlayPermission,
  accessibilityGranted,
  onToggleAccessibility,
  notificationBlockGranted,
  onToggleNotificationBlock,
  isLocked,
  onStartLock,
  onUnlockSuccess,
  pinCode,
  notifications,
  onClearNotifications,
  blockedAttempts,
  onBlockedAttempt,
  isFullViewportLock = false,
  onExitFullViewportLock,
}: PhoneExperienceProps) {
  const [shadeOpen, setShadeOpen] = useState(false);
  const [wifiOn, setWifiOn] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [brightness, setBrightness] = useState(80);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [blockToast, setBlockToast] = useState<string | null>(null);
  const [activeDummyApp, setActiveDummyApp] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const dragStartY = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Close shade automatically when locked
  useEffect(() => {
    if (isLocked) {
      setShadeOpen(false);
      setActiveDummyApp(null);
      setEnteredPin('');
      setPinError('');
    }
  }, [isLocked]);

  const triggerBlockedFeedback = (message: string) => {
    onBlockedAttempt(message);
    setBlockToast(message);
    setShakeTrigger(true);
    setTimeout(() => setShakeTrigger(false), 350);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setBlockToast(null);
    }, 2400);
  };

  const handleStatusBarPointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
  };

  const handleStatusBarPointerUp = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const deltaY = e.clientY - dragStartY.current;
    dragStartY.current = null;

    // Treat either downward swipe (>16px) or direct tap as attempting to pull down shutter
    if (deltaY > 12 || Math.abs(deltaY) < 8) {
      if (isLocked) {
        triggerBlockedFeedback('শাটার ও নোটিফিকেশন ব্লক করা আছে — আনলক করুন');
      } else {
        setShadeOpen((prev) => !prev);
      }
    }
  };

  const handleNavAction = (action: 'back' | 'home' | 'recents') => {
    if (isLocked) {
      triggerBlockedFeedback('সিস্টেম নেভিগেশন ব্লক করা আছে — আগে আনলক করুন');
      return;
    }

    if (shadeOpen) {
      setShadeOpen(false);
      return;
    }

    if (activeDummyApp) {
      setActiveDummyApp(null);
      return;
    }

    if (action === 'home') {
      setRoute('phone-home');
    } else if (action === 'back') {
      if (route === 'android-overlay-settings') {
        setRoute(displayOverlayGranted ? 'app-ready' : 'app-permission');
      } else if (route === 'android-accessibility-settings') {
        setRoute('app-ready');
      } else if (route === 'app-ready' || route === 'app-permission') {
        setRoute('phone-home');
      }
    } else if (action === 'recents') {
      setRoute(displayOverlayGranted ? 'app-ready' : 'app-permission');
    }
  };

  const handlePinDigit = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const next = enteredPin + digit;
    setEnteredPin(next);
    setPinError('');

    if (next.length === 4) {
      if (next === pinCode) {
        setTimeout(() => {
          setEnteredPin('');
          setPinError('');
          setShowHint(false);
          onUnlockSuccess();
          if (onExitFullViewportLock) {
            onExitFullViewportLock();
          }
        }, 160);
      } else {
        setShakeTrigger(true);
        setPinError('ভুল পিন! আবার চেষ্টা করুন');
        setTimeout(() => {
          setShakeTrigger(false);
          setEnteredPin('');
        }, 420);
      }
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const handlePinClear = () => {
    setEnteredPin('');
    setPinError('');
  };

  const isLightStatusScreen =
    !isLocked &&
    !shadeOpen &&
    (route === 'android-overlay-settings' || route === 'android-accessibility-settings');

  return (
    <div
      className={`relative flex flex-col overflow-hidden bg-[#020604] select-none ${
        isFullViewportLock
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
          : 'h-[760px] w-full max-w-[390px] rounded-[38px] border-[6px] border-zinc-800 shadow-[0_24px_80px_rgba(0,0,0,0.85)]'
      }`}
    >
      {/* Top Android Status Bar (Always Interactive for Shutter Pull-Down Test) */}
      <div
        role="button"
        tabIndex={0}
        aria-label={isLocked ? 'Status bar (blocked while locked)' : 'Pull down notification shade'}
        onPointerDown={handleStatusBarPointerDown}
        onPointerUp={handleStatusBarPointerUp}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (isLocked) {
              triggerBlockedFeedback('শাটার ও নোটিফিকেশন ব্লক করা আছে — আনলক করুন');
            } else {
              setShadeOpen((p) => !p);
            }
          }
        }}
        className={`relative z-40 flex h-9 w-full cursor-pointer items-center justify-between px-5 text-xs font-semibold transition-colors ${
          isLightStatusScreen
            ? 'bg-white text-slate-900'
            : 'bg-black/40 text-slate-100 backdrop-blur-sm'
        }`}
      >
        <div className="flex items-center gap-2 tabular-nums">
          <span>5:07</span>
          {!isLocked && notifications.length > 0 && (
            <span className="text-[10px] font-medium text-emerald-400">
              • {notifications.length} new
            </span>
          )}
          {isLocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-red-400">
              <Lock className="h-2.5 w-2.5" /> SHIELD
            </span>
          )}
        </div>

        {/* Center subtle pull-down handle */}
        <div
          className={`h-1 w-10 rounded-full ${
            isLightStatusScreen ? 'bg-slate-300' : 'bg-white/25'
          }`}
        />

        <div className="flex items-center gap-1.5 tabular-nums">
          <Signal className="h-3.5 w-3.5" />
          {wifiOn && <Wifi className="h-3.5 w-3.5" />}
          <span className="inline-flex items-center gap-0.5 rounded border border-current/40 px-1 py-0.2 text-[10px]">
            42
          </span>
        </div>
      </div>

      {/* Blocked Shutter / Navigation Warning Banner */}
      {blockToast && (
        <div className="pointer-events-none absolute top-11 left-3 right-3 z-50 flex items-center gap-2 rounded-xl border border-red-500/60 bg-red-950/95 px-3.5 py-2.5 text-xs font-medium text-red-100 shadow-lg backdrop-blur-md">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
          <span>{blockToast}</span>
        </div>
      )}

      {/* Main Viewport Content */}
      <div className="relative flex-1 overflow-hidden">
        {/* 1. PERMISSION STEP SCREEN (Matches Screenshot 2) */}
        {route === 'app-permission' && !isLocked && (
          <div className="relative flex h-full flex-col justify-between p-4">
            <MatrixRainCanvas />

            <div className="relative z-10 flex flex-col">
              {/* Top App Header */}
              <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3 pt-1">
                <span className="font-mono text-lg font-semibold tracking-tight text-[#22c55e]">
                  Saiful Lock AI
                </span>
                <span className="font-mono text-xs font-medium text-cyan-400">
                  Permission Step
                </span>
              </div>

              {/* Code Ticker */}
              <p className="mt-2 truncate font-mono text-[11px] text-emerald-700/90">
                01001011 · attachOverlayChannel(DISPLAY_OVER_APPS) · shield
              </p>
            </div>

            {/* Center Permission Card */}
            <div className="relative z-10 rounded-2xl border border-emerald-800/50 bg-[#070b09]/92 p-5 shadow-2xl backdrop-blur-sm">
              <p className="font-mono text-xs font-medium text-cyan-400">
                Display Permission Required
              </p>
              <h1 className="mt-2 text-2xl font-bold leading-snug text-[#22c55e]">
                এক্টিভ করার জন্য ডিসপ্লে পারমিশন দিন
              </h1>
              <p className="mt-3 text-[13.5px] leading-relaxed text-slate-300">
                প্যানেল কানেক্ট করার জন্য ডিসপ্লে ওভারলে পারমিশন দিন। পারমিশন দেওয়ার পর
                ভেতরে গিয়ে{' '}
                <span className="font-semibold text-amber-400">Start Screen Lock</span>{' '}
                চাপলে শাটার ও সম্পূর্ণ ফোন লক চালু হবে।
              </p>

              <button
                type="button"
                onClick={() => setRoute('android-overlay-settings')}
                className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#0ea86b] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#10b977] active:scale-[0.98]"
              >
                কানেক্ট করার জন্য পারমিশন দিন
              </button>
            </div>

            {/* Footer Card */}
            <div className="relative z-10 flex items-center justify-between rounded-2xl border border-amber-500/35 bg-[#0a0c08]/95 px-4 py-3.5">
              <div>
                <p className="text-[11px] font-medium text-amber-400">
                  Crafted &amp; Engineered
                </p>
                <p className="font-mono text-sm font-semibold text-slate-100">
                  Developed by Saiful
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-cyan-400">
                Saiful Sir
              </span>
            </div>
          </div>
        )}

        {/* 2. ANDROID SYSTEM SETTINGS: DISPLAY OVER OTHER APPS (Matches Screenshot 1) */}
        {route === 'android-overlay-settings' && !isLocked && (
          <div className="relative flex h-full bg-[#e5e5e5] text-slate-900">
            {/* Dimmed Background Apps List on Left */}
            <div className="w-[14%] overflow-hidden bg-[#c8c8c8] px-1.5 pt-3 text-xs font-medium text-slate-800 select-none">
              <div className="mb-5 text-lg font-bold tracking-tight opacity-70">play</div>
              <div className="space-y-5 text-[11px] opacity-80">
                <div>Andr</div>
                <div>Brilli</div>
                <div>Calcu</div>
                <div>Cam</div>
                <div>CapC</div>
                <div>Clear</div>
                <div>Cross</div>
                <div>Face</div>
                <div>File M</div>
                <div>FM R</div>
                <div>Galle</div>
              </div>
            </div>

            {/* White Android Settings Slide-Over Sheet */}
            <div className="flex flex-1 flex-col rounded-l-3xl bg-[#f8f9fa] px-5 pt-4 pb-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Back"
                  onClick={() =>
                    setRoute(displayOverlayGranted ? 'app-ready' : 'app-permission')
                  }
                  className="flex h-10 w-10 -ml-2 items-center justify-center rounded-full text-slate-800 hover:bg-slate-200/70"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>

              <h2 className="mt-3 text-[26px] font-normal leading-tight text-slate-900">
                Display over other apps
              </h2>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-xs border border-slate-200/70">
                <span className="text-[15px] font-medium text-slate-900">
                  Allow display over other apps
                </span>

                {/* Android Material Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={displayOverlayGranted}
                  aria-label="Allow display over other apps"
                  onClick={() => onToggleOverlayPermission(!displayOverlayGranted)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    displayOverlayGranted ? 'bg-[#1a73e8]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      displayOverlayGranted ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-slate-600">
                Allow this app to display on top of other apps that you&apos;re using.
                This app will be able to see where you tap, block the notification shutter,
                and lock what&apos;s displayed on the screen until unlocked.
              </p>

              {displayOverlayGranted && (
                <div className="mt-auto">
                  <button
                    type="button"
                    onClick={() => setRoute('app-ready')}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1558b3]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    পারমিশন চালু হয়েছে — ফিরে যান
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. READY TO LOCK SCREEN (Matches Screenshot 3) */}
        {route === 'app-ready' && !isLocked && (
          <div className="relative flex h-full flex-col justify-between p-4">
            <MatrixRainCanvas />

            <div className="relative z-10 flex flex-col">
              <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2.5 pt-1">
                <span className="font-mono text-lg font-semibold tracking-tight text-[#22c55e]">
                  Saiful Lock AI
                </span>
                <span className="font-mono text-xs font-medium text-cyan-400">
                  Ready to Lock
                </span>
              </div>

              <p className="mt-2 truncate font-mono text-[11px] text-emerald-700/90">
                01001011 · attachOverlayChannel(DISPLAY_OVER_APPS) · active
              </p>
            </div>

            {/* Main Ready Panel Card */}
            <div className="relative z-10 my-auto rounded-2xl border border-emerald-800/50 bg-[#070b09]/92 p-4.5 shadow-2xl backdrop-blur-sm">
              <p className="text-xs font-semibold text-[#22c55e]">
                ডিসপ্লে পারমিশন সক্রিয়
              </p>
              <h1 className="mt-1 font-mono text-xl font-bold leading-snug text-[#22c55e]">
                shutter &amp; phone lock ready
              </h1>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-300">
                <span className="font-semibold text-amber-400">Start Screen Lock</span>{' '}
                চাপলেই ফুল-স্ক্রিন লক চালু হবে। আনলক না করা পর্যন্ত উপর থেকে{' '}
                <span className="font-semibold text-cyan-400">শাটার ও নোটিফিকেশন</span>{' '}
                সহ কিছুই ব্যবহার করা যাবে না।
              </p>

              {/* Red Primary Lock Button */}
              <button
                type="button"
                onClick={onStartLock}
                className="mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#dc2626] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/50 transition-colors hover:bg-[#b91c1c] active:scale-[0.98]"
              >
                <Lock className="h-4 w-4" />
                Start Screen Lock
              </button>

              {/* Accessibility Permission Row */}
              <button
                type="button"
                onClick={() => setRoute('android-accessibility-settings')}
                className="mt-2.5 flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/25 px-3.5 py-2.5 text-left transition-colors hover:bg-cyan-950/40"
              >
                <span className="font-mono text-xs font-medium text-cyan-200">
                  Accessibility__ পারমিশন দিন
                  <span className="block text-[11px] text-cyan-400/80">
                    (Shutter &amp; Nav Blocker)
                  </span>
                </span>
                {accessibilityGranted ? (
                  <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                    ALLOWED
                  </span>
                ) : (
                  <span className="font-mono text-[11px] font-bold text-red-400 text-right shrink-0">
                    OFF · Tap to Enable
                  </span>
                )}
              </button>

              {/* Notification & App Shield Row */}
              <button
                type="button"
                onClick={() => onToggleNotificationBlock(!notificationBlockGranted)}
                className="mt-2.5 flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/25 px-3.5 py-2.5 text-left transition-colors hover:bg-emerald-950/40"
              >
                <span className="font-mono text-xs font-medium text-emerald-200">
                  APP পারমিশন (Notification)
                </span>
                <span
                  className={`font-mono text-xs font-bold shrink-0 ${
                    notificationBlockGranted ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {notificationBlockGranted ? 'ALLOWED' : 'OFF · Tap'}
                </span>
              </button>

              {/* FAQ Section matching Screenshot 3 */}
              <div className="mt-4 space-y-2.5 border-t border-emerald-900/40 pt-3">
                <div>
                  <p className="text-xs font-semibold text-[#22c55e]">
                    01. এটা কে বানিয়েছে?
                  </p>
                  <p className="text-xs font-medium text-amber-400">
                    উত্তর: Saiful Sir
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#22c55e]">
                    02. এটা আনলক করবো কিভাবে?
                  </p>
                  <p className="text-xs font-medium text-amber-400">
                    উত্তর: আনলক স্ক্রিনে আপনার PIN ({pinCode}) দিলেই অফ হয়ে যাবে
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Card */}
            <div className="relative z-10 flex items-center justify-between rounded-2xl border border-amber-500/35 bg-[#0a0c08]/95 px-4 py-3">
              <div>
                <p className="text-[11px] font-medium text-amber-400">
                  Crafted &amp; Engineered
                </p>
                <p className="font-mono text-sm font-semibold text-slate-100">
                  Developed by Saiful
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-cyan-400">
                Saiful Sir
              </span>
            </div>
          </div>
        )}

        {/* 4. ANDROID ACCESSIBILITY PERMISSION SHEET */}
        {route === 'android-accessibility-settings' && !isLocked && (
          <div className="flex h-full flex-col bg-[#f8f9fa] px-5 pt-4 pb-6 text-slate-900">
            <button
              type="button"
              aria-label="Back"
              onClick={() => setRoute('app-ready')}
              className="flex h-10 w-10 -ml-2 items-center justify-center rounded-full text-slate-800 hover:bg-slate-200/70"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <h2 className="mt-3 text-2xl font-normal text-slate-900">
              Saiful Lock AI Service
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Accessibility · Status Bar &amp; Navigation Guard
            </p>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-xs">
              <span className="text-[15px] font-medium text-slate-900">
                Use Saiful Lock AI
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={accessibilityGranted}
                aria-label="Use Saiful Lock AI Accessibility Service"
                onClick={() => onToggleAccessibility(!accessibilityGranted)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  accessibilityGranted ? 'bg-[#1a73e8]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    accessibilityGranted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 space-y-2 px-1 text-xs leading-relaxed text-slate-600">
              <p>
                When enabled, Saiful Lock AI can immediately collapse the notification
                shutter and lock Home/Back/Recents navigation while the lock screen is
                active.
              </p>
              <p className="font-medium text-slate-800">
                Unlocking with your PIN restores full control of the phone.
              </p>
            </div>

            <div className="mt-auto">
              <button
                type="button"
                onClick={() => setRoute('app-ready')}
                className="flex min-h-[46px] w-full items-center justify-center rounded-xl bg-[#1a73e8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1558b3]"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* 5. UNLOCKED PHONE HOME SCREEN (Proof that phone works normally after unlock!) */}
        {route === 'phone-home' && !isLocked && (
          <div className="relative flex h-full flex-col justify-between bg-gradient-to-b from-[#0b1713] via-[#07100d] to-[#030605] p-5">
            {/* Top Clock Widget */}
            <div className="mt-4">
              <p className="font-mono text-4xl font-light tracking-tight text-white tabular-nums">
                5:07
              </p>
              <p className="mt-1 text-xs text-emerald-300/80">
                Phone Unlocked · Pull down top bar for notifications
              </p>
            </div>

            {/* Active Dummy App Overlay if tapped */}
            {activeDummyApp ? (
              <div className="my-auto rounded-2xl border border-emerald-700/40 bg-[#0b1511] p-5 text-center">
                <p className="font-mono text-sm font-semibold text-emerald-400">
                  {activeDummyApp}
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  ফোন আনলক থাকায় আপনি এখন যেকোনো অ্যাপ ব্যবহার করতে ও শাটার নামাতে পারছেন।
                </p>
                <button
                  type="button"
                  onClick={() => setActiveDummyApp(null)}
                  className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Close App
                </button>
              </div>
            ) : (
              /* App Grid */
              <div className="my-auto grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setRoute(displayOverlayGranted ? 'app-ready' : 'app-permission')
                  }
                  className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-3 transition-transform active:scale-95"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-medium text-emerald-200">
                    Saiful Lock
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDummyApp('Messages')}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 transition-transform active:scale-95"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">
                    Messages
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDummyApp('Camera')}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 transition-transform active:scale-95"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                    <Camera className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">
                    Camera
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDummyApp('Files')}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 transition-transform active:scale-95"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">
                    Files
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRoute('android-overlay-settings')}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 transition-transform active:scale-95"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/20 text-slate-300">
                    <Settings className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">
                    Settings
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShadeOpen(true)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 transition-transform active:scale-95"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">
                    Open Shutter
                  </span>
                </button>
              </div>
            )}

            <div className="rounded-xl border border-emerald-800/30 bg-black/40 px-3.5 py-2.5 text-center text-[11px] text-slate-400">
              পুনরায় লক করতে <span className="text-emerald-400 font-semibold">Saiful Lock</span> অ্যাপ ওপেন করুন
            </div>
          </div>
        )}

        {/* 6. PULL-DOWN NOTIFICATION SHADE (ONLY ACCESSIBLE WHEN UNLOCKED) */}
        {shadeOpen && !isLocked && (
          <div className="absolute inset-0 z-30 flex flex-col bg-[#080d0b]/95 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3">
              <span className="font-mono text-xs font-semibold text-emerald-400">
                Notification Shutter · Quick Settings
              </span>
              <button
                type="button"
                aria-label="Close shutter"
                onClick={() => setShadeOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-200 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Settings Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setWifiOn((w) => !w)}
                className={`flex min-h-[48px] items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${
                  wifiOn
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                <Wifi className="h-4 w-4 shrink-0" />
                <span>{wifiOn ? 'Wi-Fi · On' : 'Wi-Fi · Off'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTorchOn((t) => !t)}
                className={`flex min-h-[48px] items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                <Flashlight className="h-4 w-4 shrink-0" />
                <span>{torchOn ? 'Torch · On' : 'Torch · Off'}</span>
              </button>
            </div>

            {/* Brightness Slider */}
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/5 px-3.5 py-2.5">
              <Sun className="h-4 w-4 text-amber-400" />
              <input
                type="range"
                min={20}
                max={100}
                value={brightness}
                aria-label="Screen brightness"
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="h-1.5 w-full accent-emerald-500"
              />
              <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                {brightness}%
              </span>
            </div>

            {/* Notifications List */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Notifications ({notifications.length})
              </span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearNotifications}
                  className="text-xs font-medium text-emerald-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-xs text-slate-500">
                  কোনো নতুন নোটিফিকেশন নেই
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-emerald-900/40 bg-[#0d1612] p-3"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-400">
                        {item.app}
                      </span>
                      <span className="text-slate-500 tabular-nums">{item.time}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-100">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{item.body}</p>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShadeOpen(false)}
              className="mt-3 flex min-h-[40px] w-full items-center justify-center rounded-xl bg-white/10 text-xs font-medium text-slate-200 hover:bg-white/15"
            >
              Pull Up to Close
            </button>
          </div>
        )}

        {/* 7. FULL-SCREEN LOCK OVERLAY (BLOCKS EVERYTHING UNTIL PIN UNLOCK) */}
        {isLocked && (
          <div className="absolute inset-0 z-30 flex flex-col justify-between p-5">
            <MatrixRainCanvas locked />

            {/* Top Shield Indicator */}
            <div className="relative z-10 flex flex-col items-center pt-2 text-center">
              <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-red-400">
                <BellOff className="h-3.5 w-3.5" />
                <span>SHUTTER BLOCKED · NOTIFICATIONS HIDDEN</span>
              </div>

              <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/40 bg-red-950/40 text-red-400 shadow-lg">
                <Lock className="h-6 w-6" />
              </div>

              <h2 className="mt-3 text-xl font-bold text-white">
                ফোন লক করা আছে
              </h2>
              <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-slate-300">
                আনলক না করা পর্যন্ত শাটার, নোটিফিকেশন ও অন্যান্য কোনো কিছু ব্যবহার বা দেখা
                যাবে না।
              </p>

              {blockedAttempts > 0 && (
                <p className="mt-1.5 font-mono text-[11px] text-amber-400 tabular-nums">
                  Blocked attempts: {blockedAttempts}
                </p>
              )}
            </div>

            {/* PIN Dots */}
            <div
              className={`relative z-10 flex flex-col items-center ${
                shakeTrigger ? 'animate-shake' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = idx < enteredPin.length;
                  return (
                    <div
                      key={idx}
                      className={`h-3.5 w-3.5 rounded-full border transition-all ${
                        filled
                          ? 'scale-110 border-emerald-400 bg-emerald-400'
                          : 'border-slate-500 bg-transparent'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="mt-2.5 min-h-[18px] text-xs font-medium text-red-400">
                {pinError || 'আনলক করতে ৪ সংখ্যার PIN দিন'}
              </p>
            </div>

            {/* Numeric Keypad */}
            <div className="relative z-10 mx-auto grid w-full max-w-[270px] grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(digit)}
                  className="flex h-14 items-center justify-center rounded-2xl border border-emerald-800/45 bg-[#08120e]/85 font-mono text-xl font-semibold text-slate-100 transition-colors hover:border-emerald-500/60 hover:bg-emerald-950/70 active:scale-95"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                aria-label="Clear PIN"
                onClick={handlePinClear}
                className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="flex h-14 items-center justify-center rounded-2xl border border-emerald-800/45 bg-[#08120e]/85 font-mono text-xl font-semibold text-slate-100 transition-colors hover:border-emerald-500/60 hover:bg-emerald-950/70 active:scale-95"
              >
                0
              </button>

              <button
                type="button"
                aria-label="Delete digit"
                onClick={handlePinBackspace}
                className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 active:scale-95"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>

            {/* Bottom Pin Hint & Saiful Footer */}
            <div className="relative z-10 flex items-center justify-between pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => setShowHint((h) => !h)}
                className="inline-flex items-center gap-1 font-mono text-slate-400 hover:text-emerald-300"
              >
                <Unlock className="h-3 w-3" />
                {showHint ? `PIN: ${pinCode}` : 'PIN Hint?'}
              </button>
              <span className="font-mono text-emerald-500/80">
                Saiful Lock AI
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Android Navigation Bar (Blocked while Locked!) */}
      <div
        className={`relative z-40 flex h-11 w-full items-center justify-around border-t px-8 ${
          isLightStatusScreen
            ? 'border-slate-200 bg-[#f8f9fa] text-slate-600'
            : 'border-white/5 bg-[#040706] text-slate-400'
        }`}
      >
        <button
          type="button"
          aria-label="Recent apps"
          onClick={() => handleNavAction('recents')}
          className="flex h-9 w-12 items-center justify-center rounded-lg hover:bg-white/10"
        >
          <span className="h-3.5 w-3.5 rounded-[3px] border-[1.8px] border-current" />
        </button>

        <button
          type="button"
          aria-label="Home"
          onClick={() => handleNavAction('home')}
          className="flex h-9 w-16 items-center justify-center rounded-lg hover:bg-white/10"
        >
          <span className="h-1.5 w-16 rounded-full bg-current opacity-80" />
        </button>

        <button
          type="button"
          aria-label="Back"
          onClick={() => handleNavAction('back')}
          className="flex h-9 w-12 items-center justify-center rounded-lg hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
