package com.example.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.PoolDatabase
import com.example.data.PoolRepository
import com.example.data.entity.CoinRequestEntity
import com.example.data.entity.FriendInvitationEntity
import com.example.data.entity.MatchRecordEntity
import com.example.data.entity.UserEntity
import com.example.game.*
import com.example.ui.matchmaking.MatchmakingPlayer
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.random.Random

enum class AppScreen {
    LOBBY,
    MATCH_ENTRY_CONFIRM,
    MATCHMAKING,
    GAME,
    PLAY_WITH_FRIEND,
    PROFILE,
    MATCH_HISTORY,
    ADD_COINS,
    LOW_COINS_ALERT,
    ADMIN_PANEL
}

class PoolGameViewModel(application: Application) : AndroidViewModel(application) {
    private val db = PoolDatabase.getDatabase(application)
    val repository = PoolRepository(db)
    val engine = GameEngine()

    private val _currentScreen = MutableStateFlow(AppScreen.LOBBY)
    val currentScreen: StateFlow<AppScreen> = _currentScreen.asStateFlow()

    val currentUser: StateFlow<UserEntity?> = repository.currentUserFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val allMatches: StateFlow<List<MatchRecordEntity>> = repository.allMatchesFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    val allCoinRequests: StateFlow<List<CoinRequestEntity>> = repository.allCoinRequestsFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    val allUsers: StateFlow<List<UserEntity>> = repository.allUsersFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    private val _receivedInvites = MutableStateFlow<List<FriendInvitationEntity>>(emptyList())
    val receivedInvites: StateFlow<List<FriendInvitationEntity>> = _receivedInvites.asStateFlow()

    // Matchmaking State
    private val _playersFound = MutableStateFlow(1)
    val playersFound: StateFlow<Int> = _playersFound.asStateFlow()

    private val _matchmakingPlayers = MutableStateFlow<List<MatchmakingPlayer>>(emptyList())
    val matchmakingPlayers: StateFlow<List<MatchmakingPlayer>> = _matchmakingPlayers.asStateFlow()

    private val _pendingEntryFee = MutableStateFlow(5000L)
    val pendingEntryFee: StateFlow<Long> = _pendingEntryFee.asStateFlow()

    // Coroutine Jobs for physics and bot
    private var physicsJob: Job? = null
    private var botJob: Job? = null
    private var timerJob: Job? = null
    private var matchmakingJob: Job? = null

    init {
        viewModelScope.launch {
            repository.ensureUserCreated()
        }

        // Listen for current user to collect invites
        viewModelScope.launch {
            currentUser.collect { user ->
                if (user != null) {
                    repository.getReceivedInvitationsFlow(user.playerId).collect { invites ->
                        _receivedInvites.value = invites.filter { it.status == "PENDING" }
                    }
                }
            }
        }

        // Start Physics and Turn Controller
        observeEngineState()
    }

    private fun observeEngineState() {
        viewModelScope.launch {
            engine.gameState.collect { state ->
                when (state) {
                    GameState.SHOT_IN_PROGRESS -> {
                        startPhysicsLoop()
                    }
                    GameState.PLAYER_TURN -> {
                        startTurnTimer()
                        val currPlayer = engine.players.value.getOrNull(engine.currentPlayerIndex.value)
                        if (currPlayer != null && !currPlayer.isHuman) {
                            scheduleBotShot()
                        }
                    }
                    GameState.GAME_OVER -> {
                        timerJob?.cancel()
                        recordMatchOutcome()
                    }
                    GameState.LOBBY, GameState.EXIT -> {
                        timerJob?.cancel()
                        physicsJob?.cancel()
                        botJob?.cancel()
                    }
                    else -> {}
                }
            }
        }
    }

    fun navigateTo(screen: AppScreen) {
        _currentScreen.value = screen
    }

    fun requestQuickMatch(entryFee: Long = 5000L) {
        val user = currentUser.value
        _pendingEntryFee.value = entryFee

        if (user == null || user.coins < entryFee) {
            _currentScreen.value = AppScreen.LOW_COINS_ALERT
        } else {
            _currentScreen.value = AppScreen.MATCH_ENTRY_CONFIRM
        }
    }

