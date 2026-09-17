package com.example.ui.game

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.game.*
import com.example.ui.components.PlayerAvatar
import com.example.ui.theme.*

@Composable
fun GameScreen(
    players: List<GamePlayer>,
    currentPlayerIndex: Int,
    balls: List<Ball>,
    aimAngle: Float,
    cuePower: Float,
    aimGuide: AimGuideData?,
    isBallInHand: Boolean,
    foulMessage: String?,
    winner: GamePlayer?,
    gameState: GameState,
    turnTimeRemaining: Int,
    entryFee: Long,
    onAimChange: (Float) -> Unit,
    onPowerChange: (Float) -> Unit,
    onShoot: () -> Unit,
    onRepositionCueBall: (Vector2) -> Unit,
    onConfirmBallInHand: () -> Unit,
    onDismissFoul: () -> Unit,
    onRematch: () -> Unit,
    onLeaveGame: () -> Unit
) {
    var showLeaveConfirmDialog by remember { mutableStateOf(false) }

    val activePlayer = players.getOrNull(currentPlayerIndex)
    val isHumanTurn = activePlayer?.isHuman == true && gameState == GameState.PLAYER_TURN

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            Surface(
                color = SurfaceCard,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { showLeaveConfirmDialog = true },
                        modifier = Modifier.testTag("game_leave_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Leave Game",
                            tint = TextSecondary
                        )
                    }

                    // Game Title & Pot
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "8BALL PRO",
                            fontWeight = FontWeight.Black,
                            fontSize = 15.sp,
                            color = AccentCyan
                        )
                        Text(
                            text = "Total Pot: 🪙 ${(entryFee * players.size).toString().replace(Regex("(\\d)(?=(\\d{3})+$)"), "$1,")}",
                            fontSize = 12.sp,
                            color = AccentGoldBright,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Turn Timer Indicator
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(
                                if (turnTimeRemaining <= 10) StatusLoss.copy(alpha = 0.2f)
                                else SurfaceCardLight
                            )
                            .border(
                                1.5.dp,
                                if (turnTimeRemaining <= 10) StatusLoss else AccentCyan,
                                CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "$turnTimeRemaining",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (turnTimeRemaining <= 10) StatusLoss else TextPrimary
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // 1. Players Status Bar (Display all 4 players with avatars, names, IDs, scores)
            PlayersStatusBar(
                players = players,
                currentPlayerIndex = currentPlayerIndex,
                modifier = Modifier.fillMaxWidth()
            )

            // 2. Foul Alert Banner (animated)
            AnimatedVisibility(
                visible = foulMessage != null,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Surface(
                    color = StatusLoss,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onDismissFoul() }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = foulMessage ?: "",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                        Text("TAP TO DISMISS", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // 3. Pool Table (Takes available screen space)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                contentAlignment = Alignment.Center
            ) {
                PoolTableCanvas(
                    balls = balls,
                    aimAngle = aimAngle,
                    cuePower = cuePower,
                    aimGuide = aimGuide,
                    isHumanTurn = isHumanTurn,
                    isBallInHand = isBallInHand,
                    onAimChange = onAimChange,
                    onRepositionCueBall = onRepositionCueBall,
                    modifier = Modifier.fillMaxSize()
                )
            }

            // 4. Bottom Controls Section
            Surface(
                color = SurfaceCard,
                shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    if (isBallInHand && isHumanTurn) {
                        // Ball In Hand Controls
                        Card(
                            colors = CardDefaults.cardColors(containerColor = SurfaceCardLight),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Ball in Hand", fontWeight = FontWeight.Bold, color = AccentCyan)
                                    Text("Drag cue ball to position", fontSize = 12.sp, color = TextSecondary)
                                }
                                Button(
                                    onClick = onConfirmBallInHand,
                                    colors = ButtonDefaults.buttonColors(containerColor = AccentCyan),
                                    modifier = Modifier.testTag("confirm_ball_in_hand_button")
                                ) {
                                    Text("Place Ball", color = Color.Black, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    } else if (isHumanTurn) {
                        // Active Human Player Turn Controls
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            // Fine Tune Aim Buttons
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                FilledTonalIconButton(
                                    onClick = { onAimChange(aimAngle - 0.04f) },
                                    modifier = Modifier.testTag("aim_left_button")
                                ) {
                                    Icon(Icons.Default.RotateLeft, contentDescription = "Aim Left", tint = AccentCyan)
                                }
                                Text("AIM", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextSecondary, modifier = Modifier.padding(horizontal = 4.dp))
                                FilledTonalIconButton(
                                    onClick = { onAimChange(aimAngle + 0.04f) },
                                    modifier = Modifier.testTag("aim_right_button")
                                ) {
                                    Icon(Icons.Default.RotateRight, contentDescription = "Aim Right", tint = AccentCyan)
                                }
                            }

                            // Turn prompt
                            Text(
                                text = "YOUR TURN",
                                fontWeight = FontWeight.Black,
                                fontSize = 14.sp,
                                color = AccentGoldBright
                            )

                            // Reset Aim to target
                            FilledTonalIconButton(
                                onClick = { onPowerChange(0f) },
                                modifier = Modifier.testTag("reset_power_button")
                            ) {
                                Icon(Icons.Default.Clear, contentDescription = "Reset Power", tint = TextSecondary)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Power Slider & Shoot Button
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("SHOT POWER", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextSecondary)
                                    Text("${(cuePower * 100).toInt()}%", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = AccentGoldBright)
                                }
                                Slider(
                                    value = cuePower,
                                    onValueChange = onPowerChange,
                                    valueRange = 0f..1f,
                                    modifier = Modifier.testTag("power_slider"),
                                    colors = SliderDefaults.colors(
                                        thumbColor = AccentGoldBright,
                                        activeTrackColor = AccentGold,
                                        inactiveTrackColor = SurfaceCardLight
                                    )
                                )
                            }

                            Button(
                                onClick = onShoot,
                                enabled = cuePower > 0.05f && gameState == GameState.PLAYER_TURN,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = AccentCyan,
                                    disabledContainerColor = SurfaceCardLight
                                ),
                                modifier = Modifier
                                    .height(48.dp)
                                    .testTag("shoot_button")
                            ) {
                                Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.Black)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "SHOOT",
                                    color = if (cuePower > 0.05f) Color.Black else TextMuted,
                                    fontWeight = FontWeight.Black
                                )
                            }
                        }
                    } else {
                        // Opponent's Turn
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = AccentCyan,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "${activePlayer?.name ?: "Opponent"}'s turn... Aiming shot",
                                color = TextSecondary,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }
    }

    // Leave Confirmation Dialog
    if (showLeaveConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showLeaveConfirmDialog = false },
            title = { Text("Leave Match?", color = TextPrimary) },
            text = { Text("Are you sure you want to leave? Your entry fee will be forfeited.", color = TextSecondary) },
            confirmButton = {
                Button(
                    onClick = {
                        showLeaveConfirmDialog = false
                        onLeaveGame()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = StatusLoss),
                    modifier = Modifier.testTag("confirm_leave_match_button")
                ) {
                    Text("Leave Match", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLeaveConfirmDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
            containerColor = SurfaceCard,
            shape = RoundedCornerShape(16.dp)
        )
    }

    // Game Over Dialog
    if (gameState == GameState.GAME_OVER) {
        val isHumanWin = winner?.isHuman == true
        val winReward = if (players.size >= 4) entryFee * 3L + (entryFee * 6L / 10L) else entryFee * 2L - (entryFee / 10L)
        GameOverDialog(
            isWin = isHumanWin,
            winner = winner,
            entryFee = entryFee,
            coinsWonOrLost = winReward,
            onRematch = onRematch,
            onLeave = onLeaveGame
        )
    }
}

