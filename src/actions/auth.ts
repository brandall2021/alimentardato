'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/lib/auth'

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/admin/alumnos',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return 'Email o contraseña incorrectos.'
      }
      return 'No se pudo iniciar sesión. Intentá nuevamente.'
    }
    throw error
  }
}
