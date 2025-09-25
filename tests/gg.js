describe("login user", () => {
  test("should login sender and return token with AuthResponse", async () => {
    // Arrange: create a sender user in DB
    const hashedPassword = await bcrypt.hash(senderData.password, 10);
    await Sender.create({ ...senderData, password: hashedPassword });

    // Act: attempt login
    const result = await authService.login({
      email: senderData.email,
      password: senderData.password,
    });

    // Assert
    expect(result).toHaveProperty("token");
    expect(typeof result.token).toBe("string");

    expect(result.user).toBeInstanceOf(AuthResponse);
    expect(result.user.status).toBe(true);
    expect(result.user.message).toBe("Login successful");
  });

  test("should login vendor and return token with AuthResponse", async () => {
    const hashedPassword = await bcrypt.hash(vendorData.password, 10);
    await Vendor.create({ ...vendorData, password: hashedPassword });

    const result = await authService.login({
      email: vendorData.email,
      password: vendorData.password,
    });

    expect(result).toHaveProperty("token");
    expect(typeof result.token).toBe("string");

    expect(result.user).toBeInstanceOf(AuthResponse);
    expect(result.user.status).toBe(true);
    expect(result.user.message).toBe("Login successful");
  });

  test("should throw error for invalid email", async () => {
    await expect(
      authService.login({ email: "notfound@example.com", password: "pass123" })
    ).rejects.toThrow("Invalid email");
  });

  test("should throw error for invalid password", async () => {
    const hashedPassword = await bcrypt.hash("correctpass", 10);
    await Sender.create({ ...senderData, password: hashedPassword });

    await expect(
      authService.login({ email: senderData.email, password: "wrongpass" })
    ).rejects.toThrow("Invalid password");
  });

  test("should throw error for invalid input data", async () => {
    const invalidData = { email: "", password: "" }; // ❌ invalid shape

    await expect(authService.login(invalidData)).rejects.toThrow();
  });
});
