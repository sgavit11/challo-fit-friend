import { useState, useCallback } from 'react'
import { getProfiles, saveProfile, deleteProfile, getActiveProfileId, setActiveProfileId } from '../storage'

export const useProfile = () => {
  const [profiles, setProfiles] = useState(() => getProfiles())
  const [activeId, setActiveId] = useState(() => getActiveProfileId())

  const activeProfile = profiles.find(p => p.id === activeId) ?? null

  const addOrUpdateProfile = useCallback((profile) => {
    saveProfile(profile)
    setProfiles(getProfiles())
  }, [])

  const removeProfile = useCallback((id) => {
    if (getProfiles().length <= 1) return
    deleteProfile(id)
    const remaining = getProfiles()
    setProfiles(remaining)
    if (id === activeId) {
      setActiveProfileId(remaining[0].id)
      setActiveId(remaining[0].id)
    }
  }, [activeId])

  const switchProfile = useCallback((id) => {
    setActiveProfileId(id)
    setActiveId(id)
  }, [])

  return { profiles, activeProfile, addOrUpdateProfile, removeProfile, switchProfile }
}
