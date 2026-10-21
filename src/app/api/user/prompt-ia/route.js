import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserPromptIa, updateUserPromptIa } from '@/lib/users';
import { asTrimmedString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const MAX_PROMPT_LENGTH = 8000;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const prompt_ia = await getUserPromptIa(session.id_users);
    return NextResponse.json({ prompt_ia });
  } catch (err) {
    console.error('[prompt-ia GET]', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao carregar o prompt' },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const prompt = asTrimmedString(body.prompt_ia ?? body.prompt ?? '');
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `O prompt deve ter no máximo ${MAX_PROMPT_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  try {
    const prompt_ia = await updateUserPromptIa(session.id_users, prompt || null);
    return NextResponse.json({ prompt_ia: prompt_ia ?? '' });
  } catch (err) {
    console.error('[prompt-ia PUT]', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao guardar o prompt' },
      { status: 500 },
    );
  }
}
