package com.example.game

import kotlin.math.acos
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

data class AimGuideData(
    val rayStart: Vector2,
    val impactPoint: Vector2,
    val ghostCuePosition: Vector2,
    val hasBallHit: Boolean,
    val hitBallId: Int? = null,
    val targetBallTrajectory: Vector2? = null,
    val cueBallDeflection: Vector2? = null
)

object PoolPhysics {
    const val TABLE_WIDTH = 1000f
    const val TABLE_HEIGHT = 500f

    const val MIN_X = 44f
    const val MAX_X = 956f
    const val MIN_Y = 44f
    const val MAX_Y = 456f

    const val BALL_RADIUS = 11.5f
    const val POCKET_RADIUS_CORNER = 27f
    const val POCKET_RADIUS_MIDDLE = 25f

    const val FRICTION = 0.990f
    const val RESTITUTION_BALL = 0.94f
    const val RESTITUTION_CUSHION = 0.85f

    val POCKETS = listOf(
        Vector2(40f, 40f),     // Top-Left
        Vector2(500f, 32f),    // Top-Middle
        Vector2(960f, 40f),    // Top-Right
        Vector2(40f, 460f),    // Bottom-Left
        Vector2(500f, 468f),   // Bottom-Middle
        Vector2(960f, 460f)    // Bottom-Right
    )

    fun createStandardBalls(): List<Ball> {
        val balls = mutableListOf<Ball>()

        // Ball 0: Cue ball at head line
        balls.add(
            Ball(
                id = 0,
                position = Vector2(280f, 250f),
                radius = BALL_RADIUS
            )
        )

        // Racked balls 1..15 in standard 8-ball triangle
        // Standard arrangement: 8 in center, corners one solid one stripe
        val rackOrder = listOf(
            1,            // Row 0
            9, 2,         // Row 1
            3, 8, 10,     // Row 2 (8-ball in center)
            11, 4, 12, 5, // Row 3
            6, 13, 7, 14, 15 // Row 4
        )

        val apexX = 700f
        val apexY = 250f
        val rowDx = BALL_RADIUS * sqrt(3f) + 0.3f
        val ballDy = BALL_RADIUS * 2f + 0.3f

        var orderIndex = 0
        for (row in 0..4) {
            val count = row + 1
            val rowX = apexX + row * rowDx
            val startY = apexY - (count - 1) * ballDy * 0.5f

            for (col in 0 until count) {
                if (orderIndex < rackOrder.size) {
                    val ballId = rackOrder[orderIndex]
                    val y = startY + col * ballDy
                    balls.add(
                        Ball(
                            id = ballId,
                            position = Vector2(rowX, y),
                            radius = BALL_RADIUS
                        )
                    )
                    orderIndex++
                }
            }
        }

        return balls
    }

