import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

describe("WelcomeEmail", () => {
  it("renders user name in greeting when name is provided", () => {
    render(
      WelcomeEmail({
        name: "Budi",
        magicLink: "https://example.com/magic",
        plan: "Bulanan",
      })
    );
    expect(screen.getByText(/Hei Budi/)).toBeDefined();
  });

  it("renders generic greeting when name is empty string", () => {
    render(
      WelcomeEmail({
        name: "",
        magicLink: "https://example.com/magic",
        plan: "Bulanan",
      })
    );
    expect(screen.getByText(/Hei!/)).toBeDefined();
  });

  it("renders Bulanan in body text when plan is Bulanan", () => {
    render(
      WelcomeEmail({
        name: "Budi",
        magicLink: "https://example.com/magic",
        plan: "Bulanan",
      })
    );
    expect(screen.getByText(/Bulanan/)).toBeDefined();
  });

  it("renders Seumur Hidup in body text when plan is Seumur Hidup", () => {
    render(
      WelcomeEmail({
        name: "Budi",
        magicLink: "https://example.com/magic",
        plan: "Seumur Hidup",
      })
    );
    expect(screen.getByText(/Seumur Hidup/)).toBeDefined();
  });

  it("renders a link with the magic link href", () => {
    render(
      WelcomeEmail({
        name: "Budi",
        magicLink: "https://example.com/magic",
        plan: "Bulanan",
      })
    );
    const link = screen.getByRole("link", { name: /Masuk ke Dashboard/ });
    expect(link.getAttribute("href")).toBe("https://example.com/magic");
  });

  it("renders CTA button text 'Masuk ke Dashboard'", () => {
    render(
      WelcomeEmail({
        name: "Budi",
        magicLink: "https://example.com/magic",
        plan: "Bulanan",
      })
    );
    expect(screen.getByText("Masuk ke Dashboard")).toBeDefined();
  });

  it("renders disclaimer text containing 'sekali login'", () => {
    render(
      WelcomeEmail({
        name: "Budi",
        magicLink: "https://example.com/magic",
        plan: "Bulanan",
      })
    );
    expect(screen.getByText(/sekali login/)).toBeDefined();
  });
});
