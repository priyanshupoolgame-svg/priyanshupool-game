package com.example.ui.coins

import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import com.example.data.entity.UserEntity
import com.example.ui.components.formatCoins
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun AddCoinsScreen(
    user: UserEntity?,
    coinRequests: List<CoinRequestEntity>,
    onBack: () -> Unit,
    onRequestCoins: (amount: Long) -> Unit,
    onOpenAdminPanel: () -> Unit
) {
    val packages = listOf(10_000L, 25_000L, 50_000L, 100_000L)
    var selectedPackage by remember { mutableStateOf(50_000L) }
    var showSuccessMessage by remember { mutableStateOf(false) }

    val dateFormat = SimpleDateFormat("MMM dd, yyyy  hh:mm a", Locale.getDefault())

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            Surface(color = SurfaceCard, modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("add_coins_back_button")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                    Text("Add Coins", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary)
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            // Balance Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, AccentGold.copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("CURRENT BALANCE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("🪙", fontSize = 26.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "${formatCoins(user?.coins ?: 0)} Coins",
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Black,
                                color = AccentGoldBright
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Coins are virtual in-game credits only. No real money purchases.",
                            fontSize = 12.sp,
                            color = TextSecondary,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            }

            // Available Packages
            item {
                Text("AVAILABLE PACKAGES", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    packages.forEach { amount ->
                        val isSelected = amount == selectedPackage
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected) SurfaceCardLight else SurfaceCard
                            ),
                            border = androidx.compose.foundation.BorderStroke(
                                if (isSelected) 2.dp else 1.dp,
                                if (isSelected) AccentGold else SurfaceCardBorder
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectedPackage = amount }
                                .testTag("coin_package_${amount}")
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    RadioButton(
                                        selected = isSelected,
                                        onClick = { selectedPackage = amount },
                                        colors = RadioButtonDefaults.colors(selectedColor = AccentGold)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text(
                                            text = "+${formatCoins(amount)} Coins",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp,
                                            color = TextPrimary
                                        )
                                        Text(
                                            text = "Virtual Game Package",
                                            fontSize = 12.sp,
                                            color = TextSecondary
                                        )
                                    }
                                }

                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = AccentGold.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = "FREE REQUEST",
                                        color = AccentGoldBright,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 11.sp,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Request Button
            item {
                Button(
                    onClick = {
                        onRequestCoins(selectedPackage)
                        showSuccessMessage = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentGold),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .testTag("request_coins_button")
                ) {
                    Icon(Icons.Default.Send, contentDescription = null, tint = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Request ${formatCoins(selectedPackage)} Coins",
                        color = Color.Black,
                        fontWeight = FontWeight.Black,
                        fontSize = 15.sp
                    )
                }

                if (showSuccessMessage) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Card(
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(containerColor = StatusWin.copy(alpha = 0.15f)),
                        border = androidx.compose.foundation.BorderStroke(1.dp, StatusWin),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Coin request of ${formatCoins(selectedPackage)} submitted successfully! Stored for Admin approval.",
                            color = StatusWin,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }
            }

            // Admin Panel Shortcut info
            item {
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.AdminPanelSettings, contentDescription = null, tint = Color(0xFFA855F7))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Admin Architecture Ready", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text("Manage and approve coin requests in the Admin Panel", fontSize = 11.sp, color = TextSecondary)
                        }
                        TextButton(onClick = onOpenAdminPanel, modifier = Modifier.testTag("open_admin_from_coins")) {
                            Text("Manage", color = AccentCyan, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Recent Coin Requests History
            item {
                Text(
                    text = "REQUEST HISTORY (${coinRequests.size})",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            if (coinRequests.isEmpty()) {
                item {
                    Text("No coin requests submitted yet.", color = TextSecondary, fontSize = 13.sp)
                }
            } else {
                items(coinRequests) { req ->
                    val isApproved = req.status == "APPROVED"
                    Card(
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "+${formatCoins(req.amount)} Coins",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = AccentGoldBright
                                )
                                Text(
                                    text = dateFormat.format(Date(req.timestamp)),
                                    fontSize = 11.sp,
                                    color = TextMuted
                                )
                            }

                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = if (isApproved) StatusWin.copy(alpha = 0.2f) else StatusWarning.copy(alpha = 0.2f)
                            ) {
                                Text(
                                    text = req.status,
                                    color = if (isApproved) StatusWin else StatusWarning,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
