const { createError } = require("../../src/utils/errors");

jest.mock("../../src/config/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("../../src/utils/passwords", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

jest.mock("../../src/utils/jwt", () => ({
  signAccessToken: jest.fn(() => "access-token"),
  signRefreshToken: jest.fn(() => ({ token: "refresh-token", sessionId: "sid" })),
  verifyRefreshToken: jest.fn(),
  ACCESS_TOKEN_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_SECONDS: 604800,
}));

jest.mock("../../src/modules/auth/token.service", () => ({
  persistRefreshSession: jest.fn(),
  deleteRefreshSession: jest.fn(),
  getRefreshSessionUser: jest.fn(),
  blacklistToken: jest.fn(),
}));

const { prisma } = require("../../src/config/db");
const { hashPassword, verifyPassword } = require("../../src/utils/passwords");
const {
  registerUser,
  loginUser,
} = require("../../src/modules/auth/auth.service");

describe("auth.service unit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registerUser throws when email is taken", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: "test@example.com" });

    await expect(registerUser("test@example.com", "Password123!", "User"))
      .rejects
      .toMatchObject({
        message: "Email already registered",
        code: "EMAIL_TAKEN",
        statusCode: 409,
      });
  });

  it("registerUser hashes password and creates user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    hashPassword.mockResolvedValue("hashed");
    prisma.user.create.mockResolvedValue({
      id: 1,
      email: "test@example.com",
      name: "User",
      role: "USER",
      status: "ACTIVE",
      provider: "LOCAL",
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await registerUser("test@example.com", "Password123!", "User");

    expect(hashPassword).toHaveBeenCalledWith("Password123!");
    expect(prisma.user.create).toHaveBeenCalled();
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
  });

  it("loginUser rejects invalid password", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@example.com",
      name: "User",
      passwordHash: "hashed",
      role: "USER",
      status: "ACTIVE",
      provider: "LOCAL",
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    verifyPassword.mockResolvedValue(false);

    await expect(loginUser("test@example.com", "Wrong"))
      .rejects
      .toMatchObject({
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
        statusCode: 401,
      });
  });
});
