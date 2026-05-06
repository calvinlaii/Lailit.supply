import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";

// Mock the Server Action — LoginForm calls signInWithMagicLink via useActionState.
// In the test environment there is no Next.js request scope, so we mock the module.
vi.mock("@/app/(marketing)/login/actions", () => ({
  signInWithMagicLink: vi.fn().mockResolvedValue({ status: "idle" }),
}));

// Mock useActionState so validation logic runs synchronously in tests.
// The real useActionState wires through React internals that don't work in jsdom.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (
      action: (prevState: unknown, formData: FormData) => unknown,
      initialState: unknown
    ) => {
      // Return [state, dispatchFn, isPending]
      // state is always initialState in tests; dispatch calls action directly
      return [initialState, action, false] as const;
    },
  };
});

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

  it("shows no error when submitted with valid email (dispatches action)", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /kirim magic link/i }));
    // No validation error — client-side validation passes, action is dispatched
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

  it("renders link-expired alert when errorParam is link-expired", () => {
    render(<LoginForm errorParam="link-expired" />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Link kamu sudah kedaluwarsa.")).toBeDefined();
  });

  it("does not render link-expired alert when errorParam is absent", () => {
    render(<LoginForm />);
    // Only validation errors would render alerts — none triggered at rest
    expect(screen.queryByText("Link kamu sudah kedaluwarsa.")).toBeNull();
  });
});
