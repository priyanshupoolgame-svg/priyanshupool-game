package com.example.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: Long = 1L,
    val playerId: String,
    val name: String,
    val avatarId: Int = 0,
    val coins: Long = 100_000L,
    val matchesPlayed: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val isBlocked: Boolean = false
)

@Entity(tableName = "match_records")
data class MatchRecordEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val matchId: String,
    val timestamp: Long = System.currentTimeMillis(),
    val mode: String = "4-Player Pool",
    val entryFee: Long,
    val result: String, // "WIN" or "LOSS"
    val coinsDelta: Long,
    val opponents: String
)

@Entity(tableName = "friend_invitations")
data class FriendInvitationEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val fromPlayerId: String,
    val fromPlayerName: String,
    val toPlayerId: String,
    val entryFee: Long = 5_000L,
    val status: String = "PENDING", // "PENDING", "ACCEPTED", "REJECTED"
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "coin_requests")
data class CoinRequestEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val playerId: String,
    val playerName: String,
    val amount: Long,
    val status: String = "PENDING", // "PENDING", "APPROVED", "REJECTED"
    val timestamp: Long = System.currentTimeMillis()
)
