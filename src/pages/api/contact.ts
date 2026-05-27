import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const messages = {
  es: {
    missingFields: 'Campos requeridos faltantes',
    invalidData: 'Datos inválidos',
    sendFailure: 'Fallo envío',
    fromName: 'Contacto desde Portafolio',
    subject: (n: string) => `Contacto portafolio — ${n}`,
  },
  en: {
    missingFields: 'Required fields missing',
    invalidData: 'Invalid data',
    sendFailure: 'Send failure',
    fromName: 'Portfolio Contact',
    subject: (n: string) => `Portfolio contact — ${n}`,
  },
} as const;

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const nombre = String(data.get('nombre') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const descripcion = String(data.get('descripcion') ?? '').trim();
  const gotcha = String(data.get('_gotcha') ?? '');
  const locale = String(data.get('locale') ?? 'es') === 'en' ? 'en' : 'es';
  const m = messages[locale];

  if (gotcha) {
    const successPath = locale === 'en' ? '/en/contact?ok=1' : '/contact?ok=1';
    return Response.redirect(new URL(successPath, request.url), 303);
  }

  if (!nombre || !email || !descripcion) {
    return new Response(m.missingFields, { status: 400 });
  }

  if (nombre.length > 25 || descripcion.length > 500) {
    return new Response(m.invalidData, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: `${m.fromName} <noreply@vindevsito.dev>`,
    to: 'vin.devsito@gmail.com',
    replyTo: email,
    subject: m.subject(nombre),
    text: descripcion,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      Importance: 'High',
    },
  });

  if (error) {
    console.error('Resend error:', error);
    return new Response(m.sendFailure, { status: 502 });
  }

  const successPath = locale === 'en' ? '/en/contact?ok=1' : '/contact?ok=1';
  return Response.redirect(new URL(successPath, request.url), 303);
};
