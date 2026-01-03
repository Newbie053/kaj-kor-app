module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    title: { type: DataTypes.STRING, allowNull: false },
    isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    // Change this:
    // deadline: { type: DataTypes.DATE, allowNull: true },
    // backend/src/models/task.model.js
deadline: { type: DataTypes.TIME, allowNull: true },// <-- store only time
  });

  Task.associate = (models) => {
    Task.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Task;
};
