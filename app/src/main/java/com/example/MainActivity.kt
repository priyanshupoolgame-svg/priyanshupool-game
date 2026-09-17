package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.admin.AdminPanelScreen
import com.example.ui.coins.AddCoinsScreen
import com.example.ui.components.LowCoinsDialog
import com.example.ui.components.MatchEntryConfirmationDialog
import com.example.ui.friends.PlayWithFriendScreen
import com.example.ui.game.GameScreen
import com.example.ui.history.MatchHistoryScreen
import com.example.ui.lobby.LobbyScreen
import com.example.ui.matchmaking.MatchmakingScreen
import com.example.ui.profile.ProfileScreen
import com.example.ui.theme.DarkBackground
import com.example.ui.theme.MyApplicationTheme
import com.example.viewmodel.AppScreen
import com.example.viewmodel.PoolGameViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DarkBackground
                ) {
                    PoolAppRoot()
                }
            }
        }
    }
}

@Composable
fun PoolAppRoot(viewModel: PoolGameViewModel = viewModel()) {
    val currentScreen by viewModel.currentScreen.collectAsStateWithLifecycle()
    val currentUser by viewModel.currentUser.collectAsStateWithLifecycle()
    val allMatches by viewModel.allMatches.collectAsStateWithLifecycle()
    val allCoinRequests by viewModel.allCoinRequests.collectAsStateWithLifecycle()
    val allUsers by viewModel.allUsers.collectAsStateWithLifecycle()
    val receivedInvites by viewModel.receivedInvites.collectAsStateWithLifecycle()

    // Game engine states
    val gameState by viewModel.engine.gameState.collectAsStateWithLifecycle()
    val players by viewModel.engine.players.collectAsStateWithLifecycle()
    val currentPlayerIndex by viewModel.engine.currentPlayerIndex.collectAsStateWithLifecycle()
    val balls by viewModel.engine.balls.collectAsStateWithLifecycle()
    val aimAngle by viewModel.engine.aimAngle.collectAsStateWithLifecycle()
    val cuePower by viewModel.engine.cuePower.collectAsStateWithLifecycle()
    val aimGuide by viewModel.engine.aimGuide.collectAsStateWithLifecycle()
    val isBallInHand by viewModel.engine.isBallInHand.collectAsStateWithLifecycle()
    val foulMessage by viewModel.engine.foulMessage.collectAsStateWithLifecycle()
    val winner by viewModel.engine.winner.collectAsStateWithLifecycle()
    val entryFee by viewModel.engine.entryFee.collectAsStateWithLifecycle()
    val turnTimeRemaining by viewModel.engine.turnTimeRemaining.collectAsStateWithLifecycle()

    // Matchmaking state
    val playersFound by viewModel.playersFound.collectAsStateWithLifecycle()
    val matchmakingPlayers by viewModel.matchmakingPlayers.collectAsStateWithLifecycle()
    val pendingEntryFee by viewModel.pendingEntryFee.collectAsStateWithLifecycle()

    // Android back navigation handler
    BackHandler(enabled = currentScreen != AppScreen.LOBBY) {
        when (currentScreen) {
            AppScreen.GAME -> viewModel.onLeaveGame()
            AppScreen.MATCHMAKING -> viewModel.cancelMatchmaking()
            AppScreen.MATCH_ENTRY_CONFIRM -> viewModel.cancelMatchEntry()
            AppScreen.LOW_COINS_ALERT -> viewModel.navigateTo(AppScreen.LOBBY)
            else -> viewModel.navigateTo(AppScreen.LOBBY)
        }
    }

    when (currentScreen) {
        AppScreen.LOBBY, AppScreen.MATCH_ENTRY_CONFIRM, AppScreen.LOW_COINS_ALERT -> {
            LobbyScreen(
                user = currentUser,
                pendingInviteCount = receivedInvites.size,
                onQuickMatchClick = { viewModel.requestQuickMatch(5000L) },
                onPlayWithFriendClick = { viewModel.navigateTo(AppScreen.PLAY_WITH_FRIEND) },
                onCreatePrivateMatchClick = { viewModel.navigateTo(AppScreen.PLAY_WITH_FRIEND) },
                onJoinMatchClick = { viewModel.navigateTo(AppScreen.PLAY_WITH_FRIEND) },
                onMatchHistoryClick = { viewModel.navigateTo(AppScreen.MATCH_HISTORY) },
                onProfileClick = { viewModel.navigateTo(AppScreen.PROFILE) },
                onAddCoinsClick = { viewModel.navigateTo(AppScreen.ADD_COINS) },
                onAdminPanelClick = { viewModel.navigateTo(AppScreen.ADMIN_PANEL) }
            )

            if (currentScreen == AppScreen.MATCH_ENTRY_CONFIRM) {
                MatchEntryConfirmationDialog(
                    entryFee = pendingEntryFee,
                    currentBalance = currentUser?.coins ?: 0L,
                    onConfirm = { viewModel.confirmMatchEntry() },
                    onCancel = { viewModel.cancelMatchEntry() }
                )
            }

            if (currentScreen == AppScreen.LOW_COINS_ALERT) {
                LowCoinsDialog(
                    onDismiss = { viewModel.navigateTo(AppScreen.LOBBY) },
                    onAddCoinsClick = { viewModel.navigateTo(AppScreen.ADD_COINS) }
                )
            }
        }

        AppScreen.MATCHMAKING -> {
            MatchmakingScreen(
                playersFound = playersFound,
                maxPlayers = 4,
                entryFee = pendingEntryFee,
                players = matchmakingPlayers,
                onCancel = { viewModel.cancelMatchmaking() }
            )
        }

        AppScreen.GAME -> {
            GameScreen(
                players = players,
                currentPlayerIndex = currentPlayerIndex,
                balls = balls,
                aimAngle = aimAngle,
                cuePower = cuePower,
                aimGuide = aimGuide,
                isBallInHand = isBallInHand,
                foulMessage = foulMessage,
                winner = winner,
                gameState = gameState,
                turnTimeRemaining = turnTimeRemaining,
                entryFee = entryFee,
                onAimChange = { viewModel.onAimChange(it) },
                onPowerChange = { viewModel.onPowerChange(it) },
                onShoot = { viewModel.onShoot() },
                onRepositionCueBall = { viewModel.onRepositionCueBall(it) },
                onConfirmBallInHand = { viewModel.onConfirmBallInHand() },
                onDismissFoul = { viewModel.onDismissFoul() },
                onRematch = { viewModel.onRematch() },
                onLeaveGame = { viewModel.onLeaveGame() }
            )
        }

        AppScreen.PLAY_WITH_FRIEND -> {
            PlayWithFriendScreen(
                user = currentUser,
                receivedInvites = receivedInvites,
                onBack = { viewModel.navigateTo(AppScreen.LOBBY) },
                onSendInvite = { targetId, fee -> viewModel.sendFriendInvite(targetId, fee) },
                onAcceptInvite = { invite -> viewModel.acceptFriendInvite(invite) },
                onRejectInvite = { inviteId -> viewModel.rejectFriendInvite(inviteId) },
                onStartPrivateRoom = { fee -> viewModel.createPrivateRoom(fee) }
            )
        }

        AppScreen.PROFILE -> {
            ProfileScreen(
                user = currentUser,
                onBack = { viewModel.navigateTo(AppScreen.LOBBY) },
                onSaveProfile = { name, avatarId -> viewModel.updateProfile(name, avatarId) },
                onViewHistory = { viewModel.navigateTo(AppScreen.MATCH_HISTORY) }
            )
        }

        AppScreen.MATCH_HISTORY -> {
            MatchHistoryScreen(
                matches = allMatches,
                onBack = { viewModel.navigateTo(AppScreen.LOBBY) }
            )
        }

        AppScreen.ADD_COINS -> {
            AddCoinsScreen(
                user = currentUser,
                coinRequests = allCoinRequests.filter { it.playerId == currentUser?.playerId },
                onBack = { viewModel.navigateTo(AppScreen.LOBBY) },
                onRequestCoins = { amount -> viewModel.requestCoins(amount) },
                onOpenAdminPanel = { viewModel.navigateTo(AppScreen.ADMIN_PANEL) }
            )
        }

        AppScreen.ADMIN_PANEL -> {
            AdminPanelScreen(
                users = allUsers,
                coinRequests = allCoinRequests,
                matches = allMatches,
                onBack = { viewModel.navigateTo(AppScreen.LOBBY) },
                onApproveCoinRequest = { id, playerId, amount ->
                    viewModel.adminApproveCoinRequest(id, playerId, amount)
                },
                onRejectCoinRequest = { id ->
                    viewModel.adminRejectCoinRequest(id)
                },
                onAdjustCoins = { userId, newCoins ->
                    viewModel.adminAdjustCoins(userId, newCoins)
                },
                onToggleBlockUser = { userId, isBlocked ->
                    viewModel.adminToggleBlockUser(userId, isBlocked)
                }
            )
        }
    }
}
