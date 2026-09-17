package com.example.game

import androidx.compose.ui.graphics.Color

data class Ball(
    val id: Int,
    var position: Vector2,
    var velocity: Vector2 = Vector2(0f, 0f),
    val radius: Float = 11.5f,
    var isPotted: Boolean = false,
    var pocketProgress: Float = 0f,
    var isSinking: Boolean = false,
    var targetPocket: Vector2? = null
) {
    val isCue: Boolean get() = id == 0
    val isEightBall: Boolean get() = id == 8
    val isStripe: Boolean get() = id in 9..15
    val isSolid: Boolean get() = id in 1..7
    val number: Int get() = id

    val baseColor: Color
        get() = when (id) {
            0 -> Color(0xFFF8FAFC) // White cue ball
            1, 9 -> Color(0xFFFBBF24) // Yellow
            2, 10 -> Color(0xFF2563EB) // Blue
            3, 11 -> Color(0xFFDC2626) // Red
            4, 12 -> Color(0xFF9333EA) // Purple
            5, 13 -> Color(0xFFEA580C) // Orange
            6, 14 -> Color(0xFF16A34A) // Green
            7, 15 -> Color(0xFF881337) // Burgundy
            8 -> Color(0xFF0F172A) // 8-Ball Black
            else -> Color.White
        }

    fun stop() {
        velocity = Vector2(0f, 0f)
    }

    fun isMoving(): Boolean {
        return !isPotted && velocity.lengthSquared() > 0.04f
    }
}
