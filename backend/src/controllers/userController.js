export const getMe = (req, res) => {
  const { userName, displayName } = req.user || {};
  res.json({ user: { userName, displayName } });
};
