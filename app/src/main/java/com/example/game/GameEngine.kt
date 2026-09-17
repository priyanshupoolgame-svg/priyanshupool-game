package com.example.game

import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

enum class GameState {
    LOBBY,
    MATCHMAKING,
    WAITING_FOR_PLAYERS,
    MATCH_ENTRY,
    GAME_START,
    PLAYER_TURN,
    SHOT_IN_PROGRESS,
    FOUL,
    GAME_OVER,
    REMATCH,
    EXIT
}

data class GamePlayer(
    val index: Int,
    val playerId: String,
    val name: String,
    val avatarId: Int,
    val isHuman: Boolean,
    var score: Int = 0,
    var isEliminated: Boolean = false,
    val themeColor: Color
)

data class ShotResult(
    val cueBallPotted: Boolean = false,
    val ballsPotted: List<Int> = emptyList(),
    val firstBallHit: Int? = null,
    val isFoul: Boolean = false,
    val foulReason: String? = null
)

class GameEngine {
    private val _gameState = MutableStateFlow(GameState.LOBBY)
    val gameState: StateFlow<GameState> = _gameState.asStateFlow()

    private val _players = MutableStateFlow<List<GamePlayer>>(emptyList())
    val players: StateFlow<List<GamePlayer>> = _players.asStateFlow()

    private val _currentPlayerIndex = MutableStateFlow(0)
    val currentPlayerIndex: StateFlow<Int> = _currentPlayerIndex.asStateFlow()

    private val _balls = MutableStateFlow<List<Ball>>(emptyList())
    val balls: StateFlow<List<Ball>> = _balls.asStateFlow()

    private val _aimAngle = MutableStateFlow(0f)
    val aimAngle: StateFlow<Float> = _aimAngle.asStateFlow()

    private val _cuePower = MutableStateFlow(0f) // 0.0f to 1.0f
    val cuePower: StateFlow<Float> = _cuePower.asStateFlow()

    private val _aimGuide = MutableStateFlow<AimGuideData?>(null)
    val aimGuide: StateFlow<AimGuideData?> = _aimGuide.asStateFlow()

    private val _isBallInHand = MutableStateFlow(false)
    val isBallInHand: StateFlow<Boolean> = _isBallInHand.asStateFlow()

    private val _foulMessage = MutableStateFlow<String?>(null)
    val foulMessage: StateFlow<String?> = _foulMessage.asStateFlow()

    private val _winner = MutableStateFlow<GamePlayer?>(null)
    val winner: StateFlow<GamePlayer?> = _winner.asStateFlow()

    private val _entryFee = MutableStateFlow(5000L)
    val entryFee: StateFlow<Long> = _entryFee.asStateFlow()

    private val _turnTimeRemaining = MutableStateFlow(30)
    val turnTimeRemaining: StateFlow<Int> = _turnTimeRemaining.asStateFlow()

    // Tracking for current shot
    private var shotFirstHitBallId: Int? = null
    private val shotPottedBallIds = mutableListOf<Int>()

    fun setupMatch(
        humanPlayerId: String,
        humanName: String,
        humanAvatarId: Int,
        playerCount: Int = 4,
        fee: Long = 5000L
    ) {
        _entryFee.value = fee
        val playerList = mutableListOf<GamePlayer>()

        val playerColors = listOf(
            Color(0xFF38BDF8), // Blue (You)
            Color(0xFFF59E0B), // Amber (Player 2)
            Color(0xFF10B981), // Emerald (Player 3)
            Color(0xFFA855F7)  // Purple (Player 4)
        )

        // Player 1 (Human)
        playerList.add(
            GamePlayer(
                index = 0,
                playerId = humanPlayerId,
                name = humanName,
                avatarId = humanAvatarId,
                isHuman = true,
                themeColor = playerColors[0]
            )
        )

        val opponentNames = listOf("Alex", "Elena", "David", "Marcus", "Sophia", "Lucas")
        val availableNames = opponentNames.shuffled()

        for (i in 1 until playerCount) {
            val randomId = "PA" + Random.nextInt(100000, 999999)
            val name = availableNames.getOrElse(i - 1) { "Opponent_$i" }
            playerList.add(
                GamePlayer(
                    index = i,
                    playerId = randomId,
                    name = name,
                    avatarId = i % 6,
                    isHuman = false,
                    themeColor = playerColors[i % playerColors.size]
                )
            )
        }

        _players.value = playerList
        _currentPlayerIndex.value = 0
        _balls.value = PoolPhysics.createStandardBalls()
        _isBallInHand.value = false
        _foulMessage.value = null
        _winner.value = null
        _cuePower.value = 0f
        _aimAngle.value = 0f
        _turnTimeRemaining.value = 30
        _gameState.value = GameState.GAME_START

        updateAimGuide()
    }

