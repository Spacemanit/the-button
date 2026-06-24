const getTier = (waitSeconds) => {
  if (waitSeconds >= 50) return "purple";
  if (waitSeconds >= 40) return "blue";
  if (waitSeconds >= 30) return "green";
  if (waitSeconds >= 20) return "yellow";
  if (waitSeconds >= 10) return "orange";
  return "red";
};

export default getTier;