package com.example.ui.game

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import com.example.game.*
import com.example.ui.theme.*
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun PoolTableCanvas(
    balls: List<Ball>,
    aimAngle: Float,
    cuePower: Float,
    aimGuide: AimGuideData?,
    isHumanTurn: Boolean,
    isBallInHand: Boolean,
    onAimChange: (Float) -> Unit,
    onRepositionCueBall: (Vector2) -> Unit,
    modifier: Modifier = Modifier
) {
    val textPaint = remember {
        Paint().apply {
            color = android.graphics.Color.BLACK
            textSize = 10f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
            isAntiAlias = true
        }
    }

    val textPaintWhite = remember {
        Paint().apply {
            color = android.graphics.Color.WHITE
            textSize = 10f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
            isAntiAlias = true
        }
    }

    BoxWithConstraints(modifier = modifier) {
        val availableWidth = constraints.maxWidth.toFloat()
        val availableHeight = constraints.maxHeight.toFloat()

        val virtualWidth = PoolPhysics.TABLE_WIDTH
        val virtualHeight = PoolPhysics.TABLE_HEIGHT

        val scale = minOf(availableWidth / virtualWidth, availableHeight / virtualHeight)
        val renderWidth = virtualWidth * scale
        val renderHeight = virtualHeight * scale

        val offsetX = (availableWidth - renderWidth) / 2f
        val offsetY = (availableHeight - renderHeight) / 2f

        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(isHumanTurn, isBallInHand) {
                    if (!isHumanTurn) return@pointerInput

                    detectDragGestures(
                        onDragStart = { offset ->
                            val virtualTouchX = (offset.x - offsetX) / scale
                            val virtualTouchY = (offset.y - offsetY) / scale

                            if (isBallInHand) {
                                onRepositionCueBall(Vector2(virtualTouchX, virtualTouchY))
                            } else {
                                val cue = balls.firstOrNull { it.isCue }
                                if (cue != null) {
                                    val dx = virtualTouchX - cue.position.x
                                    val dy = virtualTouchY - cue.position.y
                                    onAimChange(atan2(dy, dx))
                                }
                            }
                        },
                        onDrag = { change, _ ->
                            change.consume()
                            val virtualTouchX = (change.position.x - offsetX) / scale
                            val virtualTouchY = (change.position.y - offsetY) / scale

                            if (isBallInHand) {
                                onRepositionCueBall(Vector2(virtualTouchX, virtualTouchY))
                            } else {
                                val cue = balls.firstOrNull { it.isCue }
                                if (cue != null) {
                                    val dx = virtualTouchX - cue.position.x
                                    val dy = virtualTouchY - cue.position.y
                                    onAimChange(atan2(dy, dx))
                                }
                            }
                        }
                    )
                }
        ) {
            // Transform coordinate space to table scale
            drawContext.canvas.save()
            drawContext.canvas.translate(offsetX, offsetY)
            drawContext.canvas.scale(scale, scale)

            // 1. Outer Wooden Table Frame
            drawRoundRect(
                color = PoolWoodRail,
                topLeft = Offset(0f, 0f),
                size = Size(virtualWidth, virtualHeight),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(24f, 24f)
            )

            // Table Frame Border Bevel
            drawRoundRect(
                color = PoolWoodRailBorder,
                topLeft = Offset(4f, 4f),
                size = Size(virtualWidth - 8f, virtualHeight - 8f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(20f, 20f),
                style = Stroke(width = 4f)
            )

            // Inset Rail Diamonds / Markers
            drawRailDiamonds()

            // 2. Playable Green Felt Area
            drawRoundRect(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFF0F764C), Color(0xFF084B2E), Color(0xFF063B24)),
                    center = Offset(virtualWidth / 2f, virtualHeight / 2f),
                    radius = virtualWidth * 0.6f
                ),
                topLeft = Offset(PoolPhysics.MIN_X, PoolPhysics.MIN_Y),
                size = Size(PoolPhysics.MAX_X - PoolPhysics.MIN_X, PoolPhysics.MAX_Y - PoolPhysics.MIN_Y),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(14f, 14f)
            )

            // Head String (Break Line) & Foot Spot subtle markings
            drawLine(
                color = Color(0x22FFFFFF),
                start = Offset(280f, PoolPhysics.MIN_Y),
                end = Offset(280f, PoolPhysics.MAX_Y),
                strokeWidth = 1.5f
            )
            drawCircle(
                color = Color(0x33FFFFFF),
                radius = 2.5f,
                center = Offset(700f, 250f)
            )

            // 3. Six Pockets
            for (pocket in PoolPhysics.POCKETS) {
                val isMiddle = (pocket.x == 500f)
                val radius = if (isMiddle) PoolPhysics.POCKET_RADIUS_MIDDLE else PoolPhysics.POCKET_RADIUS_CORNER

                // Pocket gold/brass rim
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(Color(0xFFE5B558), Color(0xFF92631C)),
                        center = Offset(pocket.x, pocket.y),
                        radius = radius + 6f
                    ),
                    radius = radius + 6f,
                    center = Offset(pocket.x, pocket.y)
                )

                // Pocket dark hole
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(Color(0xFF020408), Color(0xFF0F172A)),
                        center = Offset(pocket.x, pocket.y),
                        radius = radius
                    ),
                    radius = radius,
                    center = Offset(pocket.x, pocket.y)
                )
            }

            // 4. Aim Guide Line & Ghost Ball (When human turn and aiming)
            if (isHumanTurn && !isBallInHand && aimGuide != null) {
                drawAimGuideLines(aimGuide)
            }

            // 5. Balls with shadows and numbers
            for (ball in balls) {
                if (ball.isPotted) continue
                drawBall(ball, textPaint, textPaintWhite)
            }

            // 6. Cue Stick
            val cue = balls.firstOrNull { it.isCue }
            if (isHumanTurn && !isBallInHand && cue != null && !cue.isPotted && !cue.isSinking) {
                drawCueStick(cue.position, aimAngle, cuePower)
            }

            // 7. Ball-in-hand placement indicator
            if (isHumanTurn && isBallInHand && cue != null) {
                drawCircle(
                    color = AccentCyan.copy(alpha = 0.35f),
                    radius = cue.radius * 2.2f,
                    center = Offset(cue.position.x, cue.position.y)
                )
                drawCircle(
                    color = AccentCyan,
                    radius = cue.radius * 2.2f,
                    center = Offset(cue.position.x, cue.position.y),
                    style = Stroke(width = 2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 6f)))
                )
            }

            drawContext.canvas.restore()
        }
    }
}

