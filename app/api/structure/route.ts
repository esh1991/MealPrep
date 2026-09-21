import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/supabase/member";
import { createClient } from "@/lib/supabase/server";
import {
  NOTES_INSTRUCTION,
  PHOTO_INSTRUCTION,
  PROMPT,
  RecipeDraftSchema,
} from "@/lib/structure/schema";
import { draftIsUsable, normalizeDraft } from "@/lib/structure/normalize";

// Turning a photo or a pile of notes into a structured recipe. The API key
// lives here and never reaches the browser.

export const runtime = "nodejs";
// Reading a cookbook page and estimating macros can take a while.
export const maxDuration = 60;

const MODEL = "claude-opus-5";
const MAX_NOTES = 8000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

type MediaType = (typeof MEDIA_TYPES)[number];

interface Body {
  kind?: "photo" | "notes";
  notes?: string;
  image?: { mediaType?: string; data?: string };
}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session.state !== "member") return fail("Sign in first.", 401);
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail("Recipe import isn't switched on. ANTHROPIC_API_KEY is missing.", 503);
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return fail("Couldn't read that request.");
  }

  const kind = body.kind === "photo" ? "photo" : "notes";
  const notes = (body.notes ?? "").trim();
  const image = body.image;

  if (kind === "notes" && !notes) return fail("Paste some notes first.");
  if (kind === "photo") {
    if (!image?.data) return fail("Choose a photo first.");
    if (!MEDIA_TYPES.includes(image.mediaType as MediaType)) {
      return fail("That file isn't an image the reader understands.");
    }
    // Base64 is about 4 characters for every 3 bytes.
    if (image.data.length * 0.75 > MAX_IMAGE_BYTES) {
      return fail("That photo is too large. Try a smaller one.");
    }
  }

  const supabase = await createClient();
  const { data: ingredientRows } = await supabase.from("ingredients").select("id, name");
  const known = (ingredientRows ?? []) as { id: string; name: string }[];

  const anthropic = new Anthropic();
  const instruction =
    kind === "photo"
      ? PHOTO_INSTRUCTION
      : `${NOTES_INSTRUCTION}\n"""\n${notes.slice(0, MAX_NOTES)}\n"""`;

  const content: Anthropic.ContentBlockParam[] =
    kind === "photo"
      ? [
          {
            type: "image",
            source: { type: "base64", media_type: image!.mediaType as MediaType, data: image!.data! },
          },
          { type: "text", text: instruction },
        ]
      : [{ type: "text", text: instruction }];

  let usage: { input: number; output: number } = { input: 0, output: 0 };
  let ok = false;

  try {
    const response = await anthropic.messages.parse(
      {
        model: MODEL,
        max_tokens: 4000,
        system: PROMPT,
        messages: [{ role: "user", content }],
        output_config: { format: zodOutputFormat(RecipeDraftSchema) },
      },
      { signal: request.signal },
    );

    usage = { input: response.usage.input_tokens, output: response.usage.output_tokens };

    // Safety classifiers answer with a 200 and a refusal, not an error.
    if (response.stop_reason === "refusal") {
      await logUsage(session.member, kind, usage, false);
      return fail("Claude wouldn't turn that into a recipe. Try different notes or a clearer photo.");
    }

    const draft = normalizeDraft(response.parsed_output, known);
    if (!draftIsUsable(draft)) {
      await logUsage(session.member, kind, usage, false);
      return fail(
        kind === "photo"
          ? "No ingredients could be read from that photo. Try a clearer or closer one."
          : "No ingredients were found in those notes. Add a bit more detail and try again.",
      );
    }

    ok = true;
    await logUsage(session.member, kind, usage, true);
    return NextResponse.json({ draft, usage });
  } catch (error) {
    if (usage.input || usage.output) await logUsage(session.member, kind, usage, ok);

    if (error instanceof Anthropic.APIUserAbortError) {
      return fail("Stopped.", 499);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return fail("Too many requests right now. Try again in a minute.", 429);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return fail("The Anthropic key was refused. Check ANTHROPIC_API_KEY.", 401);
    }
    if (error instanceof Anthropic.BadRequestError) {
      return fail(
        kind === "photo"
          ? "That photo couldn't be read. Try a clearer or smaller one."
          : "Those notes couldn't be read. Try trimming them.",
      );
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return fail("Couldn't reach Claude. Check your connection and try again.", 502);
    }
    console.error("recipe structuring failed", error);
    return fail("Couldn't structure that recipe. Try again.", 500);
  }
}

/**
 * Records what the call cost in tokens. Best effort: a recipe that imported
 * should not fail because the bookkeeping did.
 */
async function logUsage(
  member: { id: string; householdId: string },
  kind: string,
  usage: { input: number; output: number },
  ok: boolean,
) {
  try {
    const supabase = await createClient();
    // api_usage arrives in migration 0004; the generated types catch up when
    // they are next regenerated with `npm run types`.
    await (supabase.from("api_usage" as never) as unknown as {
      insert: (row: Record<string, unknown>) => Promise<unknown>;
    }).insert({
      household_id: member.householdId,
      member_id: member.id,
      kind,
      model: MODEL,
      input_tokens: usage.input,
      output_tokens: usage.output,
      ok,
    });
  } catch (error) {
    console.error("could not record api usage", error);
  }
}
