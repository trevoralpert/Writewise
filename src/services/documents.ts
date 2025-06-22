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

export type SharePermission = 'view' | 'edit' | 'comment'

export interface DocumentShare {
  id: string
  document_id: string
  shared_with_email: string
  shared_by_user_id: string
  permission: SharePermission
  created_at: string
  expires_at?: string
}

export interface PublicShare {
  id: string
  document_id: string
  share_token: string
  permission: SharePermission
  created_at: string
  expires_at?: string
  is_active: boolean
}

export async function shareDocument(
  documentId: string, 
  sharedByUserId: string, 
  shareWithEmail: string, 
  permission: SharePermission,
  expiresAt?: string
) {
  const { data, error } = await supabase
    .from('document_shares')
    .insert([{
      document_id: documentId,
      shared_with_email: shareWithEmail,
      shared_by_user_id: sharedByUserId,
      permission,
      expires_at: expiresAt
    }])
    .select()
    .single()
  return { data, error }
}

export async function createPublicShare(
  documentId: string,
  permission: SharePermission,
  expiresAt?: string
): Promise<{ data: PublicShare | null, error: any }> {
  const shareToken = generateShareToken()
  
  const { data, error } = await supabase
    .from('public_shares')
    .insert([{
      document_id: documentId,
      share_token: shareToken,
      permission,
      expires_at: expiresAt,
      is_active: true
    }])
    .select()
    .single()
  return { data, error }
}

export async function getSharedDocuments(userEmail: string) {
  const { data, error } = await supabase
    .from('document_shares')
    .select(`
      *,
      documents:document_id (
        id,
        title,
        content,
        created_at,
        updated_at,
        user_id
      )
    `)
    .eq('shared_with_email', userEmail)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getDocumentShares(documentId: string) {
  const [directShares, publicShares] = await Promise.all([
    supabase
      .from('document_shares')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false }),
    supabase
      .from('public_shares')
      .select('*')
      .eq('document_id', documentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
  ])
  
  return {
    directShares: directShares.data || [],
    publicShares: publicShares.data || [],
    error: directShares.error || publicShares.error
  }
}

export async function removeDocumentShare(shareId: string) {
  const { error } = await supabase
    .from('document_shares')
    .delete()
    .eq('id', shareId)
  return { error }
}

export async function deactivatePublicShare(shareId: string) {
  const { data, error } = await supabase
    .from('public_shares')
    .update({ is_active: false })
    .eq('id', shareId)
    .select()
    .single()
  return { data, error }
}

export async function getDocumentByShareToken(shareToken: string) {
  const { data, error } = await supabase
    .from('public_shares')
    .select(`
      *,
      documents:document_id (
        id,
        title,
        content,
        created_at,
        updated_at,
        user_id
      )
    `)
    .eq('share_token', shareToken)
    .eq('is_active', true)
    .single()
  
  if (error) return { data: null, error }
  
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { data: null, error: { message: 'Share link has expired' } }
  }
  
  return { data, error: null }
}

export interface DocumentVersion {
  id: string
  document_id: string
  content: string
  title: string
  version_number: number
  created_at: string
  created_by_user_id: string
  change_summary?: string
}

export async function saveDocumentVersion(
  documentId: string,
  content: string,
  title: string,
  userId: string,
  changeSummary?: string
) {
  const { data: lastVersion } = await supabase
    .from('document_versions')
    .select('version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()
  
  const versionNumber = (lastVersion?.version_number || 0) + 1
  
  const { data, error } = await supabase
    .from('document_versions')
    .insert([{
      document_id: documentId,
      content,
      title,
      version_number: versionNumber,
      created_by_user_id: userId,
      change_summary: changeSummary
    }])
    .select()
    .single()
  return { data, error }
}

export async function getDocumentVersions(documentId: string) {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
  return { data, error }
}

export async function restoreDocumentVersion(documentId: string, versionId: string, userId: string) {
  const { data: version, error: versionError } = await supabase
    .from('document_versions')
    .select('*')
    .eq('id', versionId)
    .single()
  
  if (versionError) return { data: null, error: versionError }
  
  const { data: currentDoc } = await getDocumentById(documentId)
  if (currentDoc) {
    await saveDocumentVersion(
      documentId,
      currentDoc.content,
      currentDoc.title,
      userId,
      `Auto-save before restoring to version ${version.version_number}`
    )
  }
  
  const { data, error } = await supabase
    .from('documents')
    .update({
      content: version.content,
      title: version.title,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)
    .select()
    .single()
  
  return { data, error }
}

function generateShareToken(): string {
  return 'share_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function checkDocumentPermission(documentId: string, userEmail: string): Promise<{
  hasAccess: boolean
  permission: SharePermission | 'owner'
  isOwner: boolean
}> {
  const { data: doc } = await getDocumentById(documentId)
  if (!doc) return { hasAccess: false, permission: 'view', isOwner: false }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (user && doc.user_id === user.id) {
    return { hasAccess: true, permission: 'owner', isOwner: true }
  }
  
  const { data: share } = await supabase
    .from('document_shares')
    .select('permission')
    .eq('document_id', documentId)
    .eq('shared_with_email', userEmail)
    .single()
  
  if (share) {
    return { hasAccess: true, permission: share.permission, isOwner: false }
  }
  
  return { hasAccess: false, permission: 'view', isOwner: false }
}
