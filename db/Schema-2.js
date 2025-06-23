// models/Post.js
import { DataTypes } from "sequelize";
import { sequelize } from "../db/schema.js"; // sesuaikan path jika beda
import { User } from "../db/schema.js";

export const Post = sequelize.define("Post", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.TEXT,
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "posts",
});

// RELATION: Post belongs to User
Post.belongsTo(User, {
  foreignKey: "userId",
  as: "author",
});

// RELATION: User hasMany Posts
User.hasMany(Post, {
  foreignKey: "userId",
  as: "posts",
});


async function initDB2() {
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
    initDB2
}