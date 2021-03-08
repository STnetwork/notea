import { useState, useCallback } from 'react'
import { createContainer } from 'unstated-next'
import escapeStringRegexp from 'escape-string-regexp'
import useFetch, { CachePolicies } from 'use-http'
import { map, reduce, some } from 'lodash'
import { NoteTreeState } from './tree'
import TreeActions from 'shared/tree'
import { NoteModel } from './note'

function useTrashData() {
  const [keyword, setKeyword] = useState<string>()
  const [filterData, setFilterData] = useState<NoteModel[]>()
  const { tree, restoreItem } = NoteTreeState.useContainer()
  const { post } = useFetch('/api/trash', {
    cachePolicy: CachePolicies.NO_CACHE,
  })

  const getDeletedNotes = useCallback(() => {
    const items = TreeActions.getUnusedItems(tree)
    const notes = map(items, (item) => item.data)

    return notes
  }, [tree])

  const filterNotes = useCallback(
    async (keyword?: string) => {
      const notes = getDeletedNotes()
      const re = keyword ? new RegExp(escapeStringRegexp(keyword)) : false
      const data = reduce<NoteModel | undefined, NoteModel[]>(
        notes,
        (acc, note) => {
          if (!note) return acc
          if (!re || re.test(note.title)) {
            return [...acc, note]
          }
          return acc
        },
        []
      )

      setKeyword(keyword)
      setFilterData(data)
    },
    [getDeletedNotes]
  )

  const restoreNote = useCallback(
    async (note: NoteModel) => {
      const notes = getDeletedNotes()
      // 父页面被删除时，恢复页面的 parent 改成 root
      if (!note.pid || some(notes, (n) => n && n.id === note.pid)) {
        note.pid = 'root'
      }

      await post({
        action: 'restore',
        data: {
          id: note.id,
          parentId: note.pid,
        },
      })
      restoreItem(note.id, note.pid)

      return note
    },
    [post, getDeletedNotes, restoreItem]
  )

  const deleteNote = useCallback(
    async (id: string) => {
      await post({
        action: 'delete',
        data: {
          id,
        },
      })
    },
    [post]
  )

  return {
    filterData,
    keyword,
    filterNotes,
    restoreNote,
    deleteNote,
  }
}

function useFilterModal() {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  return { isOpen, openModal, closeModal }
}

function useTrash() {
  return {
    ...useFilterModal(),
    ...useTrashData(),
  }
}

export const TrashState = createContainer(useTrash)
