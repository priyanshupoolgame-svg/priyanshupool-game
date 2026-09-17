package com.example.ui.matchmaking

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.PlayerAvatar
import com.example.ui.components.formatCoins
import com.example.ui.theme.*

data class MatchmakingPlayer(
    val slot: Int,
    val name: String,
    val playerId: String,
    val avatarId: Int,
    val isReady: Boolean
)

@Composable
fun MatchmakingScreen(
    playersFound: Int,
    maxPlayers: Int = 4,
    entryFee: Long,
    players: List<MatchmakingPlayer>,
    onCancel: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "radar")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Scaffold(
        containerColor = DarkBackground
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top Section
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Spacer(modifier = Modifier.height(20.dp))
                Text(
                    text = "8BALL PRO",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = AccentCyan
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (playersFound < maxPlayers) "Finding Players..." else "All Players Ready!",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (playersFound < maxPlayers) TextPrimary else StatusWin
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Entry Fee: ${formatCoins(entryFee)} Coins  •  Total Pot: 🪙 ${formatCoins(entryFee * maxPlayers)}",
                    fontSize = 13.sp,
                    color = AccentGoldBright
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Progress Bar & Count
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = SurfaceCard,
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                    modifier = Modifier.padding(horizontal = 16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(
                            progress = { playersFound.toFloat() / maxPlayers.toFloat() },
                            modifier = Modifier.size(24.dp),
                            color = AccentCyan,
                            trackColor = SurfaceCardLight,
                            strokeWidth = 3.dp
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "Players Found: $playersFound / $maxPlayers",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }
                }
            }

            // Center Section: 4 Player Slots Grid
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                for (i in 0 until maxPlayers) {
                    val player = players.getOrNull(i)
                    PlayerSlotCard(
                        slotNumber = i + 1,
                        player = player,
                        pulseScale = if (player == null && i == playersFound) pulseScale else 1.0f
                    )
                }
            }

            // Bottom Cancel Button
            Button(
                onClick = onCancel,
                colors = ButtonDefaults.buttonColors(containerColor = SurfaceCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("cancel_matchmaking_button")
            ) {
                Icon(Icons.Default.Close, contentDescription = null, tint = TextSecondary)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Cancel Matchmaking", color = TextSecondary, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun PlayerSlotCard(
    slotNumber: Int,
    player: MatchmakingPlayer?,
    pulseScale: Float
) {
    val isFilled = player != null

    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isFilled) SurfaceCard else SurfaceCardLight.copy(alpha = 0.5f)
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isFilled) AccentCyan.copy(alpha = 0.6f) else SurfaceCardBorder
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (isFilled) {
                PlayerAvatar(avatarId = player!!.avatarId, size = 42.dp)
                Spacer(modifier = Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = player.name,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = TextPrimary
                    )
                    Text(
                        text = "ID: ${player.playerId}",
                        fontSize = 12.sp,
                        color = TextMuted
                    )
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = StatusWin.copy(alpha = 0.2f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, StatusWin)
                ) {
                    Text(
                        text = "READY",
                        color = StatusWin,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            } else {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(SurfaceCardBorder.copy(alpha = 0.4f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = TextMuted,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Spacer(modifier = Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Searching for Player $slotNumber...",
                        color = TextSecondary,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "Slot $slotNumber open",
                        color = TextMuted,
                        fontSize = 11.sp
                    )
                }
                CircularProgressIndicator(
                    modifier = Modifier.size(18.dp),
                    color = AccentCyan.copy(alpha = 0.6f),
                    strokeWidth = 2.dp
                )
            }
        }
    }
}
