package com.example.game

import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

data class Vector2(val x: Float = 0f, val y: Float = 0f) {
    operator fun plus(other: Vector2) = Vector2(x + other.x, y + other.y)
    operator fun minus(other: Vector2) = Vector2(x - other.x, y - other.y)
    operator fun times(scalar: Float) = Vector2(x * scalar, y * scalar)
    operator fun div(scalar: Float) = if (scalar != 0f) Vector2(x / scalar, y / scalar) else Vector2(0f, 0f)

    fun dot(other: Vector2): Float = x * other.x + y * other.y

    fun length(): Float = sqrt(x * x + y * y)
    fun lengthSquared(): Float = x * x + y * y

    fun normalized(): Vector2 {
        val len = length()
        return if (len > 0.0001f) div(len) else Vector2(0f, 0f)
    }

    fun distanceTo(other: Vector2): Float = (this - other).length()

    companion object {
        fun fromAngle(radians: Float, magnitude: Float = 1f): Vector2 {
            return Vector2(cos(radians) * magnitude, sin(radians) * magnitude)
        }
    }
}
