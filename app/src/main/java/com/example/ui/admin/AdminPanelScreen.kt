package com.example.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.entity.CoinRequestEntity
import com.example.data.entity.MatchRecordEntity
import com.example.data.entity.UserEntity
import com.example.ui.components.PlayerAvatar
import com.example.ui.components.formatCoins
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun AdminPanelScreen(
    users: List<UserEntity>,
    coinRequests: List<CoinRequestEntity>,
    matches: List<MatchRecordEntity>,
    onBack: () -> Unit,
    onApproveCoinRequest: (id: Long, playerId: String, amount: Long) -> Unit,
    onRejectCoinRequest: (id: Long) -> Unit,
    onAdjustCoins: (userId: Long, newCoins: Long) -> Unit,
    onToggleBlockUser: (userId: Long, isBlocked: Boolean) -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Overview", "Coin Requests", "Players", "Matches")
    val dateFormat = SimpleDateFormat("MM/dd/yy hh:mm a", Locale.getDefault())

    var adjustingUser by remember { mutableStateOf<UserEntity?>(null) }
    var adjustCoinsInput by remember { mutableStateOf("") }

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            Surface(color = SurfaceCard, modifier = Modifier.fillMaxWidth()) {
                Column {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding()
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = onBack, modifier = Modifier.testTag("admin_back_button")) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                        }
                        Text(
                            text = "Admin Panel Architecture",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = TextPrimary
                        )
                    }

                    TabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = SurfaceCard,
                        contentColor = AccentCyan
                    ) {
                        tabs.forEachIndexed { index, title ->
                            Tab(
                                selected = selectedTab == index,
                                onClick = { selectedTab = index },
                                text = {
                                    Text(
                                        text = title,
                                        fontSize = 12.sp,
                                        fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                                        color = if (selectedTab == index) AccentCyan else TextSecondary
                                    )
                                }
                            )
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        when (selectedTab) {
            0 -> {
                // Overview Tab
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    item {
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("SYSTEM TELEMETRY & STATS", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                                Spacer(modifier = Modifier.height(10.dp))
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    AdminStatBox("Total Players", "${users.size}", Modifier.weight(1f))
                                    AdminStatBox("Matches Played", "${matches.size}", Modifier.weight(1f))
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    val pendingRequests = coinRequests.count { it.status == "PENDING" }
                                    AdminStatBox("Pending Coin Reqs", "$pendingRequests", Modifier.weight(1f), if (pendingRequests > 0) StatusWarning else AccentCyan)
                                    val totalCoins = users.sumOf { it.coins }
                                    AdminStatBox("Coins in System", formatCoins(totalCoins), Modifier.weight(1f), AccentGoldBright)
                                }
                            }
                        }
                    }

                    item {
                        Text("ADMIN ARCHITECTURE DETAILS", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                    }

                    item {
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Modular Database Design:", fontWeight = FontWeight.Bold, color = AccentCyan)
                                Text("• Dedicated UserDao manages user balances, ban flags, and permanent player IDs.", fontSize = 12.sp, color = TextSecondary)
                                Text("• CoinRequestDao handles asynchronous player coin claims with approval states.", fontSize = 12.sp, color = TextSecondary)
                                Text("• MatchRecordDao stores complete audit logs of every match, entry fees, and payouts.", fontSize = 12.sp, color = TextSecondary)
                                Text("• FriendInvitationDao tracks private matchmaking rooms and friend pairings.", fontSize = 12.sp, color = TextSecondary)
                            }
                        }
                    }
                }
            }

            1 -> {
                // Coin Requests Management Tab
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (coinRequests.isEmpty()) {
                        item {
                            Text("No coin requests found in the system.", color = TextSecondary)
                        }
                    } else {
                        items(coinRequests) { req ->
                            val isPending = req.status == "PENDING"
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                                border = androidx.compose.foundation.BorderStroke(1.dp, if (isPending) AccentGold else SurfaceCardBorder),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(
                                                text = "${req.playerName} (${req.playerId})",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp,
                                                color = TextPrimary
                                            )
                                            Text(
                                                text = "+${formatCoins(req.amount)} Coins Requested",
                                                fontWeight = FontWeight.Black,
                                                fontSize = 15.sp,
                                                color = AccentGoldBright
                                            )
                                        }

                                        Surface(
                                            shape = RoundedCornerShape(6.dp),
                                            color = when (req.status) {
                                                "APPROVED" -> StatusWin.copy(alpha = 0.2f)
                                                "REJECTED" -> StatusLoss.copy(alpha = 0.2f)
                                                else -> StatusWarning.copy(alpha = 0.2f)
                                            }
                                        ) {
                                            Text(
                                                text = req.status,
                                                color = when (req.status) {
                                                    "APPROVED" -> StatusWin
                                                    "REJECTED" -> StatusLoss
                                                    else -> StatusWarning
                                                },
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = dateFormat.format(Date(req.timestamp)),
                                        fontSize = 11.sp,
                                        color = TextMuted
                                    )

                                    if (isPending) {
                                        Spacer(modifier = Modifier.height(10.dp))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            Button(
                                                onClick = { onApproveCoinRequest(req.id, req.playerId, req.amount) },
                                                colors = ButtonDefaults.buttonColors(containerColor = StatusWin),
                                                modifier = Modifier.weight(1f).testTag("admin_approve_${req.id}")
                                            ) {
                                                Text("Approve & Credit", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                            }
                                            OutlinedButton(
                                                onClick = { onRejectCoinRequest(req.id) },
                                                colors = ButtonDefaults.outlinedButtonColors(contentColor = StatusLoss),
                                                modifier = Modifier.weight(1f).testTag("admin_reject_${req.id}")
                                            ) {
                                                Text("Reject", fontSize = 12.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            2 -> {
                // Players Management Tab
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(users) { player ->
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    PlayerAvatar(avatarId = player.avatarId, size = 36.dp)
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(player.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                        Text("ID: ${player.playerId} • Matches: ${player.matchesPlayed} (W: ${player.wins} L: ${player.losses})", fontSize = 11.sp, color = TextSecondary)
                                    }
                                    Text(
                                        text = "${formatCoins(player.coins)} Coins",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = AccentGoldBright
                                    )
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Button(
                                        onClick = {
                                            adjustingUser = player
                                            adjustCoinsInput = player.coins.toString()
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = SurfaceCardLight),
                                        modifier = Modifier.weight(1f).testTag("admin_adjust_coins_${player.id}")
                                    ) {
                                        Text("Adjust Coins", fontSize = 12.sp, color = AccentCyan)
                                    }

                                    Button(
                                        onClick = { onToggleBlockUser(player.id, !player.isBlocked) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (player.isBlocked) StatusWin else StatusLoss.copy(alpha = 0.2f)
                                        ),
                                        modifier = Modifier.weight(1f).testTag("admin_toggle_block_${player.id}")
                                    ) {
                                        Text(
                                            text = if (player.isBlocked) "Unblock Player" else "Suspend Player",
                                            fontSize = 12.sp,
                                            color = if (player.isBlocked) Color.White else StatusLoss
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            3 -> {
                // Matches Records Tab
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (matches.isEmpty()) {
                        item {
                            Text("No match records yet.", color = TextSecondary)
                        }
                    } else {
                        items(matches) { m ->
                            Card(
                                shape = RoundedCornerShape(10.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(m.matchId, fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 13.sp)
                                        Text(
                                            text = "${m.result} (${if (m.result == "WIN") "+" else ""}${formatCoins(m.coinsDelta)})",
                                            color = if (m.result == "WIN") StatusWin else StatusLoss,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Mode: ${m.mode} • Fee: ${formatCoins(m.entryFee)} Coins", fontSize = 11.sp, color = TextSecondary)
                                    Text("Opponents: ${m.opponents}", fontSize = 11.sp, color = TextMuted)
                                    Text(dateFormat.format(Date(m.timestamp)), fontSize = 10.sp, color = TextMuted)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Adjust Coins Dialog
    adjustingUser?.let { user ->
        AlertDialog(
            onDismissRequest = { adjustingUser = null },
            title = { Text("Adjust Player Balance", color = TextPrimary) },
            text = {
                Column {
                    Text("Player: ${user.name} (${user.playerId})", color = TextSecondary, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = adjustCoinsInput,
                        onValueChange = { adjustCoinsInput = it },
                        label = { Text("Coin Balance") },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amount = adjustCoinsInput.toLongOrNull() ?: user.coins
                        onAdjustCoins(user.id, amount)
                        adjustingUser = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentCyan)
                ) {
                    Text("Save Balance", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { adjustingUser = null }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
            containerColor = SurfaceCard
        )
    }
}

@Composable
fun AdminStatBox(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    color: Color = AccentCyan
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = SurfaceCardLight,
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(title, fontSize = 11.sp, color = TextSecondary)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Black, color = color)
        }
    }
}
