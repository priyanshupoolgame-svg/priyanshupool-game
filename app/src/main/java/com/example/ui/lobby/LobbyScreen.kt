package com.example.ui.lobby

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.entity.UserEntity
import com.example.ui.components.CoinBadge
import com.example.ui.components.PlayerAvatar
import com.example.ui.components.copyToClipboard
import com.example.ui.theme.*

@Composable
fun LobbyScreen(
    user: UserEntity?,
    pendingInviteCount: Int,
    onQuickMatchClick: () -> Unit,
    onPlayWithFriendClick: () -> Unit,
    onCreatePrivateMatchClick: () -> Unit,
    onJoinMatchClick: () -> Unit,
    onMatchHistoryClick: () -> Unit,
    onProfileClick: () -> Unit,
    onAddCoinsClick: () -> Unit,
    onAdminPanelClick: () -> Unit
) {
    val context = LocalContext.current

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
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Player Profile Snippet
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clickable { onProfileClick() }
                            .testTag("lobby_profile_shortcut")
                    ) {
                        PlayerAvatar(avatarId = user?.avatarId ?: 0, size = 44.dp)
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = user?.name ?: "Player",
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary,
                                fontSize = 15.sp
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "ID: ${user?.playerId ?: "PA..."}",
                                    color = TextMuted,
                                    fontSize = 11.sp
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.Default.ContentCopy,
                                    contentDescription = "Copy Player ID",
                                    tint = AccentCyan,
                                    modifier = Modifier
                                        .size(13.dp)
                                        .clickable {
                                            user?.playerId?.let { copyToClipboard(context, it, "Player ID") }
                                        }
                                        .testTag("copy_player_id_icon")
                                )
                            }
                        }
                    }

                    // Coins Badge
                    CoinBadge(
                        coins = user?.coins ?: 100_000L,
                        onClick = onAddCoinsClick
                    )
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            // Hero Banner
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            1.dp,
                            Brush.horizontalGradient(listOf(PoolFeltGreen, AccentCyan.copy(alpha = 0.5f))),
                            RoundedCornerShape(18.dp)
                        )
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.linearGradient(
                                    listOf(
                                        Color(0xFF0F2027),
                                        Color(0xFF203A43),
                                        Color(0xFF2C5364)
                                    )
                                )
                            )
                            .padding(20.dp)
                    ) {
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column {
                                    Text(
                                        text = "8BALL PRO",
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.Black,
                                        color = AccentCyan
                                    )
                                    Text(
                                        text = "4-Player Online Billiards",
                                        fontSize = 13.sp,
                                        color = TextSecondary
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(CircleShape)
                                        .background(
                                            Brush.radialGradient(
                                                listOf(Color(0xFF334155), Color(0xFF0F172A))
                                            )
                                        )
                                        .border(2.dp, AccentCyan, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("8", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Text(
                                text = "Win the table in 4-player turn rotation, sink the 8-ball and take the pool pot!",
                                fontSize = 12.sp,
                                color = Color.White.copy(alpha = 0.85f),
                                lineHeight = 17.sp
                            )
                        }
                    }
                }
            }

            // Quick Match Primary CTA
            item {
                Button(
                    onClick = onQuickMatchClick,
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentCyan),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(58.dp)
                        .testTag("quick_match_button")
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayCircleFilled,
                            contentDescription = null,
                            tint = Color.Black,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "QUICK MATCH (4 PLAYERS)",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.Black
                        )
                    }
                }
            }

            // Section: Multiplayer Modes
            item {
                Text(
                    text = "PLAY WITH FRIENDS",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    modifier = Modifier.padding(top = 6.dp, start = 4.dp)
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    LobbyActionCard(
                        title = "Play With Friend",
                        subtitle = if (pendingInviteCount > 0) "$pendingInviteCount Invites!" else "Search & Invite ID",
                        icon = Icons.Default.GroupAdd,
                        accentColor = AccentGold,
                        badge = if (pendingInviteCount > 0) "$pendingInviteCount" else null,
                        onClick = onPlayWithFriendClick,
                        modifier = Modifier.weight(1f).testTag("play_with_friend_card")
                    )

                    LobbyActionCard(
                        title = "Private Match",
                        subtitle = "Create or Join Room",
                        icon = Icons.Default.VpnKey,
                        accentColor = Color(0xFFA855F7),
                        onClick = onCreatePrivateMatchClick,
                        modifier = Modifier.weight(1f).testTag("private_match_card")
                    )
                }
            }

            // Section: Player Features
            item {
                Text(
                    text = "PLAYER STATS & COINS",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    modifier = Modifier.padding(top = 6.dp, start = 4.dp)
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    LobbyActionCard(
                        title = "Match History",
                        subtitle = "W/L & Coins Record",
                        icon = Icons.Default.History,
                        accentColor = Color(0xFF10B981),
                        onClick = onMatchHistoryClick,
                        modifier = Modifier.weight(1f).testTag("match_history_card")
                    )

                    LobbyActionCard(
                        title = "Player Profile",
                        subtitle = "Stats & Customization",
                        icon = Icons.Default.AccountCircle,
                        accentColor = AccentCyan,
                        onClick = onProfileClick,
                        modifier = Modifier.weight(1f).testTag("profile_card")
                    )
                }
            }

            item {
                LobbyActionRow(
                    title = "Add Coins (Virtual Currency)",
                    subtitle = "Request coins packages for your account",
                    icon = Icons.Default.MonetizationOn,
                    iconTint = AccentGoldBright,
                    onClick = onAddCoinsClick,
                    modifier = Modifier.testTag("add_coins_card")
                )
            }

            item {
                LobbyActionRow(
                    title = "Admin Architecture Console",
                    subtitle = "Review accounts, approve coin requests, game records",
                    icon = Icons.Default.AdminPanelSettings,
                    iconTint = Color(0xFF9333EA),
                    onClick = onAdminPanelClick,
                    modifier = Modifier.testTag("admin_panel_card")
                )
            }
        }
    }
}

@Composable
fun LobbyActionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    badge: String? = null,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
        modifier = modifier
            .clickable { onClick() }
    ) {
        Box(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
            Column {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(accentColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = TextPrimary
                )
                Text(
                    text = subtitle,
                    fontSize = 11.sp,
                    color = TextSecondary
                )
            }

            if (badge != null) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .clip(CircleShape)
                        .background(StatusLoss)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = badge,
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun LobbyActionRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconTint: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(iconTint.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = TextPrimary
                )
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = TextSecondary
                )
            }
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = TextMuted
            )
        }
    }
}
