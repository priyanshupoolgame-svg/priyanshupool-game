package com.example.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.entity.CoinRequestEntity
import com.example.data.entity.FriendInvitationEntity
import com.example.data.entity.MatchRecordEntity
import com.example.data.entity.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    fun getUserFlow(id: Long = 1L): Flow<UserEntity?>

    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    suspend fun getUser(id: Long = 1L): UserEntity?

    @Query("SELECT * FROM users WHERE playerId = :playerId LIMIT 1")
    suspend fun getUserByPlayerId(playerId: String): UserEntity?

    @Query("SELECT * FROM users ORDER BY createdAt DESC")
    fun getAllUsersFlow(): Flow<List<UserEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Update
    suspend fun updateUser(user: UserEntity)

    @Query("UPDATE users SET coins = :newCoins WHERE id = :id")
    suspend fun updateCoins(id: Long = 1L, newCoins: Long)

    @Query("UPDATE users SET name = :name, avatarId = :avatarId WHERE id = :id")
    suspend fun updateProfile(id: Long = 1L, name: String, avatarId: Int)

    @Query("UPDATE users SET matchesPlayed = matchesPlayed + 1, wins = wins + :winDelta, losses = losses + :lossDelta, coins = coins + :coinsDelta WHERE id = :id")
    suspend fun recordMatchResult(id: Long = 1L, winDelta: Int, lossDelta: Int, coinsDelta: Long)
}

@Dao
interface MatchRecordDao {
    @Query("SELECT * FROM match_records ORDER BY timestamp DESC")
    fun getAllMatchesFlow(): Flow<List<MatchRecordEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMatch(match: MatchRecordEntity)
}

@Dao
interface FriendInvitationDao {
    @Query("SELECT * FROM friend_invitations WHERE toPlayerId = :playerId ORDER BY timestamp DESC")
    fun getReceivedInvitationsFlow(playerId: String): Flow<List<FriendInvitationEntity>>

    @Query("SELECT * FROM friend_invitations WHERE fromPlayerId = :playerId ORDER BY timestamp DESC")
    fun getSentInvitationsFlow(playerId: String): Flow<List<FriendInvitationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInvitation(invitation: FriendInvitationEntity): Long

    @Query("UPDATE friend_invitations SET status = :status WHERE id = :id")
    suspend fun updateStatus(id: Long, status: String)
}

@Dao
interface CoinRequestDao {
    @Query("SELECT * FROM coin_requests ORDER BY timestamp DESC")
    fun getAllCoinRequestsFlow(): Flow<List<CoinRequestEntity>>

    @Query("SELECT * FROM coin_requests WHERE playerId = :playerId ORDER BY timestamp DESC")
    fun getCoinRequestsForPlayer(playerId: String): Flow<List<CoinRequestEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRequest(request: CoinRequestEntity)

    @Query("UPDATE coin_requests SET status = :status WHERE id = :id")
    suspend fun updateStatus(id: Long, status: String)
}
