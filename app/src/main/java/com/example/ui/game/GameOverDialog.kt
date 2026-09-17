package com.example.ui.game

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SentimentDissatisfied
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.game.GamePlayer
import com.example.ui.components.formatCoins
import com.example.ui.theme.*

@Composable
fun GameOverDialog(
    isWin: Boolean,
    winner: GamePlayer?,
    entryFee: Long,
    coinsWonOrLost: Long,
    onRematch: () -> Unit,
    onLeave: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onLeave,
        title = null,
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Trophy or Result Icon
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(
                            if (isWin) {
                                Brush.radialGradient(listOf(Color(0xFFFBBF24), Color(0xFFD97706)))
                            } else {
                                Brush.radialGradient(listOf(Color(0xFF64748B), Color(0xFF334155)))
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isWin) Icons.Default.EmojiEvents else Icons.Default.SentimentDissatisfied,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(44.dp)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = if (isWin) "VICTORY!" else "MATCH FINISHED",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    color = if (isWin) AccentGoldBright else TextPrimary
                )

                Text(
                    text = if (isWin) "You won the 4-Player Match!" else "Winner: ${winner?.name ?: "Opponent"}",
                    fontSize = 14.sp,
                    color = TextSecondary
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Breakdown Card
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCardLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Entry Fee:", color = TextSecondary, fontSize = 14.sp)
                            Text("${formatCoins(entryFee)} Coins", color = TextPrimary, fontSize = 14.sp)
                        }

                        Divider(color = SurfaceCardBorder)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Result:", color = TextSecondary, fontSize = 14.sp)
                            Text(
                                text = if (isWin) "WIN" else "LOSS",
                                color = if (isWin) StatusWin else StatusLoss,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Coins Reward:", color = TextSecondary, fontSize = 14.sp)
                            Text(
                                text = if (isWin) "+${formatCoins(coinsWonOrLost)}" else "-${formatCoins(entryFee)}",
                                color = if (isWin) StatusWin else StatusLoss,
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onRematch,
                colors = ButtonDefaults.buttonColors(containerColor = AccentCyan),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("rematch_button")
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Rematch", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = onLeave,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("leave_game_button"),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary)
            ) {
                Text("Leave Game / Lobby")
            }
        },
        containerColor = SurfaceCard,
        shape = RoundedCornerShape(20.dp)
    )
}
