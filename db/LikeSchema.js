// models/Like.js
import { DataTypes } from "sequelize";
import { sequelize } from "../db/schema.js";
import { User } from "../db/schema.js";
import { Post } from "./Schema-2.js";

export const Like = sequelize.define("Like", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "likes",
  updatedAt: false,
});
 // tambahkan ini
 // tambahkan ini
 // tambahkan ini

// Relasi user ↔ post ↔ like
User.belongsToMany(Post, {
  through: Like,
  foreignKey: "userId",
  as: "likedPosts",
});

Post.belongsToMany(User, {
  through: Like,
  foreignKey: "postId",
  as: "likedBy",
});

async function initDB3() {
  try {
    await sequelize.authenticate();
    console.log('✅ Koneksi ke MySQL berhasil');
    await sequelize.sync({ alter: true }); // bikin tabel otomatis
    console.log('✅ Sinkronisasi selesai');
  } catch (err) {
    console.error('❌ Error koneksi DB:', err);
  }
}
export {
    initDB3
}