import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const nombre = String(data.get('nombre') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const descripcion = String(data.get('descripcion') ?? '').trim();
  const gotcha = String(data.get('_gotcha') ?? '');

  if (gotcha) {
    return Response.redirect(new URL('/contact?ok=1', request.url), 303);
  }

  if (!nombre || !email || !descripcion) {
    return new Response('Campos requeridos faltantes', { status: 400 });
  }

  if (nombre.length > 25 || descripcion.length > 500) {
    return new Response('Datos inválidos', { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: 'Contacto desde Portafolio <noreply@vindevsito.dev>',
    to: 'vin.devsito@gmail.com',
    replyTo: email,
    subject: `Contacto portafolio — ${nombre}`,
    text: descripcion,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      Importance: 'High',
    },
  });

  if (error) {
    console.error('Resend error:', error);
    return new Response('Fallo envío', { status: 502 });
  }

  return Response.redirect(new URL('/contact?ok=1', request.url), 303);
};
