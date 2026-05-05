import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";

describe("LoginForm", () => {
  it("renders heading, input, and CTA", () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { name: /masuk ke lailit\.supply/i })).toBeDefined();
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /kirim magic link/i })).toBeDefined();
  });

  it("shows empty-email error when submitted with blank field", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /kirim magic link/i }));
    expect(screen.getByRole("alert").textContent).toBe(
      "Masukkan email kamu dulu."
    );
  });

  it("shows invalid-format error when submitted with bad email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "notanemail");
    await user.click(screen.getByRole("button", { name: /kirim magic link/i }));
    expect(screen.getByRole("alert").textContent).toBe(
      "Format email belum benar. Coba cek lagi."
    );
  });

  it("shows no error when submitted with valid email (no-op)", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /kirim magic link/i }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears error when user types after an error", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    // Trigger error
    await user.click(screen.getByRole("button", { name: /kirim magic link/i }));
    expect(screen.getByRole("alert")).toBeDefined();
    // Start typing → error clears
    await user.type(screen.getByLabelText(/email/i), "a");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("error message is linked to input via aria-describedby", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /kirim magic link/i }));
    const input = screen.getByLabelText(/email/i);
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(screen.getByRole("alert").id).toBe(errorId);
  });
});