    fun setAimAngle(angle: Float) {
        _aimAngle.value = angle
        updateAimGuide()
    }

    fun setCuePower(power: Float) {
        _cuePower.value = power.coerceIn(0f, 1f)
    }

    fun repositionCueBall(pos: Vector2) {
        val cue = getCueBall() ?: return
        val clampedX = pos.x.coerceIn(PoolPhysics.MIN_X + cue.radius, PoolPhysics.MAX_X - cue.radius)
        val clampedY = pos.y.coerceIn(PoolPhysics.MIN_Y + cue.radius, PoolPhysics.MAX_Y - cue.radius)
        cue.position = Vector2(clampedX, clampedY)
        cue.isPotted = false
        cue.isSinking = false
        cue.stop()
        updateAimGuide()
    }

    fun confirmBallInHand() {
        _isBallInHand.value = false
        updateAimGuide()
    }

    private fun getCueBall(): Ball? {
        return _balls.value.firstOrNull { it.isCue }
    }

    fun updateAimGuide() {
        val cue = getCueBall()
        if (cue != null && !cue.isPotted && !cue.isSinking) {
            _aimGuide.value = PoolPhysics.calculateAimGuide(cue, _aimAngle.value, _balls.value)
        } else {
            _aimGuide.value = null
        }
    }

    fun startShot(): Boolean {
        val cue = getCueBall() ?: return false
        if (cue.isPotted || cue.isSinking || _cuePower.value <= 0.01f) return false

        shotFirstHitBallId = null
        shotPottedBallIds.clear()

        val maxSpeed = 34f
        val shotSpeed = _cuePower.value * maxSpeed
        val impulse = Vector2(cos(_aimAngle.value) * shotSpeed, sin(_aimAngle.value) * shotSpeed)
        cue.velocity = impulse

        _cuePower.value = 0f
        _isBallInHand.value = false
        _gameState.value = GameState.SHOT_IN_PROGRESS
        return true
    }

    fun onBallHitEvent(b1: Ball, b2: Ball) {
        if (shotFirstHitBallId == null) {
            if (b1.isCue) shotFirstHitBallId = b2.id
            else if (b2.isCue) shotFirstHitBallId = b1.id
        }
    }

    fun onBallPottedEvent(ball: Ball) {
        shotPottedBallIds.add(ball.id)
        if (!ball.isCue && !ball.isEightBall) {
            val currPlayer = _players.value.getOrNull(_currentPlayerIndex.value)
            currPlayer?.let { it.score += 1 }
        }
    }

    fun updatePhysicsTick(
        onHit: ((Ball, Ball) -> Unit)? = null,
        onPotted: ((Ball) -> Unit)? = null
    ): Boolean {
        if (_gameState.value != GameState.SHOT_IN_PROGRESS) return false

        PoolPhysics.stepSimulation(
            balls = _balls.value,
            subSteps = 4,
            onBallHit = { b1, b2 ->
                onBallHitEvent(b1, b2)
                onHit?.invoke(b1, b2)
            },
            onBallPotted = { b ->
                onBallPottedEvent(b)
                onPotted?.invoke(b)
            }
        )

        // Check if all balls stopped moving
        val anyMoving = _balls.value.any { it.isMoving() || it.isSinking }
        if (!anyMoving) {
            resolveShotOutcome()
            return true
        }
        return false
    }