@Composable
fun PlayersStatusBar(
    players: List<GamePlayer>,
    currentPlayerIndex: Int,
    modifier: Modifier = Modifier
) {
    Surface(
        color = SurfaceCardLight.copy(alpha = 0.7f),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            players.forEach { player ->
                val isTurn = player.index == currentPlayerIndex
                PlayerStatusCard(
                    player = player,
                    isTurn = isTurn,
                    modifier = Modifier.weight(1f).padding(horizontal = 2.dp)
                )
            }
        }
    }
}

@Composable
fun PlayerStatusCard(
    player: GamePlayer,
    isTurn: Boolean,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = if (isTurn) SurfaceCard else Color.Transparent,
        border = if (isTurn) androidx.compose.foundation.BorderStroke(1.5.dp, player.themeColor) else null,
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            PlayerAvatar(avatarId = player.avatarId, size = 30.dp)
            Spacer(modifier = Modifier.width(4.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = if (player.isHuman) "You" else player.name,
                        fontSize = 11.sp,
                        fontWeight = if (isTurn) FontWeight.Bold else FontWeight.Normal,
                        color = if (isTurn) TextPrimary else TextSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = player.playerId.take(6),
                        fontSize = 9.sp,
                        color = TextMuted
                    )
                    Text(
                        text = "● ${player.score}",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = AccentGoldBright
                    )
                }
            }
        }
    }
}
