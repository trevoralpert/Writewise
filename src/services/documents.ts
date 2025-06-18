import { supabase } from './supabaseClient'

export async function createDocument(userId: string, title: string, content: string) {
  const { data, error } = await supabase
    .from('documents')
    .insert([{ user_id: userId, title, content }])
    .select()
    .single()
  return { data, error }
}

export async function getDocuments(userId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  return { data, error }
}

export async function updateDocument(id: string, content: string) {
  const { data, error } = await supabase
    .from('documents')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteDocument(id: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
  return { error }
}

export async function getDocumentById(id: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}