private fun DrawScope.drawRailDiamonds() {
    val diamondColor = Color(0x88FFFFFF)
    val size = 3f

    // Top and Bottom rail diamonds (3 on each side of middle pocket)
    val xPositions = listOf(160f, 270f, 380f, 620f, 730f, 840f)
    for (x in xPositions) {
        drawCircle(color = diamondColor, radius = size, center = Offset(x, 20f))
        drawCircle(color = diamondColor, radius = size, center = Offset(x, 480f))
    }

    // Left and Right rail diamonds (3 diamonds each)
    val yPositions = listOf(150f, 250f, 350f)
    for (y in yPositions) {
        drawCircle(color = diamondColor, radius = size, center = Offset(20f, y))
        drawCircle(color = diamondColor, radius = size, center = Offset(980f, y))
    }
}

private fun DrawScope.drawAimGuideLines(aimGuide: AimGuideData) {
    // Primary aim line to impact
    drawLine(
        color = Color.White.copy(alpha = 0.85f),
        start = Offset(aimGuide.rayStart.x, aimGuide.rayStart.y),
        end = Offset(aimGuide.impactPoint.x, aimGuide.impactPoint.y),
        strokeWidth = 2f,
        pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 8f))
    )

    // Ghost cue ball circle at impact
    drawCircle(
        color = Color.White.copy(alpha = 0.25f),
        radius = PoolPhysics.BALL_RADIUS,
        center = Offset(aimGuide.ghostCuePosition.x, aimGuide.ghostCuePosition.y)
    )
    drawCircle(
        color = Color.White.copy(alpha = 0.8f),
        radius = PoolPhysics.BALL_RADIUS,
        center = Offset(aimGuide.ghostCuePosition.x, aimGuide.ghostCuePosition.y),
        style = Stroke(width = 1.5f)
    )

    // Target ball deflection line
    if (aimGuide.hasBallHit && aimGuide.targetBallTrajectory != null) {
        val targetEnd = aimGuide.impactPoint + aimGuide.targetBallTrajectory
        drawLine(
            color = AccentGoldBright.copy(alpha = 0.9f),
            start = Offset(aimGuide.impactPoint.x, aimGuide.impactPoint.y),
            end = Offset(targetEnd.x, targetEnd.y),
            strokeWidth = 2.5f
        )
        drawCircle(
            color = AccentGoldBright,
            radius = 3.5f,
            center = Offset(targetEnd.x, targetEnd.y)
        )
    }

    // Cue ball deflection line
    if (aimGuide.cueBallDeflection != null) {
        val cueEnd = aimGuide.ghostCuePosition + aimGuide.cueBallDeflection
        drawLine(
            color = AccentCyan.copy(alpha = 0.7f),
            start = Offset(aimGuide.ghostCuePosition.x, aimGuide.ghostCuePosition.y),
            end = Offset(cueEnd.x, cueEnd.y),
            strokeWidth = 1.8f,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f))
        )
    }
}

