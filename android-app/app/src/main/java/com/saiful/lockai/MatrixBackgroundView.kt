package com.saiful.lockai

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
}
