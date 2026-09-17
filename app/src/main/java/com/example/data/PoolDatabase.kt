package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.data.dao.CoinRequestDao
import com.example.data.dao.FriendInvitationDao
import com.example.data.dao.MatchRecordDao
import com.example.data.dao.UserDao
import com.example.data.entity.CoinRequestEntity
import com.example.data.entity.FriendInvitationEntity
import com.example.data.entity.MatchRecordEntity
import com.example.data.entity.UserEntity

@Database(
    entities = [
        UserEntity::class,
        MatchRecordEntity::class,
        FriendInvitationEntity::class,
        CoinRequestEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class PoolDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun matchRecordDao(): MatchRecordDao
    abstract fun friendInvitationDao(): FriendInvitationDao
    abstract fun coinRequestDao(): CoinRequestDao

    companion object {
        @Volatile
        private var INSTANCE: PoolDatabase? = null

        fun getDatabase(context: Context): PoolDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    PoolDatabase::class.java,
                    "pool_database"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