    private fun resolveShotOutcome() {
        val cuePotted = shotPottedBallIds.contains(0)
        val eightPotted = shotPottedBallIds.contains(8)
        val regularBallsPotted = shotPottedBallIds.filter { it in 1..7 || it in 9..15 }
        val currPlayer = _players.value[_currentPlayerIndex.value]

        // Check 8-ball resolution
        if (eightPotted) {
            val remainingBalls = _balls.value.filter { !it.isPotted && it.id != 0 && it.id != 8 }
            if (cuePotted || remainingBalls.isNotEmpty()) {
                // Premature 8-ball potted or scratch on 8-ball -> Immediate Loss for current player
                // Other player with highest score or next in line wins!
                val winnerPlayer = _players.value.filter { it.index != currPlayer.index }
                    .maxByOrNull { it.score } ?: _players.value[(currPlayer.index + 1) % _players.value.size]
                _winner.value = winnerPlayer
                _gameState.value = GameState.GAME_OVER
                return
            } else {
                // Legitimate 8-ball win!
                _winner.value = currPlayer
                _gameState.value = GameState.GAME_OVER
                return
            }
        }

        // Check fouls
        var isFoul = false
        var reason: String? = null

        if (cuePotted) {
            isFoul = true
            reason = "Scratch! Cue ball pocketed."
            // Respawn cue ball for next player
            val cue = getCueBall()
            if (cue != null) {
                cue.position = Vector2(280f, 250f)
                cue.isPotted = false
                cue.isSinking = false
                cue.stop()
            }
            _isBallInHand.value = true
        } else if (shotFirstHitBallId == null) {
            isFoul = true
            reason = "Foul! Cue ball did not hit any object ball."
            _isBallInHand.value = true
        }

        if (isFoul) {
            _foulMessage.value = reason
            _gameState.value = GameState.FOUL
            advanceTurn()
        } else if (regularBallsPotted.isNotEmpty()) {
            // Legal ball potted! Player shoots again
            _foulMessage.value = null
            _gameState.value = GameState.PLAYER_TURN
            _turnTimeRemaining.value = 30
            updateAimGuide()
        } else {
            // No ball potted, clean end of turn
            _foulMessage.value = null
            advanceTurn()
        }

        // Check if all regular balls potted
        val allRegularPotted = _balls.value.none { !it.isPotted && (it.isSolid || it.isStripe) }
        if (allRegularPotted && !eightPotted) {
            // Target 8-ball now
        }
    }

    private fun advanceTurn() {
        val nextIndex = (_currentPlayerIndex.value + 1) % _players.value.size
        _currentPlayerIndex.value = nextIndex
        _gameState.value = GameState.PLAYER_TURN
        _turnTimeRemaining.value = 30
        updateAimGuide()
    }

    // AI Bot auto-aim and shoot calculation
    fun computeBotShot(): Pair<Float, Float>? {
        val cue = getCueBall() ?: return null
        if (cue.isPotted || cue.isSinking) return null

        val candidateBalls = _balls.value.filter { !it.isCue && !it.isPotted && !it.isSinking }
        if (candidateBalls.isEmpty()) return null

        // Prefer regular balls before 8-ball
        val targetBalls = candidateBalls.filter { !it.isEightBall }.ifEmpty { candidateBalls }

        // Find ball closest to any pocket
        var bestBall = targetBalls.first()
        var bestPocket = PoolPhysics.POCKETS.first()
        var bestScore = 99999f

        for (ball in targetBalls) {
            for (pocket in PoolPhysics.POCKETS) {
                val ballToPocketDist = ball.position.distanceTo(pocket)
                val cueToBallDist = cue.position.distanceTo(ball.position)
                val score = ballToPocketDist + cueToBallDist * 0.4f
                if (score < bestScore) {
                    bestScore = score
                    bestBall = ball
                    bestPocket = pocket
                }
            }
        }

        // Ghost ball position for target pocket
        val pocketDir = (bestPocket - bestBall.position).normalized()
        val ghostCuePos = bestBall.position - pocketDir * (PoolPhysics.BALL_RADIUS * 2f)
        val aimDir = (ghostCuePos - cue.position).normalized()
        val aimAngle = atan2(aimDir.y, aimDir.x)

        // Slight natural variance
        val randomizedAngle = aimAngle + (Random.nextFloat() - 0.5f) * 0.05f
        val power = (0.45f + Random.nextFloat() * 0.35f).coerceIn(0.3f, 0.85f)

        return Pair(randomizedAngle, power)
    }

    fun dismissFoul() {
        _foulMessage.value = null
        if (_gameState.value == GameState.FOUL) {
            _gameState.value = GameState.PLAYER_TURN
        }
    }

    fun leaveGame() {
        _gameState.value = GameState.LOBBY
    }
}
