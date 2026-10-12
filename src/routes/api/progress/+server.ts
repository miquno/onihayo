import { error, json } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { getAuthRuntime } from '$lib/server/auth/runtime';
import { mergeGuestProgress, saveLearnerProgress } from '$lib/server/db/progress';
import { maxProgressDocumentLength } from '$lib/progress/storage';

const bodySchema = v.strictObject({
  document: v.pipe(v.string(), v.maxLength(maxProgressDocumentLength)),
  revision: v.optional(v.pipe(v.number(), v.safeInteger(), v.minValue(0)))
});

async function boundedBody(request: Request): Promise<unknown> {
  if (request.body === null) error(400, 'Missing request body.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  let chunk = await reader.read();
  while (!chunk.done) {
    const { value } = chunk;
    length += value.byteLength;
    if (length > maxProgressDocumentLength * 2 + 200) error(413, 'Progress is too large.');
    chunks.push(value);
    chunk = await reader.read();
  }
  try {
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))
    ) as unknown;
  } catch {
    error(400, 'Invalid JSON.');
  }
}

export const POST: RequestHandler = async ({ request, url, locals }) => {
  if (request.headers.get('origin') !== url.origin) error(403, 'Invalid origin.');
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
    error(415, 'JSON required.');
  const auth = getAuthRuntime();
  if (locals.user === null || auth === null) error(401, 'Sign in required.');
  const parsed = v.safeParse(bodySchema, await boundedBody(request));
  if (!parsed.success) error(400, 'Invalid progress document.');
  if (url.searchParams.has('merge')) {
    const result = await mergeGuestProgress(
      auth.database.db,
      locals.user.id,
      parsed.output.document
    );
    if (result === null) error(400, 'Invalid progress document.');
    return json(result, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (parsed.output.revision === undefined) error(400, 'Revision required.');
  const result = await saveLearnerProgress(
    auth.database.db,
    locals.user.id,
    parsed.output.document,
    parsed.output.revision
  );
  if (result.status === 'invalid') error(400, 'Invalid progress document.');
  if (result.status === 'conflict')
    error(409, 'Progress changed elsewhere. Reload before continuing.');
  return json({ revision: result.revision }, { headers: { 'Cache-Control': 'no-store' } });
};
