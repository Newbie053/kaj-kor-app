// backend/src/models/user.model.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
  });

  User.associate = (models) => {
    // Personal daily tasks (manual)
    User.hasMany(models.DailyTask, { foreignKey: 'userId' });

    // Long-term goals
    User.hasMany(models.Target, { foreignKey: 'userId' });

    // Progress logs
    User.hasMany(models.Checkin, { foreignKey: 'userId' });

    // Notifications
    User.hasMany(models.Notification, { foreignKey: 'userId' });

    // Devices for push notifications
    User.hasMany(models.UserDevice, { foreignKey: 'userId' });

    // 1:1 settings
    User.hasOne(models.UserNotificationSetting, { foreignKey: 'userId' });
  };

  return User;
};
