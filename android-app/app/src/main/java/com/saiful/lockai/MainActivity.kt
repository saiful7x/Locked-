package com.saiful.lockai

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
        val serviceId = "$packageName/${StatusBarBlockerService::class.java.canonicalName}"
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
}
