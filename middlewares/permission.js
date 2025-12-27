const checkPermission = (requiredPermissionSlug) => {
  return (req, res, next) => {
    // Admin Override (Optional, but good practice if Admin role has implicit all-access)
    // In our seed we gave Admin all permissions explicitly, so check should work normally.
    // But let's verify req.user exists first.

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userPermissions = req.user.permissions || [];

    // Check strict match
    if (userPermissions.includes(requiredPermissionSlug)) {
      return next();
    }

    return res
      .status(403)
      .json({
        message: `Forbidden: requires permission '${requiredPermissionSlug}'`,
      });
  };
};

module.exports = checkPermission;
