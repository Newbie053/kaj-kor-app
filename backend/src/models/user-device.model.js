module.exports = (sequelize, DataTypes) => {
  const UserDevice = sequelize.define(
    "UserDevice",
    {
      fcmToken: { type: DataTypes.STRING, allowNull: false, unique: true },

      platform: { type: DataTypes.ENUM("android", "ios"), allowNull: false },

      lastSeenAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      indexes: [{ fields: ["userId"] }],
    }
  );

  UserDevice.associate = (models) => {
    UserDevice.belongsTo(models.User, { foreignKey: "userId" });
  };

  return UserDevice;
};