private fun DrawScope.drawBall(ball: Ball, textPaint: Paint, textPaintWhite: Paint) {
    val scale = if (ball.isSinking) (1f - ball.pocketProgress).coerceAtLeast(0.1f) else 1f
    val alpha = if (ball.isSinking) (1f - ball.pocketProgress).coerceAtLeast(0f) else 1f
    val r = ball.radius * scale

    // Ball shadow
    drawCircle(
        color = Color(0x55000000).copy(alpha = 0.35f * alpha),
        radius = r * 1.05f,
        center = Offset(ball.position.x + 2.5f * scale, ball.position.y + 2.5f * scale)
    )

    if (ball.isCue) {
        // Cue ball: pure white with glossy specular gradient
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFFFFFFF), Color(0xFFF1F5F9), Color(0xFFCBD5E1)),
                center = Offset(ball.position.x - r * 0.3f, ball.position.y - r * 0.3f),
                radius = r * 1.2f
            ),
            radius = r,
            center = Offset(ball.position.x, ball.position.y)
        )
        // Red dot on cue ball for spin look
        drawCircle(
            color = Color(0xFFDC2626).copy(alpha = alpha),
            radius = 1.5f * scale,
            center = Offset(ball.position.x, ball.position.y)
        )
    } else if (ball.isEightBall) {
        // 8-ball: glossy black
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFF334155), Color(0xFF0F172A), Color(0xFF020617)),
                center = Offset(ball.position.x - r * 0.3f, ball.position.y - r * 0.3f),
                radius = r * 1.2f
            ),
            radius = r,
            center = Offset(ball.position.x, ball.position.y)
        )
        // Center white circle
        drawCircle(
            color = Color.White.copy(alpha = alpha),
            radius = r * 0.45f,
            center = Offset(ball.position.x, ball.position.y)
        )
        // Number 8
        if (scale > 0.6f) {
            drawContext.canvas.nativeCanvas.drawText(
                "8",
                ball.position.x,
                ball.position.y + 3.5f * scale,
                textPaint
            )
        }
    } else if (ball.isStripe) {
        // Stripe ball: White base
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFFFFFFF), Color(0xFFE2E8F0)),
                center = Offset(ball.position.x - r * 0.3f, ball.position.y - r * 0.3f),
                radius = r * 1.2f
            ),
            radius = r,
            center = Offset(ball.position.x, ball.position.y)
        )
        // Colored stripe band
        drawRect(
            color = ball.baseColor.copy(alpha = alpha),
            topLeft = Offset(ball.position.x - r, ball.position.y - r * 0.5f),
            size = Size(r * 2f, r)
        )
        // Center number circle
        drawCircle(
            color = Color.White.copy(alpha = alpha),
            radius = r * 0.45f,
            center = Offset(ball.position.x, ball.position.y)
        )
        // Number text
        if (scale > 0.6f) {
            drawContext.canvas.nativeCanvas.drawText(
                ball.number.toString(),
                ball.position.x,
                ball.position.y + 3.5f * scale,
                textPaint
            )
        }
    } else {
        // Solid ball: Full color with gradient
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(ball.baseColor.copy(alpha = alpha), ball.baseColor.copy(alpha = alpha * 0.8f)),
                center = Offset(ball.position.x - r * 0.3f, ball.position.y - r * 0.3f),
                radius = r * 1.2f
            ),
            radius = r,
            center = Offset(ball.position.x, ball.position.y)
        )
        // Center white circle
        drawCircle(
            color = Color.White.copy(alpha = alpha),
            radius = r * 0.45f,
            center = Offset(ball.position.x, ball.position.y)
        )
        // Number text
        if (scale > 0.6f) {
            drawContext.canvas.nativeCanvas.drawText(
                ball.number.toString(),
                ball.position.x,
                ball.position.y + 3.5f * scale,
                textPaint
            )
        }
    }

    // Specular highlight on top-left of every ball
    drawCircle(
        color = Color.White.copy(alpha = 0.4f * alpha),
        radius = r * 0.25f,
        center = Offset(ball.position.x - r * 0.32f, ball.position.y - r * 0.32f)
    )
}

