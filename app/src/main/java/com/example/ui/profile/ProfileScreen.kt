package com.example.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.entity.UserEntity
import com.example.ui.components.PlayerAvatar
import com.example.ui.components.copyToClipboard
import com.example.ui.components.formatCoins
import com.example.ui.theme.*

@Composable
fun ProfileScreen(
    user: UserEntity?,
    onBack: () -> Unit,
    onSaveProfile: (name: String, avatarId: Int) -> Unit,
    onViewHistory: () -> Unit
) {
    val context = LocalContext.current
    var editingName by remember(user?.name) { mutableStateOf(user?.name ?: "") }
    var selectedAvatarId by remember(user?.avatarId) { mutableStateOf(user?.avatarId ?: 0) }
    var saveSuccess by remember { mutableStateOf(false) }

    val matchesPlayed = user?.matchesPlayed ?: 0
    val wins = user?.wins ?: 0
    val losses = user?.losses ?: 0
    val winRate = if (matchesPlayed > 0) ((wins.toFloat() / matchesPlayed.toFloat()) * 100).toInt() else 0

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
                    IconButton(onClick = onBack, modifier = Modifier.testTag("profile_back_button")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                    Text("Player Profile", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary)
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
            // Profile Card & Avatar Selection
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        PlayerAvatar(avatarId = selectedAvatarId, size = 80.dp)

                        Spacer(modifier = Modifier.height(12.dp))

                        Text("SELECT AVATAR", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                        Spacer(modifier = Modifier.height(8.dp))

                        // 6 Avatar Choices
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.padding(vertical = 6.dp)
                        ) {
                            for (id in 0..5) {
                                val isSelected = id == selectedAvatarId
                                Box(
                                    modifier = Modifier
                                        .clickable { selectedAvatarId = id }
                                        .padding(2.dp)
                                        .border(
                                            if (isSelected) 2.dp else 0.dp,
                                            if (isSelected) AccentCyan else Color.Transparent,
                                            CircleShape
                                        )
                                ) {
                                    PlayerAvatar(avatarId = id, size = 42.dp)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Editable Name Field
                        OutlinedTextField(
                            value = editingName,
                            onValueChange = {
                                editingName = it
                                saveSuccess = false
                            },
                            label = { Text("Display Name") },
                            singleLine = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("profile_name_input"),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = AccentCyan,
                                unfocusedBorderColor = SurfaceCardBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            )
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Player ID & Copy
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = SurfaceCardLight,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("PLAYER ID", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                                    Text(user?.playerId ?: "PA000000", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = AccentCyan)
                                }
                                IconButton(
                                    onClick = {
                                        user?.playerId?.let { copyToClipboard(context, it, "Player ID") }
                                    },
                                    modifier = Modifier.testTag("profile_copy_id_button")
                                ) {
                                    Icon(Icons.Default.ContentCopy, contentDescription = "Copy", tint = AccentCyan, modifier = Modifier.size(18.dp))
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                if (editingName.isNotBlank()) {
                                    onSaveProfile(editingName, selectedAvatarId)
                                    saveSuccess = true
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentCyan),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("profile_save_button")
                        ) {
                            Text("Save Profile Changes", color = Color.Black, fontWeight = FontWeight.Bold)
                        }

                        if (saveSuccess) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Profile saved successfully!", color = StatusWin, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Statistics Grid
            item {
                Text("CAREER STATISTICS", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatCard(title = "Coins", value = "🪙 ${formatCoins(user?.coins ?: 0)}", accent = AccentGoldBright, modifier = Modifier.weight(1f))
                    StatCard(title = "Win Rate", value = "$winRate%", accent = if (winRate >= 50) StatusWin else AccentCyan, modifier = Modifier.weight(1f))
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatCard(title = "Matches", value = "$matchesPlayed", accent = TextPrimary, modifier = Modifier.weight(1f))
                    StatCard(title = "Wins", value = "$wins", accent = StatusWin, modifier = Modifier.weight(1f))
                    StatCard(title = "Losses", value = "$losses", accent = StatusLoss, modifier = Modifier.weight(1f))
                }
            }

            // Match History Link
            item {
                Button(
                    onClick = onViewHistory,
                    colors = ButtonDefaults.buttonColors(containerColor = SurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .testTag("profile_view_history_button")
                ) {
                    Icon(Icons.Default.History, contentDescription = null, tint = AccentCyan)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("View Complete Match History", color = TextPrimary, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    accent: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(title.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontSize = 17.sp, fontWeight = FontWeight.Black, color = accent)
        }
    }
}
