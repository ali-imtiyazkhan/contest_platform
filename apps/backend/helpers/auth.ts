import jwt from "jsonwebtoken";

// Generate AccessToken
const generateAccessToken = (user: any) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    secret,
    {
      expiresIn: "2h",
    },
  );
};

// Generate Refresh Token
const generateRefreshToken = (user: any) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined in environment variables",
    );
  }
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    refreshSecret,
    {
      expiresIn: "30d",
    },
  );
};


// Refresh Access Token
const refreshAccessToken = (refreshToken: string) => {
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET as string,
  ) as {
    userId: string;
    email: string;
    role: string;
  };

  return generateAccessToken({
    id: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  });
};

// Export All the feature 
export {
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
};
