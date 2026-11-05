import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, KeyRound, LogOut, ShieldCheck, Upload, UserRound } from 'lucide-react'
import { isSupportedProfileAvatar } from '../../lib/profile-avatar'
import { defaultWorkoutPreferences, type WorkoutPreferences } from '../../lib/workout-preferences'
import { changeOwnPassword, downloadPersonalExport, exportOwnData, getOwnProfile, getOwnWorkoutPreferences, getProfileAvatarUrl, saveOwnWorkoutPreferences, signOutEverywhere, updateOwnProfile, uploadProfileAvatar } from './api'

export function Profile({ onBack, onSignedOut, onPreferencesChanged }: { onBack: () => void; onSignedOut: () => void; onPreferencesChanged: (preferences: WorkoutPreferences) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [preferences, setPreferences] = useState<WorkoutPreferences>(defaultWorkoutPreferences)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const [data, savedPreferences] = await Promise.all([getOwnProfile(), getOwnWorkoutPreferences()])
      setName(data.profile.display_name)
      setEmail(data.email)
      setAvatarUrl(data.profile.avatar_path ? await getProfileAvatarUrl(data.profile.avatar_path) : '')
      setPreferences(savedPreferences)
    } catch (error: any) { setNotice(error.message) }
  }

  useEffect(() => { void load() }, [])

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice('')
    try { const profile = await updateOwnProfile(name); setName(profile.display_name); setNotice('Perfil salvo.') } catch (error: any) { setNotice(error.message) } finally { setBusy(false) }
  }
  const chooseAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!isSupportedProfileAvatar(file.type, file.size)) { setNotice('Use uma imagem de até 5 MB.'); return }
    setBusy(true); setNotice('')
    try { const profile = await uploadProfileAvatar(file); setAvatarUrl(await getProfileAvatarUrl(profile.avatar_path!)); setNotice('Foto do perfil atualizada.') } catch (error: any) { setNotice(error.message) } finally { setBusy(false); event.target.value = '' }
  }
  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice('')
    try { await changeOwnPassword(currentPassword, newPassword); setCurrentPassword(''); setNewPassword(''); setNotice('Senha alterada.'); } catch (error: any) { setNotice(error.message) } finally { setBusy(false) }
  }
  const endAllSessions = async () => {
    if (!confirm('Encerrar esta conta em todos os dispositivos?')) return
    setBusy(true); setNotice('')
    try { await signOutEverywhere(); onSignedOut() } catch (error: any) { setNotice(error.message) } finally { setBusy(false) }
  }
  const downloadData = async () => {
    setBusy(true); setNotice('')
    try { downloadPersonalExport(await exportOwnData()); setNotice('Exportação iniciada.') } catch (error: any) { setNotice(`Não foi possível exportar seus dados: ${error.message}`) } finally { setBusy(false) }
  }
  const savePreferences = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice('')
    try { const saved = await saveOwnWorkoutPreferences(preferences); onPreferencesChanged(saved); setNotice('Preferências de treino salvas.') } catch (error: any) { setNotice(error.message) } finally { setBusy(false) }
  }

  return <main className="history-page profile-page">
    <header><button className="icon" onClick={onBack} aria-label="Voltar"><ArrowLeft /></button><div><p className="eyebrow">PERFIL E SEGURANÇA</p><h1>Sua conta</h1><p>As alterações valem apenas para você.</p></div></header>
    <p className="notice" role="status">{notice}</p>
    <section className="profile-card">
      <div className="profile-avatar-wrap">{avatarUrl ? <img src={avatarUrl} alt="Sua foto de perfil" /> : <UserRound aria-hidden="true" />}</div>
      <div><h2>Foto de perfil</h2><p>Use uma imagem de até 5 MB.</p><button disabled={busy} onClick={() => fileInput.current?.click()}><Upload />Trocar foto</button><input ref={fileInput} className="visually-hidden" type="file" accept="image/*" onChange={chooseAvatar} /></div>
    </section>
    <section className="profile-card"><div><h2>Dados da conta</h2><p>E-mail: <b>{email || '—'}</b></p></div><form onSubmit={saveProfile}><label>Nome exibido<input value={name} onChange={event => setName(event.target.value)} required maxLength={80} /></label><button disabled={busy}>Salvar perfil</button></form></section>
    <section className="profile-card"><div><h2><KeyRound /> Alterar senha</h2><p>Confirme a senha atual e escolha uma nova com no mínimo 8 caracteres.</p></div><form onSubmit={savePassword}><label>Senha atual<input value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} type="password" required autoComplete="current-password" /></label><label>Nova senha<input value={newPassword} onChange={event => setNewPassword(event.target.value)} type="password" minLength={8} required autoComplete="new-password" /></label><button disabled={busy}>Salvar nova senha</button></form></section>
    <section className="profile-card"><div><h2>Preferências de treino</h2><p>O descanso padrão entra automaticamente ao adicionar exercícios novos. Os avisos são usados quando um descanso termina.</p></div><form onSubmit={savePreferences}><label>Descanso padrão (segundos)<input type="number" min="0" max="3600" value={preferences.defaultRestSeconds} onChange={event => setPreferences(current => ({ ...current, defaultRestSeconds: Number(event.target.value) }))} /></label><label className="toggle-label"><input type="checkbox" checked={preferences.soundEnabled} onChange={event => setPreferences(current => ({ ...current, soundEnabled: event.target.checked }))} />Som ao terminar descanso</label><label className="toggle-label"><input type="checkbox" checked={preferences.vibrationEnabled} onChange={event => setPreferences(current => ({ ...current, vibrationEnabled: event.target.checked }))} />Vibrar ao terminar descanso</label><button disabled={busy}>Salvar preferências</button></form></section>
    <section className="profile-card security-card"><div><h2><ShieldCheck /> Sessões</h2><p>Se perdeu um dispositivo, encerre o acesso da sua conta em todos os dispositivos.</p></div><button className="danger" disabled={busy} onClick={endAllSessions}><LogOut />Encerrar todas as sessões</button></section>
    <section className="profile-card"><div><h2><Download /> Seus dados</h2><p>Baixe um arquivo JSON com seus treinos, séries, medidas, registros de recuperação e metadados das fotos. As imagens não são incluídas no arquivo.</p></div><button disabled={busy} onClick={downloadData}><Download />Exportar dados</button></section>
    <p className="profile-note">A remoção de senha só é possível depois de configurar outro método de acesso seguro. Por isso ela não é simulada aqui.</p>
  </main>
}
