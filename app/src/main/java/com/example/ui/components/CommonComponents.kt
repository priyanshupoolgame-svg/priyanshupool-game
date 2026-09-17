package com.example.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import java.text.NumberFormat
import java.util.Locale

fun formatCoins(amount: Long): String {
    return NumberFormat.getNumberInstance(Locale.US).format(amount)
}

fun copyToClipboard(context: Context, text: String, label: String = "Player ID") {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText(label, text)
    clipboard.setPrimaryClip(clip)
    Toast.makeText(context, "$label copied: $text", Toast.LENGTH_SHORT).show()
}

fun getAvatarGradient(avatarId: Int): Brush {
    return when (avatarId % 6) {
        0 -> Brush.linearGradient(listOf(Color(0xFF2563EB), Color(0xFF06B6D4))) // Blue-Cyan
        1 -> Brush.linearGradient(listOf(Color(0xFFD97706), Color(0xFFFBBF24))) // Gold
        2 -> Brush.linearGradient(listOf(Color(0xFF059669), Color(0xFF34D399))) // Emerald
        3 -> Brush.linearGradient(listOf(Color(0xFF7C3AED), Color(0xFFA855F7))) // Purple
        4 -> Brush.linearGradient(listOf(Color(0xFFDC2626), Color(0xFFF87171))) // Red
        else -> Brush.linearGradient(listOf(Color(0xFF475569), Color(0xFF94A3B8))) // Slate
    }
}

fun getAvatarIcon(avatarId: Int): ImageVector {
    return when (avatarId % 6) {
        0 -> Icons.Default.SportsScore
        1 -> Icons.Default.EmojiEvents
        2 -> Icons.Default.Stars
        3 -> Icons.Default.FlashOn
        4 -> Icons.Default.Shield
        else -> Icons.Default.Person
    }
}

@Composable
fun CoinBadge(
    coins: Long,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = Color(0xFF1E293B),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF59E0B).copy(alpha = 0.5f)),
        modifier = modifier
            .testTag("coin_badge")
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(20.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            listOf(Color(0xFFFBBF24), Color(0xFFD97706))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "🪙",
                    fontSize = 12.sp
                )
            }
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = formatCoins(coins),
                color = AccentGoldBright,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
            if (onClick != null) {
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    imageVector = Icons.Default.AddCircle,
                    contentDescription = "Add Coins",
                    tint = AccentGold,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun PlayerAvatar(
    avatarId: Int,
    size: Dp = 48.dp,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(getAvatarGradient(avatarId))
            .border(2.dp, Color.White.copy(alpha = 0.4f), CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = getAvatarIcon(avatarId),
            contentDescription = "Avatar",
            tint = Color.White,
            modifier = Modifier.size(size * 0.55f)
        )
    }
}

@Composable
fun LowCoinsDialog(
    onDismiss: () -> Unit,
    onAddCoinsClick: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = AccentGold,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Insufficient Coins",
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )
            }
        },
        text = {
            Text(
                text = "You don't have enough coins to join this match.",
                color = TextSecondary,
                fontSize = 15.sp
            )
        },
        confirmButton = {
            Button(
                onClick = onAddCoinsClick,
                colors = ButtonDefaults.buttonColors(containerColor = AccentGold),
                modifier = Modifier.testTag("dialog_add_coins_button")
            ) {
                Text("Add Coins", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.testTag("dialog_back_button")
            ) {
                Text("Back", color = TextSecondary)
            }
        },
        containerColor = SurfaceCard,
        shape = RoundedCornerShape(16.dp)
    )
}

@Composable
fun MatchEntryConfirmationDialog(
    entryFee: Long,
    currentBalance: Long,
    onConfirm: () -> Unit,
    onCancel: () -> Unit
) {
    val balanceAfter = currentBalance - entryFee

    AlertDialog(
        onDismissRequest = onCancel,
        title = {
            Text(
                text = "Confirm Match",
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
                fontSize = 20.sp
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
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
                            Text(
                                "${formatCoins(entryFee)} Coins",
                                color = AccentGoldBright,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }

                        Divider(color = SurfaceCardBorder)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Current Balance:", color = TextSecondary, fontSize = 14.sp)
                            Text(
                                "${formatCoins(currentBalance)} Coins",
                                color = TextPrimary,
                                fontSize = 14.sp
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("After Entry:", color = TextSecondary, fontSize = 14.sp)
                            Text(
                                "${formatCoins(balanceAfter)} Coins",
                                color = if (balanceAfter >= 0) AccentCyan else StatusLoss,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = AccentCyan),
                modifier = Modifier.testTag("confirm_entry_button")
            ) {
                Text("Confirm", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(
                onClick = onCancel,
                modifier = Modifier.testTag("cancel_entry_button")
            ) {
                Text("Cancel", color = TextSecondary)
            }
        },
        containerColor = SurfaceCard,
        shape = RoundedCornerShape(16.dp)
    )
}
