import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await context.params;
  const sanitizedId = (fileId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
  if (!sanitizedId || sanitizedId.length < 5 || sanitizedId.length > 100) {
    return new NextResponse("Invalid file ID format", { status: 400 });
  }

  const url = new URL(req.url);
  const target = new URL(`/api/drive/media/${sanitizedId}`, req.url);
  target.search = url.search;
  return NextResponse.redirect(target, { status: 307 });
}
