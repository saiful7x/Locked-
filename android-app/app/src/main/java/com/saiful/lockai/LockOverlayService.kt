package com.saiful.lockai

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
}
