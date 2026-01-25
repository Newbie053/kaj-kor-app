module.exports = (sequelize, DataTypes) => {
  const UserNotificationSetting = sequelize.define(
    "UserNotificationSetting",
    {
      // Make it 1:1 (one row per user) by using userId as primary key
      userId: { type: DataTypes.INTEGER, primaryKey: true },

      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

      preferredTime: { type: DataTypes.TIME, allowNull: true },
      quietStart: { type: DataTypes.TIME, allowNull: true },
      quietEnd: { type: DataTypes.TIME, allowNull: true },

      timezone: { type: DataTypes.STRING, allowNull: true }, // "Asia/Dhaka"
    },
    { timestamps: true }
  );

  UserNotificationSetting.associate = (models) => {
    UserNotificationSetting.belongsTo(models.User, { foreignKey: "userId" });
  };

  return UserNotificationSetting;
};