    fun confirmMatchEntry() {
        val fee = _pendingEntryFee.value
        viewModelScope.launch {
            val deducted = repository.deductEntryFee(fee)
            if (deducted) {
                startMatchmaking(fee)
            } else {
                _currentScreen.value = AppScreen.LOW_COINS_ALERT
            }
        }
    }

    fun cancelMatchEntry() {
        _currentScreen.value = AppScreen.LOBBY
    }

    private fun startMatchmaking(fee: Long) {
        _currentScreen.value = AppScreen.MATCHMAKING
        _playersFound.value = 1

        val human = currentUser.value
        val slots = mutableListOf(
            MatchmakingPlayer(
                slot = 1,
                name = human?.name ?: "You",
                playerId = human?.playerId ?: "PA000000",
                avatarId = human?.avatarId ?: 0,
                isReady = true
            )
        )
        _matchmakingPlayers.value = slots

        matchmakingJob?.cancel()
        matchmakingJob = viewModelScope.launch {
            val opponentPool = listOf(
                Pair("Alex", "PA" + Random.nextInt(100000, 999999)),
                Pair("Elena", "PA" + Random.nextInt(100000, 999999)),
                Pair("David", "PA" + Random.nextInt(100000, 999999))
            )

            for (i in 0..2) {
                delay(800)
                val opp = opponentPool[i]
                slots.add(
                    MatchmakingPlayer(
                        slot = i + 2,
                        name = opp.first,
                        playerId = opp.second,
                        avatarId = (i + 1) % 6,
                        isReady = true
                    )
                )
                _playersFound.value = slots.size
                _matchmakingPlayers.value = ArrayList(slots)
            }

            delay(600)
            // Start the 4-player game!
            startMatch(playerCount = 4, fee = fee)
        }
    }

    fun cancelMatchmaking() {
        matchmakingJob?.cancel()
        // Refund entry fee if cancelled during matchmaking
        viewModelScope.launch {
            repository.refundEntryFee(_pendingEntryFee.value)
        }
        _currentScreen.value = AppScreen.LOBBY
    }

    fun startMatch(playerCount: Int = 4, fee: Long = 5000L) {
        val human = currentUser.value ?: return
        engine.setupMatch(
            humanPlayerId = human.playerId,
            humanName = human.name,
            humanAvatarId = human.avatarId,
            playerCount = playerCount,
            fee = fee
        )
        _currentScreen.value = AppScreen.GAME
    }

    private fun startPhysicsLoop() {
        physicsJob?.cancel()
        physicsJob = viewModelScope.launch {
            while (isActive && engine.gameState.value == GameState.SHOT_IN_PROGRESS) {
                val stopped = engine.updatePhysicsTick()
                if (stopped) break
                delay(16) // ~60fps
            }
        }
    }

    private fun scheduleBotShot() {
        botJob?.cancel()
        botJob = viewModelScope.launch {
            delay(1300) // Bot aims
            val botShot = engine.computeBotShot()
            if (botShot != null) {
                engine.setAimAngle(botShot.first)
                engine.setCuePower(botShot.second)
                delay(400)
                engine.startShot()
            } else {
                // Fallback shot
                engine.setAimAngle(Random.nextFloat() * 6.28f)
                engine.setCuePower(0.5f)
                delay(200)
                engine.startShot()
            }
        }
    }

