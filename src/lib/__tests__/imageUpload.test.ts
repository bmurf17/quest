import { describe, expect, it } from "vitest";
import { MAX_IMAGE_UPLOAD_BYTES, validateImageFile } from "@/lib/imageUpload";

const file = (name: string, type: string, size = 10) => ({ name, type, size }) as unknown as File;

describe("image uploads", () => {
  it("accepts supported image types within the size limit", () => {
    expect(validateImageFile(file("sword.png", "image/png"))).toBeNull();
    expect(validateImageFile(file("photo.jpg", "image/jpeg"))).toBeNull();
  });

  it("rejects non-images and oversized files", () => {
    expect(validateImageFile(file("notes.txt", "text/plain"))).toMatch(/PNG/);
    expect(validateImageFile(file("huge.png", "image/png", MAX_IMAGE_UPLOAD_BYTES + 1))).toMatch(
      /5 MB/,
    );
  });
});
