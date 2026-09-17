package com.example.data

import com.example.data.entity.CoinRequestEntity
import com.example.data.entity.FriendInvitationEntity
import com.example.data.entity.MatchRecordEntity
import com.example.data.entity.UserEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import kotlin.random.Random

class PoolRepository(private val db: PoolDatabase) {
    private val userDao = db.userDao()
    private val matchRecordDao = db.matchRecordDao()
    private val friendInvitationDao = db.friendInvitationDao()
    private val coinRequestDao = db.coinRequestDao()

    val currentUserFlow: Flow<UserEntity?> = userDao.getUserFlow(1L)
    val allMatchesFlow: Flow<List<MatchRecordEntity>> = matchRecordDao.getAllMatchesFlow()
    val allCoinRequestsFlow: Flow<List<CoinRequestEntity>> = coinRequestDao.getAllCoinRequestsFlow()
    val allUsersFlow: Flow<List<UserEntity>> = userDao.getAllUsersFlow()

    suspend fun ensureUserCreated(): UserEntity = withContext(Dispatchers.IO) {
        val existing = userDao.getUser(1L)
        if (existing != null) {
            existing
        } else {
            val randomNum = Random.nextInt(100000, 999999)
            val initialPlayer = UserEntity(
                id = 1L,
                playerId = "PA$randomNum",
                name = "ProPlayer_$randomNum".take(12),
                avatarId = 0,
                coins = 100_000L,
                matchesPlayed = 0,
                wins = 0,
                losses = 0,
                createdAt = System.currentTimeMillis()
            )
            userDao.insertUser(initialPlayer)
            initialPlayer
        }
    }

    suspend fun updateProfile(name: String, avatarId: Int) = withContext(Dispatchers.IO) {
        userDao.updateProfile(1L, name, avatarId)
    }

    suspend fun deductEntryFee(fee: Long): Boolean = withContext(Dispatchers.IO) {
        val user = userDao.getUser(1L) ?: return@withContext false
        if (user.coins >= fee) {
            userDao.updateCoins(1L, user.coins - fee)
            true
        } else {
            false
        }
    }

    suspend fun refundEntryFee(fee: Long) = withContext(Dispatchers.IO) {
        val user = userDao.getUser(1L) ?: return@withContext
        userDao.updateCoins(1L, user.coins + fee)
    }

    suspend fun addCoins(amount: Long) = withContext(Dispatchers.IO) {
        val user = userDao.getUser(1L) ?: return@withContext
        userDao.updateCoins(1L, user.coins + amount)
    }

    suspend fun recordMatch(
        isWin: Boolean,
        entryFee: Long,
        coinsDelta: Long,
        opponents: String,
        mode: String = "4-Player Pool"
    ) = withContext(Dispatchers.IO) {
        val matchRandom = Random.nextInt(10000, 99999)
        val matchRecord = MatchRecordEntity(
            matchId = "MATCH#PA$matchRandom",
            timestamp = System.currentTimeMillis(),
            mode = mode,
            entryFee = entryFee,
            result = if (isWin) "WIN" else "LOSS",
            coinsDelta = coinsDelta,
            opponents = opponents
        )
        matchRecordDao.insertMatch(matchRecord)
        userDao.recordMatchResult(
            id = 1L,
            winDelta = if (isWin) 1 else 0,
            lossDelta = if (isWin) 0 else 1,
            coinsDelta = coinsDelta
        )
    }

    fun getReceivedInvitationsFlow(playerId: String): Flow<List<FriendInvitationEntity>> {
        return friendInvitationDao.getReceivedInvitationsFlow(playerId)
    }

    suspend fun sendInvitation(
        fromPlayerId: String,
        fromPlayerName: String,
        toPlayerId: String,
        entryFee: Long
    ): Long = withContext(Dispatchers.IO) {
        val invite = FriendInvitationEntity(
            fromPlayerId = fromPlayerId,
            fromPlayerName = fromPlayerName,
            toPlayerId = toPlayerId.uppercase().trim(),
            entryFee = entryFee,
            status = "PENDING",
            timestamp = System.currentTimeMillis()
        )
        friendInvitationDao.insertInvitation(invite)
    }

    suspend fun respondToInvitation(inviteId: Long, accept: Boolean) = withContext(Dispatchers.IO) {
        friendInvitationDao.updateStatus(inviteId, if (accept) "ACCEPTED" else "REJECTED")
    }

    suspend fun requestCoins(playerId: String, playerName: String, amount: Long) = withContext(Dispatchers.IO) {
        val request = CoinRequestEntity(
            playerId = playerId,
            playerName = playerName,
            amount = amount,
            status = "PENDING",
            timestamp = System.currentTimeMillis()
        )
        coinRequestDao.insertRequest(request)
    }

    fun getCoinRequestsForPlayer(playerId: String): Flow<List<CoinRequestEntity>> {
        return coinRequestDao.getCoinRequestsForPlayer(playerId)
    }

    // Admin methods
    suspend fun approveCoinRequest(id: Long, playerId: String, amount: Long) = withContext(Dispatchers.IO) {
        coinRequestDao.updateStatus(id, "APPROVED")
        val user = userDao.getUserByPlayerId(playerId)
        if (user != null) {
            userDao.updateCoins(user.id, user.coins + amount)
        } else {
            // If current active user
            val current = userDao.getUser(1L)
            if (current != null && current.playerId == playerId) {
                userDao.updateCoins(1L, current.coins + amount)
            }
        }
    }

    suspend fun rejectCoinRequest(id: Long) = withContext(Dispatchers.IO) {
        coinRequestDao.updateStatus(id, "REJECTED")
    }

    suspend fun adminAdjustCoins(userId: Long, newCoins: Long) = withContext(Dispatchers.IO) {
        userDao.updateCoins(userId, newCoins)
    }

    suspend fun toggleUserBlock(userId: Long, isBlocked: Boolean) = withContext(Dispatchers.IO) {
        val user = userDao.getUser(userId) ?: return@withContext
        userDao.updateUser(user.copy(isBlocked = isBlocked))
    }
}
