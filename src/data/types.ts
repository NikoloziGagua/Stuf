export type SectionId =
  | 'Home'
  | 'Phases'
  | 'Countries'
  | 'Empires'
  | 'People'
  | 'Places'
  | 'Library'

export type EntitySection = Exclude<SectionId, 'Home' | 'Phases' | 'Library'>

export type PhaseTab = 'Overview' | 'Subphases' | 'Sources'

export type EntityTab = 'Overview' | 'Subphases' | 'Sources'

export type DiscussionLine = { role: 'ai' | 'you'; text: string }

export type AiAction = 'draft' | 'edit' | 'overview' | 'chat' | 'setup'
export type AiScope = 'summary' | 'subphase'

export type AiContext = {
  kind: 'phase' | 'entity'
  scope: AiScope
  title: string
  range: string
  focus?: string
  summary?: string
  prompt?: string
  draft?: string
  readingText?: string
}

export type AiChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type SnippetTag = 'evidence' | 'claim' | 'question'

export type PhaseSetup = {
  title?: string
  range?: string
  summary?: string
  subphaseTitle?: string
  subphaseRange?: string
  subphasePrompt?: string
  themes?: string[]
  questions?: string[]
}

export type SubphaseSetup = {
  title?: string
  range?: string
  prompt?: string
}

export type ConnectionNode =
  | { kind: 'phase'; phaseId: string }
  | { kind: 'phase-subphase'; phaseId: string; subphaseId: string }
  | { kind: 'entity'; section: EntitySection; entityId: string }
  | {
      kind: 'entity-subphase'
      section: EntitySection
      entityId: string
      subphaseId: string
    }

export type ConnectionRelation =
  | 'relates'
  | 'influences'
  | 'contrasts'
  | 'supports'

export type Connection = {
  id: string
  from: ConnectionNode
  to: ConnectionNode
  relation: ConnectionRelation
  note: string
  createdAt: string
}

export type SourceCard = {
  id: string
  title: string
  type: string
  date: string
  origin: string
  excerpt: string
  confidence: string
  tags: string[]
  fileName?: string
  fileType?: string
  fileSize?: number
}

export type NoteCard = {
  id: string
  title: string
  evidence: string
  source: string
  status: string
}

export type TimelineEvent = { date: string; title: string; detail: string }

export type NarrativeHighlight = {
  id: string
  text: string
  note: string
}

export type NarrativeSnippet = {
  id: string
  text: string
  tag: SnippetTag
}

export type NarrativeVersion = {
  id: string
  content: string
  createdAt: string
}

export type NarrativeUpdate = {
  narrativeHighlights?: NarrativeHighlight[]
  narrativeSnippets?: NarrativeSnippet[]
  narrativeVersions?: NarrativeVersion[]
}

export type Subphase = {
  id: string
  title: string
  range: string
  prompt: string
  webOverview: string
  webSources: string[]
  draft: string
  readingText: string
  focusPoints: string[]
}

export type Phase = {
  id: string
  title: string
  range: string
  summary: string
  webOverview: string
  webSources: string[]
  themes: string[]
  questions: string[]
  narrativeHighlights?: NarrativeHighlight[]
  narrativeSnippets?: NarrativeSnippet[]
  narrativeVersions?: NarrativeVersion[]
  discussion: DiscussionLine[]
  sources: SourceCard[]
  notes: NoteCard[]
  timeline: TimelineEvent[]
  subphases: Subphase[]
}

export type EntityRecord = {
  id: string
  name: string
  era: string
  focus: string
  summary: string
  tags: string[]
  webOverview: string
  webSources: string[]
  subphases: Subphase[]
  narrativeHighlights?: NarrativeHighlight[]
  narrativeSnippets?: NarrativeSnippet[]
  narrativeVersions?: NarrativeVersion[]
  sources: SourceCard[]
  notes: NoteCard[]
  timeline: TimelineEvent[]
}

export type LibraryItem = {
  title: string
  type: string
  phase: string
  status: string
  added: string
}

export type WorkspaceContext =
  | { kind: 'phase'; id: string }
  | { kind: 'entity'; section: EntitySection; id: string }