    private fun startTurnTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            for (sec in 30 downTo 0) {
                delay(1000)
                if (sec == 0 && engine.gameState.value == GameState.PLAYER_TURN) {
                    // Auto shoot on timeout
                    if (engine.cuePower.value <= 0.05f) {
                        engine.setCuePower(0.4f)
                    }
                    engine.startShot()
                    break
                }
            }
        }
    }

    private fun recordMatchOutcome() {
        val winner = engine.winner.value
        val isHumanWin = winner?.isHuman == true
        val fee = engine.entryFee.value
        val playerCount = engine.players.value.size
        val winReward = if (playerCount >= 4) fee * 3L + (fee * 6L / 10L) else fee * 2L - (fee / 10L)

        val opponentsSummary = engine.players.value
            .filter { !it.isHuman }
            .joinToString(", ") { "${it.name} (${it.playerId})" }

        viewModelScope.launch {
            repository.recordMatch(
                isWin = isHumanWin,
                entryFee = fee,
                coinsDelta = if (isHumanWin) winReward else -fee,
                opponents = opponentsSummary,
                mode = "$playerCount Player Pool"
            )
        }
    }

    fun onAimChange(angle: Float) {
        engine.setAimAngle(angle)
    }

    fun onPowerChange(power: Float) {
        engine.setCuePower(power)
    }

    fun onShoot() {
        engine.startShot()
    }

    fun onRepositionCueBall(pos: Vector2) {
        engine.repositionCueBall(pos)
    }

    fun onConfirmBallInHand() {
        engine.confirmBallInHand()
    }

    fun onDismissFoul() {
        engine.dismissFoul()
    }

    fun onRematch() {
        val fee = engine.entryFee.value
        val user = currentUser.value
        if (user != null && user.coins >= fee) {
            viewModelScope.launch {
                repository.deductEntryFee(fee)
                startMatch(playerCount = 4, fee = fee)
            }
        } else {
            _currentScreen.value = AppScreen.LOW_COINS_ALERT
        }
    }

    fun onLeaveGame() {
        engine.leaveGame()
        _currentScreen.value = AppScreen.LOBBY
    }

    // Friend Invitation System
    fun sendFriendInvite(targetPlayerId: String, fee: Long) {
        val user = currentUser.value ?: return
        viewModelScope.launch {
            repository.sendInvitation(
                fromPlayerId = user.playerId,
                fromPlayerName = user.name,
                toPlayerId = targetPlayerId,
                entryFee = fee
            )
        }
    }

    fun acceptFriendInvite(invite: FriendInvitationEntity) {
        viewModelScope.launch {
            val user = currentUser.value ?: return@launch
            if (user.coins >= invite.entryFee) {
                repository.respondToInvitation(invite.id, accept = true)
                repository.deductEntryFee(invite.entryFee)
                startMatch(playerCount = 2, fee = invite.entryFee)
            } else {
                _currentScreen.value = AppScreen.LOW_COINS_ALERT
            }
        }
    }

    fun rejectFriendInvite(inviteId: Long) {
        viewModelScope.launch {
            repository.respondToInvitation(inviteId, accept = false)
        }
    }

    fun createPrivateRoom(fee: Long) {
        val user = currentUser.value ?: return
        if (user.coins >= fee) {
            viewModelScope.launch {
                repository.deductEntryFee(fee)
                startMatch(playerCount = 4, fee = fee)
            }
        } else {
            _currentScreen.value = AppScreen.LOW_COINS_ALERT
        }
    }

    // Profile updates
    fun updateProfile(name: String, avatarId: Int) {
        viewModelScope.launch {
            repository.updateProfile(name, avatarId)
        }
    }

    // Coin requests
    fun requestCoins(amount: Long) {
        val user = currentUser.value ?: return
        viewModelScope.launch {
            repository.requestCoins(user.playerId, user.name, amount)
        }
    }

    // Admin Panel Actions
    fun adminApproveCoinRequest(id: Long, playerId: String, amount: Long) {
        viewModelScope.launch {
            repository.approveCoinRequest(id, playerId, amount)
        }
    }

    fun adminRejectCoinRequest(id: Long) {
        viewModelScope.launch {
            repository.rejectCoinRequest(id)
        }
    }

    fun adminAdjustCoins(userId: Long, newCoins: Long) {
        viewModelScope.launch {
            repository.adminAdjustCoins(userId, newCoins)
        }
    }

    fun adminToggleBlockUser(userId: Long, isBlocked: Boolean) {
        viewModelScope.launch {
            repository.toggleUserBlock(userId, isBlocked)
        }
    }
}
