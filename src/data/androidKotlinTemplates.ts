export interface AndroidCodeFile {
  id: string;
  filename: string;
  path: string;
  language: string;
  summary: string;
  code: string;
}

export const ANDROID_KOTLIN_FILES: AndroidCodeFile[] = [
  {
    id: 'github_workflow',
    filename: 'build-apk.yml',
    path: '.github/workflows/build-apk.yml',
    language: 'yaml',
    summary: 'GitHub Actions workflow that builds both Debug APK and Play Console Release AAB.',
    code: `name: Build Android APK & AAB

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Extract project zip if uploaded
        run: |
          if [ -f "saiful-lock-ai-android-github.zip" ]; then
            unzip -o saiful-lock-ai-android-github.zip -x ".github/*"
          fi

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Accept Android SDK Licenses
        run: |
          if [ -d "$ANDROID_HOME/cmdline-tools/latest/bin" ]; then
            yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses >/dev/null 2>&1 || true
          fi

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.7'

      - name: Prepare Optional Play Console Keystore
        env:
          KEYSTORE_BASE64: \${{ secrets.KEYSTORE_BASE64 }}
        run: |
          if [ -n "$KEYSTORE_BASE64" ]; then
            echo "$KEYSTORE_BASE64" | base64 --decode > "\${{ runner.temp }}/upload-keystore.jks"
            echo "KEYSTORE_FILE=\${{ runner.temp }}/upload-keystore.jks" >> "$GITHUB_ENV"
          fi

      - name: Build Debug APK & Play Console AAB
        env:
          KEYSTORE_PASSWORD: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: \${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: \${{ secrets.KEY_PASSWORD }}
        run: gradle assembleDebug bundleRelease --no-daemon

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: saiful-lock-ai-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk

      - name: Upload Play Console AAB Artifact
        uses: actions/upload-artifact@v4
        with:
          name: saiful-lock-ai-playconsole-aab
          path: app/build/outputs/bundle/release/app-release.aab`
  },
  {
    id: 'readme',
    filename: 'README.md',
    path: 'README.md',
    language: 'markdown',
    summary: 'Step-by-step instructions to push this repository to GitHub and download the built APK.',
    code: `# Saiful Lock AI (Android APK)

## GitHub দিয়ে APK তৈরি করার নিয়ম

1. GitHub-এ একটি নতুন Repository তৈরি করুন (যেমন: \`saiful-lock-ai\`)।
2. ডাউনলোড করা ZIP ফাইলটি Extract করে ভেতরের সব ফাইল (অবশ্যই \`.github\` ফোল্ডারসহ) GitHub repository-তে Upload / Push করুন।
3. GitHub Repository-এর **Actions** ট্যাবে যান।
4. **Build Android APK** workflow অটোমেটিক রান হবে (১–২ মিনিট সময় লাগবে)।
5. Build সফল হলে **Artifacts** সেকশন থেকে \`saiful-lock-ai-debug-apk\` ডাউনলোড করে Unzip করলেই \`app-debug.apk\` পাবেন।

## ডিফল্ট PIN
- Default Unlock PIN: \`1234\` (অ্যাপের ভেতর থেকে পরিবর্তন করা যাবে)`
  },
  {
    id: 'settings_gradle',
    filename: 'settings.gradle.kts',
    path: 'settings.gradle.kts',
    language: 'kotlin',
    summary: 'Gradle project settings and repository configuration.',
    code: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "SaifulLockAI"
include(":app")`
  },
  {
    id: 'root_build_gradle',
    filename: 'build.gradle.kts (root)',
    path: 'build.gradle.kts',
    language: 'kotlin',
    summary: 'Top-level Gradle plugins configuration.',
    code: `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}`
  },
  {
    id: 'gradle_properties',
    filename: 'gradle.properties',
    path: 'gradle.properties',
    language: 'properties',
    summary: 'Gradle JVM memory and AndroidX flags.',
    code: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true`
  },
  {
    id: 'app_build_gradle',
    filename: 'app/build.gradle.kts',
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    summary: 'Android app module configuration (SDK 34, Kotlin 1.9, Material 3).',
    code: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.saiful.lockai"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.saiful.lockai"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        create("release") {
            val ksPath = System.getenv("KEYSTORE_FILE")
            if (!ksPath.isNullOrBlank()) {
                storeFile = file(ksPath)
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            if (!System.getenv("KEYSTORE_FILE").isNullOrBlank()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
}`
  },
  {
    id: 'proguard_rules',
    filename: 'proguard-rules.pro',
    path: 'app/proguard-rules.pro',
    language: 'text',
    summary: 'ProGuard keep rules for release AAB bundle.',
    code: `# ProGuard rules for Saiful Lock AI
-keep class com.saiful.lockai.** { *; }`
  },
  {
    id: 'manifest',
    filename: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    summary: 'Declares Display Over Other Apps, Foreground Service, and Accessibility Service permissions.',
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Required for Display Over Other Apps -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="false"
        android:label="@string/app_name"
        android:theme="@style/Theme.SaifulLockAI">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Fullscreen PIN Lock Overlay Service -->
        <service
            android:name=".LockOverlayService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Screen lock overlay protection until PIN unlock" />
        </service>

        <!-- Accessibility Service to block Notification Shade & SystemUI -->
        <service
            android:name=".StatusBarBlockerService"
            android:exported="true"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
    </application>
</manifest>`
  },
  {
    id: 'main_activity',
    filename: 'MainActivity.kt',
    path: 'app/src/main/java/com/saiful/lockai/MainActivity.kt',
    language: 'kotlin',
    summary: 'Handles Display Over Other Apps, Accessibility check, PIN saving, and starting the lock overlay.',
    code: `package com.saiful.lockai

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.text.TextUtils
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var tvStatus: TextView
    private lateinit var cardPermissionStep: LinearLayout
    private lateinit var cardReadyStep: LinearLayout
    private lateinit var btnOverlayPermission: Button
    private lateinit var btnAccessibility: Button
    private lateinit var btnStartLock: Button
    private lateinit var etPinCode: EditText
    private lateinit var btnSavePin: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvStatus = findViewById(R.id.tvStatus)
        cardPermissionStep = findViewById(R.id.cardPermissionStep)
        cardReadyStep = findViewById(R.id.cardReadyStep)
        btnOverlayPermission = findViewById(R.id.btnOverlayPermission)
        btnAccessibility = findViewById(R.id.btnAccessibility)
        btnStartLock = findViewById(R.id.btnStartLock)
        etPinCode = findViewById(R.id.etPinCode)
        btnSavePin = findViewById(R.id.btnSavePin)

        etPinCode.setText(getSavedPin())

        btnOverlayPermission.setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                startActivity(intent)
            }
        }

        btnAccessibility.setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }

        btnSavePin.setOnClickListener {
            val pin = etPinCode.text.toString().trim()
            if (pin.length == 4 && pin.all { it.isDigit() }) {
                getSharedPreferences("saiful_lock_prefs", Context.MODE_PRIVATE)
                    .edit()
                    .putString("unlock_pin", pin)
                    .apply()
                Toast.makeText(this, "PIN সেভ হয়েছে: $pin", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "৪ সংখ্যার PIN দিন", Toast.LENGTH_SHORT).show()
            }
        }

        btnStartLock.setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                Toast.makeText(this, "আগে Display Permission দিন", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val lockIntent = Intent(this, LockOverlayService::class.java).apply {
                putExtra("UNLOCK_PIN", getSavedPin())
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(lockIntent)
            } else {
                startService(lockIntent)
            }
            moveTaskToBack(true)
        }
    }

    override fun onResume() {
        super.onResume()
        val hasOverlay = Settings.canDrawOverlays(this)
        val hasAccessibility = isAccessibilityEnabled(this)

        if (hasOverlay) {
            tvStatus.text = "Ready to Lock"
            cardPermissionStep.visibility = View.GONE
            cardReadyStep.visibility = View.VISIBLE
        } else {
            tvStatus.text = "Permission Step"
            cardPermissionStep.visibility = View.VISIBLE
            cardReadyStep.visibility = View.GONE
        }

        btnAccessibility.text = if (hasAccessibility) {
            "Accessibility__ পারমিশন • ALLOWED"
        } else {
            "Accessibility__ পারমিশন দিন (OFF • Tap)"
        }
    }

    private fun getSavedPin(): String {
        val prefs = getSharedPreferences("saiful_lock_prefs", Context.MODE_PRIVATE)
        return prefs.getString("unlock_pin", "1234") ?: "1234"
    }

    private fun isAccessibilityEnabled(context: Context): Boolean {
        val serviceId = "$packageName/\${StatusBarBlockerService::class.java.canonicalName}"
        val enabled = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        val splitter = TextUtils.SimpleStringSplitter(':')
        splitter.setString(enabled)
        while (splitter.hasNext()) {
            if (splitter.next().equals(serviceId, ignoreCase = true)) return true
        }
        return false
    }
}`
  },
  {
    id: 'overlay_service',
    filename: 'LockOverlayService.kt',
    path: 'app/src/main/java/com/saiful/lockai/LockOverlayService.kt',
    language: 'kotlin',
    summary: 'Draws a full-screen WindowManager overlay covering the status bar and apps until unlocked with PIN.',
    code: `package com.saiful.lockai

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat

class LockOverlayService : Service() {

    companion object {
        @Volatile
        var isLocked: Boolean = false
    }

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private var expectedPin: String = "1234"
    private val enteredPin = StringBuilder()

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        expectedPin = intent?.getStringExtra("UNLOCK_PIN") ?: "1234"
        startAsForeground()
        showLockOverlay()
        return START_STICKY
    }

    private fun startAsForeground() {
        val channelId = "saiful_lock_shield"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Screen Lock Shield",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Saiful Lock AI Active")
            .setContentText("Screen and notification shade protected until unlocked.")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(101, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(101, notification)
        }
    }

    private fun showLockOverlay() {
        if (overlayView != null) return
        isLocked = true
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }

        overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_lock_screen, null)

        @Suppress("DEPRECATION")
        overlayView?.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        )

        setupPinKeypad(overlayView!!)
        windowManager.addView(overlayView, params)
    }

    private fun setupPinKeypad(root: View) {
        val pinDisplay = root.findViewById<TextView>(R.id.tvPinDots)
        val statusMsg = root.findViewById<TextView>(R.id.tvLockError)

        val digitIds = listOf(
            R.id.btn0, R.id.btn1, R.id.btn2, R.id.btn3, R.id.btn4,
            R.id.btn5, R.id.btn6, R.id.btn7, R.id.btn8, R.id.btn9
        )

        digitIds.forEachIndexed { digit, id ->
            root.findViewById<Button>(id)?.setOnClickListener {
                if (enteredPin.length < 4) {
                    enteredPin.append(digit)
                    pinDisplay.text = "● ".repeat(enteredPin.length).trim()
                    statusMsg.text = ""
                    if (enteredPin.length == 4) {
                        if (enteredPin.toString() == expectedPin) {
                            unlockAndStop()
                        } else {
                            enteredPin.clear()
                            pinDisplay.text = "○ ○ ○ ○"
                            statusMsg.text = "ভুল পিন! আবার চেষ্টা করুন"
                        }
                    }
                }
            }
        }

        root.findViewById<Button>(R.id.btnClear)?.setOnClickListener {
            enteredPin.clear()
            pinDisplay.text = "○ ○ ○ ○"
            statusMsg.text = ""
        }

        root.findViewById<Button>(R.id.btnBack)?.setOnClickListener {
            if (enteredPin.isNotEmpty()) {
                enteredPin.deleteCharAt(enteredPin.length - 1)
                pinDisplay.text = if (enteredPin.isEmpty()) "○ ○ ○ ○" else "● ".repeat(enteredPin.length).trim()
            }
        }
    }

    private fun unlockAndStop() {
        isLocked = false
        overlayView?.let {
            windowManager.removeView(it)
            overlayView = null
        }
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        isLocked = false
        overlayView?.let { windowManager.removeView(it) }
        overlayView = null
        super.onDestroy()
    }
}`
  },
  {
    id: 'accessibility_service',
    filename: 'StatusBarBlockerService.kt',
    path: 'app/src/main/java/com/saiful/lockai/StatusBarBlockerService.kt',
    language: 'kotlin',
    summary: 'Immediately collapses the notification shade/shutter when pulled down during lock.',
    code: `package com.saiful.lockai

import android.accessibilityservice.AccessibilityService
import android.os.Build
import android.view.accessibility.AccessibilityEvent

class StatusBarBlockerService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!LockOverlayService.isLocked || event == null) return

        val packageName = event.packageName?.toString() ?: return

        if (packageName == "com.android.systemui" &&
            event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
        ) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                performGlobalAction(GLOBAL_ACTION_DISMISS_NOTIFICATION_SHADE)
            } else {
                performGlobalAction(GLOBAL_ACTION_BACK)
            }
        }
    }

    override fun onInterrupt() {
        // Required override
    }
}`
  },
  {
    id: 'matrix_view',
    filename: 'MatrixBackgroundView.kt',
    path: 'app/src/main/java/com/saiful/lockai/MatrixBackgroundView.kt',
    language: 'kotlin',
    summary: 'Custom Android View rendering animated green & red Matrix binary rain.',
    code: `package com.saiful.lockai

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.util.AttributeSet
import android.view.View
import kotlin.random.Random

class MatrixBackgroundView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {

    private val greenPaint = Paint().apply {
        color = Color.argb(95, 16, 185, 129)
        textSize = 34f
        typeface = Typeface.MONOSPACE
        isAntiAlias = true
    }

    private val redPaint = Paint().apply {
        color = Color.argb(85, 185, 28, 28)
        textSize = 34f
        typeface = Typeface.MONOSPACE
        isAntiAlias = true
    }

    private val bgFade = Paint().apply {
        color = Color.argb(36, 2, 6, 4)
    }

    private var drops = IntArray(0)
    private var redCol = BooleanArray(0)
    private val colWidth = 42

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        val count = (w / colWidth).coerceAtLeast(1)
        drops = IntArray(count) { Random.nextInt(-30, 0) }
        redCol = BooleanArray(count) { Random.nextFloat() < 0.15f }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.drawColor(Color.parseColor("#020604"))
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgFade)

        for (i in drops.indices) {
            val ch = if (Random.nextBoolean()) "1" else "0"
            val x = (i * colWidth).toFloat()
            val y = (drops[i] * 38).toFloat()
            if (y > 0) {
                canvas.drawText(ch, x, y, if (redCol[i]) redPaint else greenPaint)
            }
            if (y > height && Random.nextFloat() > 0.95f) {
                drops[i] = 0
                redCol[i] = Random.nextFloat() < 0.15f
            } else {
                drops[i]++
            }
        }
        postInvalidateDelayed(65)
    }
}`
  },
  {
    id: 'activity_main_xml',
    filename: 'activity_main.xml',
    path: 'app/src/main/res/layout/activity_main.xml',
    language: 'xml',
    summary: 'Main UI layout matching the dark Matrix Permission Step and Ready to Lock screens.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#020604">

    <com.saiful.lockai.MatrixBackgroundView
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:fillViewport="true">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:padding="18dp">

            <!-- Header -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:gravity="center_vertical"
                android:orientation="horizontal"
                android:paddingTop="8dp"
                android:paddingBottom="12dp">

                <TextView
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:fontFamily="monospace"
                    android:text="Saiful Lock AI"
                    android:textColor="#22C55E"
                    android:textSize="20sp"
                    android:textStyle="bold" />

                <TextView
                    android:id="@+id/tvStatus"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:fontFamily="monospace"
                    android:text="Permission Step"
                    android:textColor="#22D3EE"
                    android:textSize="13sp" />
            </LinearLayout>

            <View
                android:layout_width="match_parent"
                android:layout_height="1dp"
                android:background="#1E3A2F" />

            <!-- Permission Step Card -->
            <LinearLayout
                android:id="@+id/cardPermissionStep"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="48dp"
                android:background="#EE070B09"
                android:orientation="vertical"
                android:padding="22dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:fontFamily="monospace"
                    android:text="Display Permission Required"
                    android:textColor="#22D3EE"
                    android:textSize="13sp" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="8dp"
                    android:text="এক্টিভ করার জন্য ডিসপ্লে পারমিশন দিন"
                    android:textColor="#22C55E"
                    android:textSize="22sp"
                    android:textStyle="bold" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="12dp"
                    android:lineSpacingExtra="4dp"
                    android:text="প্যানেল কানেক্ট করার জন্য ডিসপ্লে ওভারলে পারমিশন দিন। পারমিশন দেওয়ার পর ভেতরে গিয়ে Start Screen Lock চাপলে শাটার ও সম্পূর্ণ ফোন লক চালু হবে।"
                    android:textColor="#CBD5E1"
                    android:textSize="14sp" />

                <Button
                    android:id="@+id/btnOverlayPermission"
                    android:layout_width="match_parent"
                    android:layout_height="52dp"
                    android:layout_marginTop="20dp"
                    android:backgroundTint="#0EA86B"
                    android:text="কানেক্ট করার জন্য পারমিশন দিন"
                    android:textAllCaps="false"
                    android:textColor="#FFFFFF"
                    android:textStyle="bold" />
            </LinearLayout>

            <!-- Ready Step Card -->
            <LinearLayout
                android:id="@+id/cardReadyStep"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="24dp"
                android:background="#EE070B09"
                android:orientation="vertical"
                android:padding="20dp"
                android:visibility="gone">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="ডিসপ্লে পারমিশন সক্রিয়"
                    android:textColor="#22C55E"
                    android:textSize="13sp"
                    android:textStyle="bold" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="4dp"
                    android:fontFamily="monospace"
                    android:text="shutter &amp; phone lock ready"
                    android:textColor="#22C55E"
                    android:textSize="20sp"
                    android:textStyle="bold" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="10dp"
                    android:lineSpacingExtra="4dp"
                    android:text="Start Screen Lock চাপলেই ফুল-স্ক্রিন লক চালু হবে। আনলক না করা পর্যন্ত শাটার, নোটিফিকেশন ও কিছুই ব্যবহার করা যাবে না।"
                    android:textColor="#CBD5E1"
                    android:textSize="13sp" />

                <Button
                    android:id="@+id/btnStartLock"
                    android:layout_width="match_parent"
                    android:layout_height="52dp"
                    android:layout_marginTop="16dp"
                    android:backgroundTint="#DC2626"
                    android:text="Start Screen Lock"
                    android:textAllCaps="false"
                    android:textColor="#FFFFFF"
                    android:textStyle="bold" />

                <Button
                    android:id="@+id/btnAccessibility"
                    android:layout_width="match_parent"
                    android:layout_height="50dp"
                    android:layout_marginTop="10dp"
                    android:backgroundTint="#0A2A33"
                    android:text="Accessibility__ পারমিশন দিন"
                    android:textAllCaps="false"
                    android:textColor="#67E8F9" />

                <!-- PIN Setup Row -->
                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="14dp"
                    android:gravity="center_vertical"
                    android:orientation="horizontal">

                    <EditText
                        android:id="@+id/etPinCode"
                        android:layout_width="0dp"
                        android:layout_height="46dp"
                        android:layout_weight="1"
                        android:background="#040806"
                        android:fontFamily="monospace"
                        android:hint="4-Digit PIN"
                        android:inputType="numberPassword"
                        android:maxLength="4"
                        android:paddingStart="12dp"
                        android:paddingEnd="12dp"
                        android:textColor="#22C55E"
                        android:textColorHint="#64748B" />

                    <Button
                        android:id="@+id/btnSavePin"
                        android:layout_width="wrap_content"
                        android:layout_height="46dp"
                        android:layout_marginStart="8dp"
                        android:backgroundTint="#0F3A2A"
                        android:text="Save PIN"
                        android:textAllCaps="false"
                        android:textColor="#6EE7B7" />
                </LinearLayout>

                <!-- FAQ -->
                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="18dp"
                    android:text="01. এটা কে বানিয়েছে?"
                    android:textColor="#22C55E"
                    android:textSize="13sp"
                    android:textStyle="bold" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="উত্তর: Saiful Sir"
                    android:textColor="#FBBF24"
                    android:textSize="13sp" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="10dp"
                    android:text="02. এটা আনলক করবো কিভাবে?"
                    android:textColor="#22C55E"
                    android:textSize="13sp"
                    android:textStyle="bold" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="উত্তর: আনলক স্ক্রিনে আপনার PIN দিলেই অফ হয়ে যাবে"
                    android:textColor="#FBBF24"
                    android:textSize="13sp" />
            </LinearLayout>

            <View
                android:layout_width="match_parent"
                android:layout_height="0dp"
                android:layout_weight="1" />

            <!-- Footer -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="24dp"
                android:background="#EE0A0C08"
                android:gravity="center_vertical"
                android:orientation="horizontal"
                android:padding="14dp">

                <LinearLayout
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:orientation="vertical">

                    <TextView
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="Crafted &amp; Engineered"
                        android:textColor="#FBBF24"
                        android:textSize="11sp" />

                    <TextView
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:fontFamily="monospace"
                        android:text="Developed by Saiful"
                        android:textColor="#F8FAFC"
                        android:textSize="14sp"
                        android:textStyle="bold" />
                </LinearLayout>

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:fontFamily="monospace"
                    android:text="Saiful Sir"
                    android:textColor="#22D3EE"
                    android:textSize="13sp"
                    android:textStyle="bold" />
            </LinearLayout>
        </LinearLayout>
    </ScrollView>
</FrameLayout>`
  },
  {
    id: 'overlay_lock_xml',
    filename: 'overlay_lock_screen.xml',
    path: 'app/src/main/res/layout/overlay_lock_screen.xml',
    language: 'xml',
    summary: 'Full-screen PIN keypad layout rendered above all apps & status bar while locked.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#020604"
    android:clickable="true"
    android:focusable="true">

    <com.saiful.lockai.MatrixBackgroundView
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="24dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:fontFamily="monospace"
            android:text="SHUTTER BLOCKED · NOTIFICATIONS HIDDEN"
            android:textColor="#F87171"
            android:textSize="11sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="14dp"
            android:text="ফোন লক করা আছে"
            android:textColor="#FFFFFF"
            android:textSize="22sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:gravity="center"
            android:text="আনলক না করা পর্যন্ত শাটার, নোটিফিকেশন ও কোনো অ্যাপ ব্যবহার করা যাবে না।"
            android:textColor="#CBD5E1"
            android:textSize="13sp" />

        <TextView
            android:id="@+id/tvPinDots"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="24dp"
            android:fontFamily="monospace"
            android:text="○ ○ ○ ○"
            android:textColor="#22C55E"
            android:textSize="24sp" />

        <TextView
            android:id="@+id/tvLockError"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            android:text="৪ সংখ্যার PIN দিন"
            android:textColor="#F87171"
            android:textSize="13sp" />

        <GridLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="24dp"
            android:columnCount="3"
            android:rowCount="4">

            <Button android:id="@+id/btn1" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#0A1A13" android:text="1" android:textColor="#FFFFFF" android:textSize="20sp" />
            <Button android:id="@+id/btn2" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#0A1A13" android:text="2" android:textColor="#FFFFFF" android:textSize="20sp" />
            <Button android:id="@+id/btn3" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#0A1A13" android:text="3" android:textColor="#FFFFFF" android:textSize="20sp" />

            <Button android:id="@+id/btn4" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#0A1A13" android:text="4" android:textColor="#FFFFFF" android:textSize="20sp" />
            <Button android:id="@+id/btn5" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#0A1A13" android:text="5" android:textColor="#FFFFFF" android:textSize="20sp" />
            <Button android:id="@+id/btn6" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#0A1A13" android:text="6" android:textColor="#FFFFFF" android:textSize="20sp" />

            <Button android:id="@+id/btn7" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#0A1A13" android:text="7" android:textColor="#FFFFFF" android:textSize="20sp" />
            <Button android:id="@+id/btn8" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#0A1A13" android:text="8" android:textColor="#FFFFFF" android:textSize="20sp" />
            <Button android:id="@+id/btn9" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#0A1A13" android:text="9" android:textColor="#FFFFFF" android:textSize="20sp" />

            <Button android:id="@+id/btnClear" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#1E293B" android:text="CLR" android:textColor="#CBD5E1" android:textSize="13sp" />
            <Button android:id="@+id/btn0" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#0A1A13" android:text="0" android:textColor="#FFFFFF" android:textSize="20sp" />
            <Button android:id="@+id/btnBack" android:layout_width="76dp" android:layout_height="60dp" android:layout_margin="6dp" android:backgroundTint="#1E293B" android:text="DEL" android:textColor="#CBD5E1" android:textSize="13sp" />
        </GridLayout>
    </LinearLayout>
</FrameLayout>`
  },
  {
    id: 'strings_xml',
    filename: 'strings.xml',
    path: 'app/src/main/res/values/strings.xml',
    language: 'xml',
    summary: 'Application name and accessibility service description strings.',
    code: `<resources>
    <string name="app_name">Saiful Lock AI</string>
    <string name="accessibility_lock_description">Blocks notification shade pull-down and system navigation while phone is locked until PIN is entered.</string>
</resources>`
  },
  {
    id: 'themes_xml',
    filename: 'themes.xml',
    path: 'app/src/main/res/values/themes.xml',
    language: 'xml',
    summary: 'Dark Material 3 theme matching the black Matrix canvas.',
    code: `<resources>
    <style name="Theme.SaifulLockAI" parent="Theme.Material3.Dark.NoActionBar">
        <item name="android:statusBarColor">#020604</item>
        <item name="android:navigationBarColor">#020604</item>
    </style>
</resources>`
  },
  {
    id: 'accessibility_xml',
    filename: 'accessibility_service_config.xml',
    path: 'app/src/main/res/xml/accessibility_service_config.xml',
    language: 'xml',
    summary: 'Accessibility XML configuration listening for SystemUI window state changes.',
    code: `<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged|typeWindowsChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows"
    android:canRetrieveWindowContent="false"
    android:description="@string/accessibility_lock_description"
    android:notificationTimeout="50"
    android:packageNames="com.android.systemui" />`
  }
];
