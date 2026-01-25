module.exports = (sequelize, DataTypes) => {
  const Checkin = sequelize.define(
    "Checkin",
    {
      date: { type: DataTypes.DATEONLY, allowNull: false },

      doneValue: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      indexes: [
        { unique: true, fields: ["targetId", "date"] }, // 1 checkin per target per day
        { fields: ["userId", "date"] },
      ],
    }
  );

  Checkin.associate = (models) => {
    Checkin.belongsTo(models.User, { foreignKey: "userId" });
    Checkin.belongsTo(models.Target, { foreignKey: "targetId" });
  };

  return Checkin;
};
