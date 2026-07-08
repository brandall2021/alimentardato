'use server'

import { guardarConfig } from '@/actions/configuracion'
import { revalidatePath } from 'next/cache'

export async function actualizarCredenciales(formData: FormData): Promise<void> {
  await guardarConfig('dev_email', (formData.get('email') as string) ?? '')
  const pass = (formData.get('password') as string) ?? ''
  if (pass) {
    await guardarConfig('dev_password', pass)
    await guardarConfig('dev_password_set', 'true')
  }
  revalidatePath('/admin/configuracion')
}
