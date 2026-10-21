import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { config } from './config.js';
import { SESSION_COOKIE, SESSION_MAX_AGE } from './constants.js';

function getSecret() {
  if (!config.sessionSecret) {
    throw new Error('SESSION_SECRET não configurado.');
  }
  return new TextEncoder().encode(config.sessionSecret);
}

export async function encryptSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function decryptSession(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

export async function getSession() {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const payload = await decryptSession(token);
    if (!payload?.id_users) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload) {
  const token = await encryptSession(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