private fun DrawScope.drawCueStick(cueBallPos: Vector2, aimAngle: Float, cuePower: Float) {
    // Cue is drawn behind cue ball in opposite direction to aim angle
    val backAngle = aimAngle + Math.PI.toFloat()
    val pullbackOffset = 18f + cuePower * 70f

    val stickStart = cueBallPos + Vector2.fromAngle(backAngle, pullbackOffset)
    val stickEnd = cueBallPos + Vector2.fromAngle(backAngle, pullbackOffset + 240f)

    // Leather Tip (Cyan/Chalk blue)
    val tipEnd = cueBallPos + Vector2.fromAngle(backAngle, pullbackOffset + 8f)
    drawLine(
        color = Color(0xFF38BDF8),
        start = Offset(stickStart.x, stickStart.y),
        end = Offset(tipEnd.x, tipEnd.y),
        strokeWidth = 4f,
        cap = StrokeCap.Round
    )

    // Wood Shaft (Maple blonde)
    val shaftEnd = cueBallPos + Vector2.fromAngle(backAngle, pullbackOffset + 140f)
    drawLine(
        brush = Brush.linearGradient(
            colors = listOf(Color(0xFFFDE68A), Color(0xFFD97706)),
            start = Offset(tipEnd.x, tipEnd.y),
            end = Offset(shaftEnd.x, shaftEnd.y)
        ),
        start = Offset(tipEnd.x, tipEnd.y),
        end = Offset(shaftEnd.x, shaftEnd.y),
        strokeWidth = 5.5f,
        cap = StrokeCap.Butt
    )

    // Joint Band (Brass)
    val jointEnd = cueBallPos + Vector2.fromAngle(backAngle, pullbackOffset + 148f)
    drawLine(
        color = Color(0xFFFBBF24),
        start = Offset(shaftEnd.x, shaftEnd.y),
        end = Offset(jointEnd.x, jointEnd.y),
        strokeWidth = 6.5f,
        cap = StrokeCap.Butt
    )

    // Butt / Handle (Dark rosewood with grip)
    drawLine(
        brush = Brush.linearGradient(
            colors = listOf(Color(0xFF1E1B4B), Color(0xFF0F172A)),
            start = Offset(jointEnd.x, jointEnd.y),
            end = Offset(stickEnd.x, stickEnd.y)
        ),
        start = Offset(jointEnd.x, jointEnd.y),
        end = Offset(stickEnd.x, stickEnd.y),
        strokeWidth = 7.5f,
        cap = StrokeCap.Round
    )
}