    fun stepSimulation(
        balls: List<Ball>,
        subSteps: Int = 4,
        onBallHit: ((Ball, Ball) -> Unit)? = null,
        onBallPotted: ((Ball) -> Unit)? = null
    ) {
        val dt = 1.0f / subSteps

        repeat(subSteps) {
            // 1. Movement and pocket checks
            for (ball in balls) {
                if (ball.isPotted) continue

                if (ball.isSinking) {
                    // Ball is being sucked into a pocket
                    val target = ball.targetPocket ?: Vector2(0f, 0f)
                    val dir = (target - ball.position)
                    ball.position += dir * 0.25f
                    ball.pocketProgress += 0.08f
                    ball.velocity *= 0.5f
                    if (ball.pocketProgress >= 1f) {
                        ball.isPotted = true
                        ball.isSinking = false
                        ball.stop()
                        onBallPotted?.invoke(ball)
                    }
                    continue
                }

                // Normal movement
                ball.position += ball.velocity * dt
                ball.velocity *= FRICTION

                if (ball.velocity.lengthSquared() < 0.04f) {
                    ball.stop()
                }

                // Pocket entry check
                for (pocket in POCKETS) {
                    val pocketRadius = if (pocket.x == 500f) POCKET_RADIUS_MIDDLE else POCKET_RADIUS_CORNER
                    if (ball.position.distanceTo(pocket) < pocketRadius) {
                        ball.isSinking = true
                        ball.targetPocket = pocket
                        ball.pocketProgress = 0f
                        break
                    }
                }

                if (ball.isSinking) continue

                // Cushion bounces (ignoring pocket gaps)
                // Left cushion (between pockets)
                if (ball.position.x - ball.radius < MIN_X && ball.position.y in 66f..434f) {
                    ball.position = Vector2(MIN_X + ball.radius, ball.position.y)
                    ball.velocity = Vector2(-ball.velocity.x * RESTITUTION_CUSHION, ball.velocity.y)
                }
                // Right cushion
                if (ball.position.x + ball.radius > MAX_X && ball.position.y in 66f..434f) {
                    ball.position = Vector2(MAX_X - ball.radius, ball.position.y)
                    ball.velocity = Vector2(-ball.velocity.x * RESTITUTION_CUSHION, ball.velocity.y)
                }
                // Top cushions (left and right of center pocket)
                if (ball.position.y - ball.radius < MIN_Y) {
                    if (ball.position.x in 66f..474f || ball.position.x in 526f..934f) {
                        ball.position = Vector2(ball.position.x, MIN_Y + ball.radius)
                        ball.velocity = Vector2(ball.velocity.x, -ball.velocity.y * RESTITUTION_CUSHION)
                    }
                }
                // Bottom cushions (left and right of center pocket)
                if (ball.position.y + ball.radius > MAX_Y) {
                    if (ball.position.x in 66f..474f || ball.position.x in 526f..934f) {
                        ball.position = Vector2(ball.position.x, MAX_Y - ball.radius)
                        ball.velocity = Vector2(ball.velocity.x, -ball.velocity.y * RESTITUTION_CUSHION)
                    }
                }
            }

            // 2. Ball-to-ball collisions
            val activeBalls = balls.filter { !it.isPotted && !it.isSinking }
            for (i in activeBalls.indices) {
                for (j in i + 1 until activeBalls.size) {
                    val b1 = activeBalls[i]
                    val b2 = activeBalls[j]

                    val delta = b1.position - b2.position
                    val dist = delta.length()
                    val minDist = b1.radius + b2.radius

                    if (dist < minDist && dist > 0.0001f) {
                        val normal = delta / dist
                        val relVel = b1.velocity - b2.velocity
                        val velAlongNormal = relVel.dot(normal)

                        if (velAlongNormal < 0f) {
                            val impulse = -(1f + RESTITUTION_BALL) * velAlongNormal * 0.5f
                            b1.velocity += normal * impulse
                            b2.velocity -= normal * impulse

                            // Positional separation
                            val overlap = (minDist - dist) * 0.5f
                            b1.position += normal * overlap
                            b2.position -= normal * overlap

                            onBallHit?.invoke(b1, b2)
                        }
                    }
                }
            }
        }
    }

    fun calculateAimGuide(cueBall: Ball, aimAngleRadians: Float, allBalls: List<Ball>): AimGuideData {
        val rayStart = cueBall.position
        val rayDir = Vector2(cos(aimAngleRadians), sin(aimAngleRadians))

        var closestDistance = 1200f
        var hitBall: Ball? = null
        var ghostPos: Vector2 = rayStart + rayDir * 400f

        val objectBalls = allBalls.filter { !it.isCue && !it.isPotted && !it.isSinking }

        for (ball in objectBalls) {
            val toBall = ball.position - rayStart
            val projection = toBall.dot(rayDir)

            if (projection > 0f) {
                val perpDistSq = toBall.lengthSquared() - (projection * projection)
                val hitDistThresh = (BALL_RADIUS * 2f)
                val hitDistThreshSq = hitDistThresh * hitDistThresh

                if (perpDistSq <= hitDistThreshSq) {
                    val d = sqrt(hitDistThreshSq - perpDistSq)
                    val distanceToImpact = projection - d

                    if (distanceToImpact in 0f..closestDistance) {
                        closestDistance = distanceToImpact
                        hitBall = ball
                        ghostPos = rayStart + rayDir * distanceToImpact
                    }
                }
            }
        }

        if (hitBall != null) {
            val targetDir = (hitBall.position - ghostPos).normalized()
            val cueDeflection = (rayDir - targetDir * rayDir.dot(targetDir)).normalized()

            return AimGuideData(
                rayStart = rayStart,
                impactPoint = ghostPos,
                ghostCuePosition = ghostPos,
                hasBallHit = true,
                hitBallId = hitBall.id,
                targetBallTrajectory = targetDir * 120f,
                cueBallDeflection = cueDeflection * 60f
            )
        } else {
            // Check cushion intersection
            var cushionHitX = if (rayDir.x > 0) (MAX_X - BALL_RADIUS) else (MIN_X + BALL_RADIUS)
            var cushionHitY = if (rayDir.y > 0) (MAX_Y - BALL_RADIUS) else (MIN_Y + BALL_RADIUS)

            val tX = if (rayDir.x != 0f) (cushionHitX - rayStart.x) / rayDir.x else 9999f
            val tY = if (rayDir.y != 0f) (cushionHitY - rayStart.y) / rayDir.y else 9999f

            val t = if (tX in 0.1f..tY) tX else if (tY > 0.1f) tY else 500f
            val cushionImpact = rayStart + rayDir * t

            return AimGuideData(
                rayStart = rayStart,
                impactPoint = cushionImpact,
                ghostCuePosition = cushionImpact,
                hasBallHit = false,
                hitBallId = null,
                targetBallTrajectory = null,
                cueBallDeflection = null
            )
        }
    }
}
