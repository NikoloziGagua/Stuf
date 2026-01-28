import type { SectionId, EntitySection, PhaseTab, EntityTab, SnippetTag, LibraryItem } from './types'

export const sections: { id: SectionId; description: string }[] = [
  { id: 'Home', description: 'Start screen and shortcuts' },
  { id: 'Phases', description: 'Narratives, subphases, linked sources' },
  { id: 'Countries', description: 'Auto pages built from sources' },
  { id: 'Empires', description: 'Auto pages built from sources' },
  { id: 'People', description: 'Kings, presidents, and leaders' },
  { id: 'Places', description: 'Cities, regions, and routes' },
  { id: 'Library', description: 'All uploaded material' },
]

export const entitySections: EntitySection[] = [
  'Countries',
  'Empires',
  'People',
  'Places',
]

export const snippetTags: SnippetTag[] = ['evidence', 'claim', 'question']

export const phaseTabs: PhaseTab[] = ['Overview', 'Subphases', 'Sources']

export const entityTabs: EntityTab[] = ['Overview', 'Subphases', 'Sources']

export const libraryItems: LibraryItem[] = [
  {
    title: 'Venetian port ledger',
    type: 'PDF',
    phase: 'Renaissance and Reformation',
    status: 'OCR 92%',
    added: 'Today',
  },
  {
    title: 'Mediterranean sea map',
    type: 'Photo',
    phase: 'Renaissance and Reformation',
    status: 'Needs review',
    added: 'Yesterday',
  },
  {
    title: 'Factory wage book',
    type: 'PDF',
    phase: 'Age of Revolutions',
    status: 'OCR 90%',
    added: '2 days ago',
  },
]

export const storageKey = 'history-studio-phases-v2'
export const entityStorageKey = 'history-studio-entities-v1'

export const isEntitySectionId = (value: string): value is EntitySection =>
  entitySections.includes(value as EntitySection)

export const isEntitySection = (section: SectionId): section is EntitySection =>
  section !== 'Home' && section !== 'Phases' && section !== 'Library'
