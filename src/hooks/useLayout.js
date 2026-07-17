import { useState, useEffect, useRef } from 'react'
import { db } from '../services/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { defaultYard } from '../lib/beds'

// Yard shape, paths and decor — fields on the users/{uid} doc
// (yardTiles / pathTiles: string[], decorItems: [{id,type,x,y}]).
// Loaded once per mount; writes are debounced (tile painting is rapid).
export function useLayout(uid) {
  const [data, setData] = useState({
    loaded: false,
    yard: new Set(),
    paths: new Set(),
    decor: [],
    pocMigrated: false,
  })
  const pending = useRef({})
  const timer = useRef(null)

  useEffect(() => {
    if (!uid) return
    getDoc(doc(db, 'users', uid)).then(snap => {
      const d = snap.data() || {}
      setData({
        loaded: true,
        yard: new Set(d.yardTiles?.length ? d.yardTiles : defaultYard()),
        paths: new Set(d.pathTiles || []),
        decor: d.decorItems || [],
        pocMigrated: !!d.pocMigrated,
      })
    })
  }, [uid])

  function scheduleWrite(fields) {
    Object.assign(pending.current, fields)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const payload = pending.current
      pending.current = {}
      updateDoc(doc(db, 'users', uid), payload).catch(() => {})
    }, 600)
  }

  function makeSetter(field, storeKey) {
    return value => {
      setData(prev => {
        const v = typeof value === 'function' ? value(prev[field]) : value
        scheduleWrite({ [storeKey]: v instanceof Set ? [...v] : v })
        return { ...prev, [field]: v }
      })
    }
  }

  return {
    ...data,
    setYard: makeSetter('yard', 'yardTiles'),
    setPaths: makeSetter('paths', 'pathTiles'),
    setDecor: makeSetter('decor', 'decorItems'),
  }
}
