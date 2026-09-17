package com.example.ui.friends

import androidx.compose.foundation.background
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.entity.FriendInvitationEntity
import com.example.data.entity.UserEntity
import com.example.ui.components.copyToClipboard
import com.example.ui.components.formatCoins
import com.example.ui.theme.*

@Composable
fun PlayWithFriendScreen(
    user: UserEntity?,
    receivedInvites: List<FriendInvitationEntity>,
    onBack: () -> Unit,
    onSendInvite: (targetPlayerId: String, entryFee: Long) -> Unit,
    onAcceptInvite: (invite: FriendInvitationEntity) -> Unit,
    onRejectInvite: (inviteId: Long) -> Unit,
    onStartPrivateRoom: (fee: Long) -> Unit
) {
    val context = LocalContext.current
    var searchIdInput by remember { mutableStateOf("") }
    var selectedFee by remember { mutableStateOf(5000L) }
    var inviteSuccessMsg by remember { mutableStateOf<String?>(null) }

    val feeOptions = listOf(1000L, 5000L, 10000L, 25000L, 50000L)

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
                    IconButton(onClick = onBack, modifier = Modifier.testTag("friend_screen_back_button")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                    Text(
                        text = "Play With Friend",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = TextPrimary
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
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            // My Player ID Share Card
            item {
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("YOUR UNIQUE PLAYER ID", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = user?.playerId ?: "PA000000",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Black,
                                color = AccentCyan
                            )
                            Button(
                                onClick = {
                                    user?.playerId?.let { copyToClipboard(context, it, "Player ID") }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = SurfaceCardLight),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.testTag("copy_my_player_id_button")
                            ) {
                                Icon(Icons.Default.ContentCopy, contentDescription = null, tint = AccentCyan, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Copy Player ID", color = AccentCyan, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }

            // Invite Player Section
            item {
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("INVITE A FRIEND", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)

                        OutlinedTextField(
                            value = searchIdInput,
                            onValueChange = { searchIdInput = it.uppercase() },
                            placeholder = { Text("Enter Player ID (e.g. PA784521)", color = TextMuted) },
                            singleLine = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("friend_id_input"),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = AccentCyan,
                                unfocusedBorderColor = SurfaceCardBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            )
                        )

                        Text("Match Entry Fee", fontSize = 12.sp, color = TextSecondary)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            feeOptions.take(3).forEach { fee ->
                                val isSelected = fee == selectedFee
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { selectedFee = fee },
                                    label = { Text("${formatCoins(fee)}", fontSize = 11.sp) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = AccentGold,
                                        selectedLabelColor = Color.Black
                                    )
                                )
                            }
                        }

                        Button(
                            onClick = {
                                if (searchIdInput.isNotBlank()) {
                                    onSendInvite(searchIdInput, selectedFee)
                                    inviteSuccessMsg = "Invitation sent to $searchIdInput!"
                                    searchIdInput = ""
                                }
                            },
                            enabled = searchIdInput.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = AccentCyan),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("send_invite_button")
                        ) {
                            Icon(Icons.Default.Send, contentDescription = null, tint = Color.Black)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Invite Friend to Match", color = Color.Black, fontWeight = FontWeight.Bold)
                        }

                        if (inviteSuccessMsg != null) {
                            Text(
                                text = inviteSuccessMsg!!,
                                color = StatusWin,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Direct Private Room Creator
            item {
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceCardBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text("CREATE PRIVATE ROOM", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text(
                            text = "Start a private match table and invite players directly to your game.",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                        Button(
                            onClick = { onStartPrivateRoom(selectedFee) },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA855F7)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("create_private_room_button")
                        ) {
                            Icon(Icons.Default.AddCircleOutline, contentDescription = null, tint = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Create Private Match (${formatCoins(selectedFee)} Coins)", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Pending Invitations List
            item {
                Text(
                    text = "RECEIVED INVITATIONS (${receivedInvites.size})",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            if (receivedInvites.isEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No pending invitations right now.", color = TextSecondary, fontSize = 13.sp)
                        }
                    }
                }
            } else {
                items(receivedInvites) { invite ->
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                        border = androidx.compose.foundation.BorderStroke(1.dp, AccentCyan.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Mail, contentDescription = null, tint = AccentCyan, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Match Invitation",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = TextPrimary
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Player ${invite.fromPlayerName} (${invite.fromPlayerId}) invited you to a Pool Match.",
                                color = TextSecondary,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Entry Fee: ${formatCoins(invite.entryFee)} Coins",
                                color = AccentGoldBright,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Button(
                                    onClick = { onAcceptInvite(invite) },
                                    colors = ButtonDefaults.buttonColors(containerColor = StatusWin),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f).testTag("accept_invite_button")
                                ) {
                                    Text("Accept", color = Color.White, fontWeight = FontWeight.Bold)
                                }

                                OutlinedButton(
                                    onClick = { onRejectInvite(invite.id) },
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f).testTag("reject_invite_button")
                                ) {
                                    Text("Decline")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
