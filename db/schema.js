import { Sequelize, DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";


// Inisialisasi koneksi Sequelize
export const sequelize = new Sequelize("lyx_db", "root", "", {
  host: "localhost",
  dialect: "mysql", // atau 'mysql'
});

// === User Model ===
export const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  bio: {
    type: DataTypes.TEXT,
  },
  avatarUrl: {
    type: DataTypes.TEXT,
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
  tableName: "users",
});

// === Session Model ===
export const Session = sequelize.define("Session", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userAgent: {
    type: DataTypes.TEXT,
  },
  ipAddress: {
    type: DataTypes.STRING,
  },
  expiresAt: {
    type: DataTypes.DATE,
  },
  revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "sessions",
  updatedAt: false,
});

// === Profile Model ===
export const Profile = sequelize.define("Profile", {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  gender: {
    type: DataTypes.ENUM("male", "female", "other"),
  },
  birthday: {
    type: DataTypes.DATEONLY,
  },
  location: {
    type: DataTypes.STRING(100),
  },
  website: {
    type: DataTypes.TEXT,
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "profiles",
  createdAt: false,
});

// === RELATIONS ===
User.hasMany(Session, {
  foreignKey: "userId",
  as: "sessions",
  onDelete: "CASCADE",
});

Session.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasOne(Profile, {
  foreignKey: "userId",
  as: "profile",
  onDelete: "CASCADE",
});

Profile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});
async function initDB() {
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
  
  initDB
}