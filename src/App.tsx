import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  type CSSProperties,
  type ChangeEvent,
} from 'react'
import { useMatch, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import { useToast } from './components/Toast'
import { Breadcrumbs } from './components/Breadcrumbs'
import { CommandPalette } from './components/CommandPalette'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

type SectionId =
  | 'Home'
  | 'Phases'
  | 'Countries'
  | 'Empires'
  | 'People'
  | 'Places'
  | 'Library'

type EntitySection = Exclude<SectionId, 'Home' | 'Phases' | 'Library'>

type PhaseTab =
  | 'Overview'
  | 'Subphases'
  | 'Sources'

type EntityTab = 'Overview' | 'Subphases' | 'Sources'

type WorkspaceContext =
  | { kind: 'phase'; id: string }
  | { kind: 'entity'; section: EntitySection; id: string }

type DiscussionLine = { role: 'ai' | 'you'; text: string }

type AiAction = 'draft' | 'edit' | 'overview' | 'chat' | 'setup'
type AiScope = 'summary' | 'subphase'

type AiContext = {
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

type AiChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type SnippetTag = 'evidence' | 'claim' | 'question'

type PhaseSetup = {
  title?: string
  range?: string
  summary?: string
  subphaseTitle?: string
  subphaseRange?: string
  subphasePrompt?: string
  themes?: string[]
  questions?: string[]
}

type SubphaseSetup = {
  title?: string
  range?: string
  prompt?: string
}

type SourceCard = {
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
  fileUrl?: string
}

type NoteCard = {
  id: string
  title: string
  evidence: string
  source: string
  status: string
}

type TimelineEvent = { date: string; title: string; detail: string }

type NarrativeHighlight = {
  id: string
  text: string
  note: string
}

type NarrativeSnippet = {
  id: string
  text: string
  tag: SnippetTag
}

type NarrativeVersion = {
  id: string
  content: string
  createdAt: string
}

type NarrativeUpdate = {
  narrativeHighlights?: NarrativeHighlight[]
  narrativeSnippets?: NarrativeSnippet[]
  narrativeVersions?: NarrativeVersion[]
}

type Subphase = {
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

type ConnectionNode =
  | { kind: 'phase'; phaseId: string }
  | { kind: 'phase-subphase'; phaseId: string; subphaseId: string }
  | { kind: 'entity'; section: EntitySection; entityId: string }
  | {
      kind: 'entity-subphase'
      section: EntitySection
      entityId: string
      subphaseId: string
    }

type ConnectionRelation = 'relates' | 'influences' | 'contrasts' | 'supports'

type Connection = {
  id: string
  from: ConnectionNode
  to: ConnectionNode
  relation: ConnectionRelation
  note: string
  createdAt: string
}

type ConnectionOption = {
  value: string
  label: string
}

type Phase = {
  id: string
  title: string
  range: string
  mainPoint?: string
  mainPoints?: MainPoint[]
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
  linkedEntities?: { section: EntitySection; id: string }[]
}

type EntityRecord = {
  id: string
  name: string
  era: string
  focus: string
  mainPoint?: string
  mainPoints?: MainPoint[]
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
  linkedPhases?: string[]
}

type LibraryItem = {
  title: string
  type: string
  phase: string
  status: string
  added: string
}

type MainPoint = {
  id: string
  title: string
  description: string
}

const sections: { id: SectionId; description: string }[] = [
  { id: 'Home', description: 'Start screen and shortcuts' },
  { id: 'Phases', description: 'Narratives, subphases, linked sources' },
  { id: 'Countries', description: 'Auto pages built from sources' },
  { id: 'Empires', description: 'Auto pages built from sources' },
  { id: 'People', description: 'Kings, presidents, and leaders' },
  { id: 'Places', description: 'Cities, regions, and routes' },
  { id: 'Library', description: 'All uploaded material' },
]

const entitySections: EntitySection[] = [
  'Countries',
  'Empires',
  'People',
  'Places',
]

const snippetTags: SnippetTag[] = ['evidence', 'claim', 'question']

const isEntitySectionId = (value: string): value is EntitySection =>
  entitySections.includes(value as EntitySection)

const storageKey = 'history-studio-phases-v2'

const initialPhases: Phase[] = [
  {
    id: 'renaissance',
    title: 'Renaissance and Reformation',
    range: '1450-1600',
    summary:
      'Cultural revival, religious fracture, and expanding trade routes reshape authority and knowledge across Europe and beyond.',
    webOverview:
      'Humanist education, print culture, and religious conflict grow alongside maritime expansion and state consolidation.',
    webSources: [
      'Britannica: Renaissance summary',
      'Met Museum: Renaissance timeline',
      'Library of Congress: Europe 1450-1600',
    ],
    themes: [
      'Humanism',
      'Religious reform',
      'Print networks',
      'Maritime exchange',
    ],
    questions: [
      'Which documents show shifts in religious authority?',
      'How did trade records change urban power?',
    ],
    discussion: [
      {
        role: 'ai',
        text: 'Pick a sub-theme. Do you want sources about reform, trade routes, or court culture?',
      },
      {
        role: 'you',
        text: 'I want to focus on trade networks and city power.',
      },
      {
        role: 'ai',
        text: 'Look for port ledgers, merchant letters, and period maps so we can compare ports.',
      },
    ],
    sources: [
      {
        id: 'source-1',
        title: 'Venetian port ledger',
        type: 'Ledger',
        date: '1486',
        origin: 'Venice',
        excerpt:
          'Records of spice arrivals, storage fees, and ship flags tied to annual customs payments.',
        confidence: 'OCR 92%',
        tags: ['trade', 'port'],
      },
      {
        id: 'source-2',
        title: 'Mediterranean sea map',
        type: 'Map',
        date: '1555',
        origin: 'Genoa',
        excerpt:
          'Annotated ports, hazards, and seasonal winds for merchants and pilots.',
        confidence: 'OCR 68%',
        tags: ['navigation', 'routes'],
      },
    ],
    notes: [
      {
        id: 'note-1',
        title: 'Trade volume shift in northern ports',
        evidence:
          'Ledger entries show new tax categories tied to northern shipping flags.',
        source: 'Venetian port ledger',
        status: 'Linked',
      },
      {
        id: 'note-2',
        title: 'Routes shaped by seasonal winds',
        evidence:
          'Map annotations align with seasonal routes mentioned in letters.',
        source: 'Mediterranean sea map',
        status: 'Draft',
      },
    ],
    timeline: [
      {
        date: '1453',
        title: 'Constantinople changes hands',
        detail: 'Trade routes shift toward alternative ports and sea lanes.',
      },
      {
        date: '1492',
        title: 'Atlantic crossings accelerate',
        detail: 'New routes compete with Mediterranean networks.',
      },
      {
        date: '1517',
        title: 'Religious reform begins',
        detail: 'Printing intensifies political and social debate.',
      },
    ],
    subphases: [
      {
        id: 'venice-trade',
        title: 'Venetian Trade Networks',
        range: '1470-1510',
        prompt:
          'Tell me about Venetian trade networks in the late 1400s and how they shaped port power.',
        webOverview:
          'Venice expands maritime control through convoy systems, customs policy, and merchant coordination across key Mediterranean ports.',
        webSources: [
          'Britannica: Venice trade history',
          'Venetian archives overview',
        ],
        draft:
          'Draft: Venetian maritime power relied on convoy timing, tariff policy, and port governance to secure merchant confidence. This subphase explores how records reveal shifting trade priorities.',
        readingText:
          'Excerpt: Customs fees by flag and cargo category.\nExcerpt: Map annotations for seasonal winds and routes.',
        focusPoints: [
          'Compare ledgers from different ports.',
          'Track policy changes in customs rules.',
        ],
      },
      {
        id: 'print-debate',
        title: 'Printing and Public Debate',
        range: '1500-1550',
        prompt:
          'Draft a short overview of how print culture reshaped debate during the early Reformation.',
        webOverview:
          'Print shops accelerate the spread of pamphlets, sermons, and polemics, amplifying religious disputes and civic identity.',
        webSources: [
          'Britannica: Printing press impact',
          'Stanford: Reformation overview',
        ],
        draft:
          'Draft: Print networks reorganized authority by making critique portable. Pamphlets and sermons move faster than institutions could respond, creating new publics.',
        readingText:
          'Excerpt: Pamphlet circulation records.\nExcerpt: City ordinances on press licensing.',
        focusPoints: [
          'Identify rhetoric shifts across pamphlets.',
          'Link print output to policy response.',
        ],
      },
    ],
  },
  {
    id: 'revolutions',
    title: 'Age of Revolutions',
    range: '1770-1850',
    summary:
      'Political revolutions and industrial shifts change governance, labor, and civic identity across regions.',
    webOverview:
      'Revolutions redefine citizenship and authority while industrialization reorders labor, migration, and production.',
    webSources: [
      'Britannica: Age of Revolutions',
      'Library of Congress: Revolution timelines',
      'Industrial Revolution overview',
    ],
    themes: ['Revolutionary politics', 'Industrial labor', 'Citizenship'],
    questions: [
      'Which pamphlets show popular demands?',
      'How did factory records change labor rhythms?',
    ],
    discussion: [
      {
        role: 'ai',
        text: 'Do you want to focus on speeches, factory archives, or everyday diaries?',
      },
      {
        role: 'you',
        text: 'Factory archives and how work changed.',
      },
      {
        role: 'ai',
        text: 'Bring wage books, factory rules, and worker letters for comparison.',
      },
    ],
    sources: [
      {
        id: 'source-3',
        title: 'Factory wage book',
        type: 'Ledger',
        date: '1812',
        origin: 'Manchester',
        excerpt: 'Daily wages, fines, and attendance marks by department.',
        confidence: 'OCR 90%',
        tags: ['labor', 'wages'],
      },
      {
        id: 'source-4',
        title: 'Worker petition draft',
        type: 'Letter',
        date: '1833',
        origin: 'Leeds',
        excerpt: 'Requests reduced hours and safer working conditions.',
        confidence: 'OCR 81%',
        tags: ['petition', 'labor'],
      },
    ],
    notes: [
      {
        id: 'note-3',
        title: 'Discipline through fines',
        evidence: 'Wage book lists regular penalties for tardiness.',
        source: 'Factory wage book',
        status: 'Linked',
      },
    ],
    timeline: [
      {
        date: '1776',
        title: 'Political declarations circulate',
        detail: 'Printed manifestos redefine governance expectations.',
      },
      {
        date: '1789',
        title: 'Revolutionary assemblies meet',
        detail: 'New civic language spreads through pamphlets.',
      },
      {
        date: '1804',
        title: 'Industrial expansion intensifies',
        detail: 'Manufacturing centers reshape labor and migration.',
      },
    ],
    subphases: [
      {
        id: 'french-rev',
        title: 'French Revolution',
        range: '1789-1799',
        prompt:
          'Tell me about the 1789 French Revolution and its early phases.',
        webOverview:
          'Fiscal crisis, political deadlock, and popular mobilization accelerate the fall of old regimes and the rise of new civic language.',
        webSources: [
          'Britannica: French Revolution',
          'National Archives: 1789 overview',
        ],
        draft:
          'Draft: The French Revolution begins as a fiscal and political crisis that escalates into a redefinition of sovereignty. Early phases show how assemblies, urban crowds, and printed declarations interact.',
        readingText:
          'Excerpt: Declaration of the Rights of Man and of the Citizen.\nExcerpt: Petition language from early assemblies.',
        focusPoints: [
          'Connect fiscal policy to public mobilization.',
          'Track shifts in political vocabulary.',
        ],
      },
      {
        id: 'factory-discipline',
        title: 'Factory Discipline and Reform',
        range: '1810-1830',
        prompt:
          'Draft a paper on how factory discipline shaped worker routines in early industrial Britain.',
        webOverview:
          'Factory rules standardize time, impose fines, and reshape family labor, creating new debates on reform.',
        webSources: [
          'Industrial Britain labor overview',
          'Parliamentary factory reports',
        ],
        draft:
          'Draft: Factory discipline replaces task-based labor with clock time, enforced through rules, fines, and supervision. These shifts spark petitions and reform campaigns.',
        readingText:
          'Excerpt: Factory rulebook sections on lateness.\nExcerpt: Worker petition on hours.',
        focusPoints: [
          'Compare rulebooks across mills.',
          'Link petitions to reform debates.',
        ],
      },
    ],
  },
]

const loadStoredPhases = () => {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Phase[]) : null
  } catch {
    return null
  }
}

const savePhases = (data: Phase[]) => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(storageKey, JSON.stringify(data))
}

const entityStorageKey = 'history-studio-entities-v1'
const chatsStorageKey = 'history-studio-chats-v1'

const initialEntities: Record<EntitySection, EntityRecord[]> = {
  Countries: [
    {
      id: 'country-france',
      name: 'France',
      era: '1450-1600',
      focus: 'Centralization and court culture',
      summary:
        'Royal authority grows alongside court culture, with religious conflict shaping policy and civic life.',
      tags: ['monarchy', 'religion'],
      webOverview:
        'France consolidates royal authority while religious conflicts split communities, culminating in new legal compromises.',
      webSources: ['Britannica: France 16th century', 'Europe 1500s overview'],
      subphases: [
        {
          id: 'france-wars',
          title: 'Wars of Religion',
          range: '1562-1598',
          prompt:
            'Draft a working overview of the Wars of Religion and how policy shifts changed civic life.',
          webOverview:
            'Religious conflict reshapes French governance, pushing the crown to balance authority with fragile social peace.',
          webSources: ['Britannica: French Wars of Religion'],
          draft:
            'Draft: Religious conflict forces a series of compromises as royal authority attempts to stabilize civic life.',
          readingText: 'Excerpt: Edict of Nantes provisions.',
          focusPoints: ['Trace policy changes', 'Compare court edicts'],
        },
      ],
      sources: [
        {
          id: 'france-source-1',
          title: 'Royal edict excerpt',
          type: 'Edict',
          date: '1598',
          origin: 'Paris',
          excerpt:
            'Provisions outlining limited toleration and civic order to reduce conflict.',
          confidence: 'OCR 85%',
          tags: ['policy', 'religion'],
        },
      ],
      notes: [
        {
          id: 'france-note-1',
          title: 'Policy shift toward toleration',
          evidence: 'Edict language introduces controlled tolerance.',
          source: 'Royal edict excerpt',
          status: 'Draft',
        },
      ],
      timeline: [
        {
          date: '1562',
          title: 'Religious conflict erupts',
          detail: 'Civil unrest accelerates and royal authority is tested.',
        },
        {
          date: '1598',
          title: 'Edict issued',
          detail: 'Legal compromise attempts to stabilize the kingdom.',
        },
      ],
    },
    {
      id: 'country-portugal',
      name: 'Portugal',
      era: '1500-1700',
      focus: 'Maritime routes and colonial logistics',
      summary:
        'Portugal leverages maritime routes to link ports, colonies, and trade networks across the Atlantic and Indian Oceans.',
      tags: ['navigation', 'ports'],
      webOverview:
        'Portuguese maritime expansion builds port systems and logistical control across global routes.',
      webSources: ['Britannica: Portuguese Empire', 'Atlantic trade overview'],
      subphases: [
        {
          id: 'portugal-routes',
          title: 'Maritime Logistics',
          range: '1500-1600',
          prompt:
            'Create a paper draft on Portuguese maritime logistics and port coordination.',
          webOverview:
            'Convoy systems and port taxation coordinate movement of goods across long-distance routes.',
          webSources: ['Maritime logistics overview'],
          draft:
            'Draft: Portugal develops convoy systems and port rules to secure maritime trade flow.',
          readingText: 'Excerpt: Port regulations on convoy timing.',
          focusPoints: ['Track port rules', 'Map convoy schedules'],
        },
      ],
      sources: [
        {
          id: 'portugal-source-1',
          title: 'Port regulation excerpt',
          type: 'Regulation',
          date: '1532',
          origin: 'Lisbon',
          excerpt: 'Rules for convoy timing and cargo inspection.',
          confidence: 'OCR 78%',
          tags: ['ports', 'policy'],
        },
      ],
      notes: [
        {
          id: 'portugal-note-1',
          title: 'Convoy timing enforcement',
          evidence: 'Regulations tie sailing windows to inspection cycles.',
          source: 'Port regulation excerpt',
          status: 'Linked',
        },
      ],
      timeline: [
        {
          date: '1498',
          title: 'Routes extend to India',
          detail: 'Maritime reach creates new logistics demands.',
        },
        {
          date: '1580',
          title: 'Port coordination intensifies',
          detail: 'Tax and convoy systems become standardized.',
        },
      ],
    },
  ],
  Empires: [
    {
      id: 'empire-ottoman',
      name: 'Ottoman Empire',
      era: '1450-1700',
      focus: 'Port control and taxation',
      summary:
        'Imperial governance relies on taxation, port control, and administrative registers to manage diverse territories.',
      tags: ['trade', 'law'],
      webOverview:
        'Ottoman administration integrates port taxation with imperial law to secure revenue across sea lanes.',
      webSources: ['Ottoman trade overview', 'Imperial tax records summary'],
      subphases: [
        {
          id: 'ottoman-ports',
          title: 'Port Taxation',
          range: '1500-1600',
          prompt:
            'Draft an overview of Ottoman port taxation and its impact on trade.',
          webOverview:
            'Customs registers show structured taxation tied to port governance and imperial oversight.',
          webSources: ['Ottoman port taxation overview'],
          draft:
            'Draft: Port taxation enforces imperial authority and funds maritime oversight.',
          readingText: 'Excerpt: Customs register annotations.',
          focusPoints: ['Compare tax rates', 'Track administrative reforms'],
        },
      ],
      sources: [
        {
          id: 'ottoman-source-1',
          title: 'Customs register',
          type: 'Register',
          date: '1572',
          origin: 'Istanbul',
          excerpt: 'Listed duties for cargo categories and ship flags.',
          confidence: 'OCR 82%',
          tags: ['tax', 'ports'],
        },
      ],
      notes: [
        {
          id: 'ottoman-note-1',
          title: 'Tariff categories expand',
          evidence: 'Registers show new categories for imported goods.',
          source: 'Customs register',
          status: 'Draft',
        },
      ],
      timeline: [
        {
          date: '1453',
          title: 'Capital shifts to Istanbul',
          detail: 'Administrative control over ports intensifies.',
        },
        {
          date: '1571',
          title: 'Naval conflict reshapes routes',
          detail: 'Imperial focus on sea lanes increases.',
        },
      ],
    },
    {
      id: 'empire-spanish',
      name: 'Spanish Empire',
      era: '1500-1700',
      focus: 'Maritime extraction and silver routes',
      summary:
        'Imperial wealth flows through Atlantic routes, linking mines, ports, and crown administration.',
      tags: ['shipping', 'mines'],
      webOverview:
        'Silver extraction and transatlantic routes define Spanish imperial logistics and fiscal policy.',
      webSources: ['Silver trade overview', 'Spanish Empire summary'],
      subphases: [
        {
          id: 'spanish-silver',
          title: 'Silver Routes',
          range: '1550-1650',
          prompt:
            'Draft a paper on the silver routes and their impact on imperial policy.',
          webOverview:
            'Silver shipments link colonial mines to European fiscal systems, driving imperial policy changes.',
          webSources: ['Atlantic silver routes'],
          draft:
            'Draft: Silver routes power imperial policy while exposing shipping to risk and regulation.',
          readingText: 'Excerpt: Shipping manifest for bullion cargo.',
          focusPoints: ['Trace route security', 'Link policy to revenue'],
        },
      ],
      sources: [
        {
          id: 'spanish-source-1',
          title: 'Silver shipment manifest',
          type: 'Manifest',
          date: '1624',
          origin: 'Seville',
          excerpt: 'Lists bullion loads and convoy protection rules.',
          confidence: 'OCR 79%',
          tags: ['shipping', 'silver'],
        },
      ],
      notes: [
        {
          id: 'spanish-note-1',
          title: 'Convoy protection increases',
          evidence: 'Manifest highlights escort requirements for bullion.',
          source: 'Silver shipment manifest',
          status: 'Linked',
        },
      ],
      timeline: [
        {
          date: '1545',
          title: 'Major silver deposits found',
          detail: 'Extraction reshapes imperial finances.',
        },
        {
          date: '1588',
          title: 'Naval setbacks impact routes',
          detail: 'Policy adjusts to maritime risk.',
        },
      ],
    },
  ],
  People: [
    {
      id: 'person-elizabeth',
      name: 'Elizabeth I',
      era: '1558-1603',
      focus: 'State messaging and maritime power',
      summary:
        'Royal messaging, diplomacy, and naval strategy define Elizabethan authority and public identity.',
      tags: ['monarchy', 'letters'],
      webOverview:
        'Elizabethan policy balances court authority with maritime expansion and religious settlement.',
      webSources: ['Elizabeth I overview', 'English maritime policy'],
      subphases: [
        {
          id: 'elizabeth-armada',
          title: 'Armada Campaign',
          range: '1588',
          prompt:
            'Draft a brief on the Armada campaign and its impact on royal messaging.',
          webOverview:
            'Naval conflict becomes a political stage for royal authority and public morale.',
          webSources: ['Armada campaign summary'],
          draft:
            'Draft: The Armada campaign merges naval strategy with court messaging to sustain authority.',
          readingText: 'Excerpt: Royal speech to troops.',
          focusPoints: ['Connect speech to policy', 'Compare dispatches'],
        },
      ],
      sources: [
        {
          id: 'elizabeth-source-1',
          title: 'Royal speech excerpt',
          type: 'Speech',
          date: '1588',
          origin: 'Tilbury',
          excerpt: 'Language frames leadership and national resolve.',
          confidence: 'OCR 88%',
          tags: ['speech', 'authority'],
        },
      ],
      notes: [
        {
          id: 'elizabeth-note-1',
          title: 'Messaging amplifies loyalty',
          evidence: 'Speech frames conflict as shared duty.',
          source: 'Royal speech excerpt',
          status: 'Draft',
        },
      ],
      timeline: [
        {
          date: '1558',
          title: 'Elizabeth assumes the throne',
          detail: 'Religious settlement shapes policy.',
        },
        {
          date: '1588',
          title: 'Armada confrontation',
          detail: 'Naval conflict defines public narrative.',
        },
      ],
    },
    {
      id: 'person-akbar',
      name: 'Akbar',
      era: '1556-1605',
      focus: 'Administrative reform and cultural policy',
      summary:
        'Administrative reform and cultural policy establish long-lasting structures for imperial governance.',
      tags: ['policy', 'court'],
      webOverview:
        'Akbar expands administrative reach through fiscal reform and cultural integration.',
      webSources: ['Mughal administration overview'],
      subphases: [
        {
          id: 'akbar-reforms',
          title: 'Revenue Reform',
          range: '1570-1590',
          prompt:
            "Draft a paper on Akbar's revenue reforms and their administrative impact.",
          webOverview:
            'Standardized revenue systems strengthen imperial oversight and tax fairness.',
          webSources: ['Akbar revenue reforms'],
          draft:
            'Draft: Revenue reforms unify tax systems and expand state authority.',
          readingText: 'Excerpt: Tax register notes.',
          focusPoints: ['Compare tax cycles', 'Link reforms to stability'],
        },
      ],
      sources: [
        {
          id: 'akbar-source-1',
          title: 'Revenue register excerpt',
          type: 'Register',
          date: '1582',
          origin: 'Agra',
          excerpt: 'Lists standardized assessments across districts.',
          confidence: 'OCR 80%',
          tags: ['revenue', 'administration'],
        },
      ],
      notes: [
        {
          id: 'akbar-note-1',
          title: 'Standardization increases oversight',
          evidence: 'Register shows uniform tax categories.',
          source: 'Revenue register excerpt',
          status: 'Linked',
        },
      ],
      timeline: [
        {
          date: '1556',
          title: 'Akbar takes power',
          detail: 'Imperial administration expands.',
        },
        {
          date: '1580',
          title: 'Revenue reforms mature',
          detail: 'Tax systems standardized across regions.',
        },
      ],
    },
  ],
  Places: [
    {
      id: 'place-venice',
      name: 'Venice',
      era: '1450-1600',
      focus: 'Port governance and customs records',
      summary:
        'Venice coordinates trade networks through port governance, customs policy, and maritime routes.',
      tags: ['port', 'ledger'],
      webOverview:
        'Venice manages maritime trade with layered customs rules and convoy coordination.',
      webSources: ['Venice trade overview'],
      subphases: [
        {
          id: 'venice-customs',
          title: 'Customs Administration',
          range: '1470-1520',
          prompt:
            'Draft a summary of Venetian customs administration and port governance.',
          webOverview:
            'Customs offices log cargo categories and coordinate port fees across merchant fleets.',
          webSources: ['Venice customs records'],
          draft:
            'Draft: Customs administration secures port revenue and controls trade flow.',
          readingText: 'Excerpt: Customs ledger entries.',
          focusPoints: ['Compare fee categories', 'Map ship flags'],
        },
      ],
      sources: [
        {
          id: 'venice-source-1',
          title: 'Customs ledger',
          type: 'Ledger',
          date: '1490',
          origin: 'Venice',
          excerpt: 'Logs ship flags and cargo duties.',
          confidence: 'OCR 91%',
          tags: ['customs', 'port'],
        },
      ],
      notes: [
        {
          id: 'venice-note-1',
          title: 'Fees rise for northern ships',
          evidence: 'Ledger shows higher duties for northern flags.',
          source: 'Customs ledger',
          status: 'Draft',
        },
      ],
      timeline: [
        {
          date: '1450',
          title: 'Port systems expand',
          detail: 'Customs offices track more cargo categories.',
        },
        {
          date: '1500',
          title: 'Merchant networks diversify',
          detail: 'New routes increase port complexity.',
        },
      ],
    },
    {
      id: 'place-lisbon',
      name: 'Lisbon',
      era: '1500-1700',
      focus: 'Shipping manifests and imperial cargo',
      summary:
        'Lisbon serves as a transatlantic hub where shipping manifests record imperial cargo flow.',
      tags: ['shipping', 'ports'],
      webOverview:
        'Lisbon coordinates imperial shipments with detailed manifests and port administration.',
      webSources: ['Lisbon port history'],
      subphases: [
        {
          id: 'lisbon-manifests',
          title: 'Manifest Networks',
          range: '1600-1680',
          prompt:
            'Draft an overview of Lisbon shipping manifests and imperial cargo flow.',
          webOverview:
            'Manifests document cargo types, taxes, and convoy coordination.',
          webSources: ['Lisbon manifest archive'],
          draft:
            'Draft: Manifests reveal the administrative flow of goods through Lisbon.',
          readingText: 'Excerpt: Manifest listings for cargo holds.',
          focusPoints: ['Link cargo to taxes', 'Trace convoy scheduling'],
        },
      ],
      sources: [
        {
          id: 'lisbon-source-1',
          title: 'Port manifest excerpt',
          type: 'Manifest',
          date: '1655',
          origin: 'Lisbon',
          excerpt: 'Lists cargo types, tonnage, and duty entries.',
          confidence: 'OCR 83%',
          tags: ['shipping', 'cargo'],
        },
      ],
      notes: [
        {
          id: 'lisbon-note-1',
          title: 'Cargo categories expand',
          evidence: 'Manifest indicates new categories for colonial goods.',
          source: 'Port manifest excerpt',
          status: 'Linked',
        },
      ],
      timeline: [
        {
          date: '1580',
          title: 'Shipping volumes increase',
          detail: 'Lisbon becomes a primary imperial hub.',
        },
        {
          date: '1640',
          title: 'Administration reforms',
          detail: 'Manifest systems become more detailed.',
        },
      ],
    },
  ],
}

const loadStoredEntities = () => {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.localStorage.getItem(entityStorageKey)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    return parsed as Record<EntitySection, EntityRecord[]>
  } catch {
    return null
  }
}

const saveEntities = (data: Record<EntitySection, EntityRecord[]>) => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(entityStorageKey, JSON.stringify(data))
}

const connectionsStorageKey = 'history-studio-connections-v1'

const loadStoredConnections = () => {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.localStorage.getItem(connectionsStorageKey)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Connection[]) : null
  } catch {
    return null
  }
}

const saveConnections = (data: Connection[]) => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(connectionsStorageKey, JSON.stringify(data))
}

const buildEntitySelection = (data: Record<EntitySection, EntityRecord[]>) => ({
  Countries: data.Countries[0]?.id ?? '',
  Empires: data.Empires[0]?.id ?? '',
  People: data.People[0]?.id ?? '',
  Places: data.Places[0]?.id ?? '',
})

const isEntitySection = (section: SectionId): section is EntitySection =>
  section !== 'Home' && section !== 'Phases' && section !== 'Library'

const libraryItems: LibraryItem[] = [
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

const phaseTabs: PhaseTab[] = ['Overview', 'Subphases', 'Sources']

const entityTabs: EntityTab[] = ['Overview', 'Subphases', 'Sources']

const animateStyle = (delayMs: number) =>
  ({
    '--delay': `${delayMs}ms`,
  }) as CSSProperties

const buildPhaseAiContext = (
  phase: Phase,
  subphase?: Subphase,
): AiContext => ({
  kind: 'phase',
  scope: subphase ? 'subphase' : 'summary',
  title: phase.title,
  range: phase.range,
  focus: buildMainPointFocus(phase.mainPoints, phase.mainPoint),
  summary: phase.summary,
  prompt: subphase?.prompt,
  draft: subphase?.draft,
  readingText: subphase?.readingText,
})

const buildEntityAiContext = (
  entity: EntityRecord,
  subphase?: Subphase,
): AiContext => ({
  kind: 'entity',
  scope: subphase ? 'subphase' : 'summary',
  title: entity.name,
  range: entity.era,
  focus: buildMainPointFocus(entity.mainPoints, entity.mainPoint || entity.focus),
  summary: entity.summary,
  prompt: subphase?.prompt,
  draft: subphase?.draft,
  readingText: subphase?.readingText,
})

const extractJsonObject = (text: string) => {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < 0 || end <= start) {
    return null
  }
  const slice = text.slice(start, end + 1)
  try {
    return JSON.parse(slice)
  } catch {
    return null
  }
}

const parsePhaseSetup = (text: string): PhaseSetup | null => {
  if (!text) {
    return null
  }
  const parsed = extractJsonObject(text)
  if (!parsed || typeof parsed !== 'object') {
    return null
  }
  const value = parsed as Record<string, unknown>
  const pickString = (key: string) =>
    typeof value[key] === 'string' ? value[key].trim() : undefined
  const pickList = (key: string) =>
    Array.isArray(value[key])
      ? value[key]
          .filter((item) => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined
  return {
    title: pickString('title'),
    range: pickString('range'),
    summary: pickString('summary'),
    subphaseTitle: pickString('subphaseTitle'),
    subphaseRange: pickString('subphaseRange'),
    subphasePrompt: pickString('subphasePrompt'),
    themes: pickList('themes'),
    questions: pickList('questions'),
  }
}

const deriveLegacyMainPoint = (text: string): MainPoint => {
  const trimmed = text.trim()
  const firstSentence = trimmed.split(/[.!?]/)[0]?.trim() ?? ''
  const title =
    firstSentence.slice(0, 80) || trimmed.slice(0, 80) || 'Main point'
  return {
    id: 'main-point-legacy',
    title,
    description: trimmed,
  }
}

const normalizeMainPoints = (
  record?: { mainPoints?: MainPoint[]; mainPoint?: string },
): MainPoint[] => {
  if (!record) {
    return []
  }
  if (record.mainPoints && record.mainPoints.length) {
    return record.mainPoints
  }
  if (record.mainPoint && record.mainPoint.trim()) {
    return [deriveLegacyMainPoint(record.mainPoint)]
  }
  return []
}

const buildMainPointFocus = (
  mainPoints?: MainPoint[],
  fallback?: string,
) => {
  const primary = mainPoints?.find(
    (point) => point.title.trim() || point.description.trim(),
  )
  if (primary) {
    const title = primary.title.trim()
    const description = primary.description.trim()
    if (title && description) {
      return `${title}: ${description}`
    }
    return title || description
  }
  return fallback
}

const parseSubphaseSetup = (text: string): SubphaseSetup | null => {
  if (!text) {
    return null
  }
  const parsed = extractJsonObject(text)
  if (!parsed || typeof parsed !== 'object') {
    return null
  }
  const value = parsed as Record<string, unknown>
  const pickString = (key: string) =>
    typeof value[key] === 'string' ? value[key].trim() : undefined
  return {
    title: pickString('title'),
    range: pickString('range'),
    prompt: pickString('prompt'),
  }
}

const connectionRelations: ConnectionRelation[] = [
  'relates',
  'influences',
  'contrasts',
  'supports',
]

const buildConnectionNodeId = (node: ConnectionNode) => {
  switch (node.kind) {
    case 'phase':
      return `phase:${node.phaseId}`
    case 'phase-subphase':
      return `phase-sub:${node.phaseId}:${node.subphaseId}`
    case 'entity':
      return `entity:${node.section}:${node.entityId}`
    case 'entity-subphase':
      return `entity-sub:${node.section}:${node.entityId}:${node.subphaseId}`
    default:
      return ''
  }
}

const parseConnectionNodeId = (value: string): ConnectionNode | null => {
  if (!value) {
    return null
  }
  const parts = value.split(':')
  const [kind, first, second, third] = parts
  if (kind === 'phase' && first) {
    return { kind: 'phase', phaseId: first }
  }
  if (kind === 'phase-sub' && first && second) {
    return { kind: 'phase-subphase', phaseId: first, subphaseId: second }
  }
  if (kind === 'entity' && first && second && isEntitySectionId(first)) {
    return { kind: 'entity', section: first, entityId: second }
  }
  if (kind === 'entity-sub' && first && second && third && isEntitySectionId(first)) {
    return {
      kind: 'entity-subphase',
      section: first,
      entityId: second,
      subphaseId: third,
    }
  }
  return null
}

const resolveConnectionNode = (
  node: ConnectionNode,
  phases: Phase[],
  entities: Record<EntitySection, EntityRecord[]>,
) => {
  if (node.kind === 'phase') {
    const phase = phases.find((item) => item.id === node.phaseId)
    return {
      label: phase?.title ?? 'Unknown phase',
      meta: phase?.range ?? '',
    }
  }
  if (node.kind === 'phase-subphase') {
    const phase = phases.find((item) => item.id === node.phaseId)
    const subphase = phase?.subphases.find(
      (item) => item.id === node.subphaseId,
    )
    return {
      label: subphase?.title ?? 'Unknown subphase',
      meta: phase ? `Phase: ${phase.title}` : '',
    }
  }
  if (node.kind === 'entity') {
    const entity = entities[node.section].find(
      (item) => item.id === node.entityId,
    )
    return {
      label: entity?.name ?? 'Unknown entry',
      meta: entity?.era ?? '',
    }
  }
  const entity = entities[node.section].find(
    (item) => item.id === node.entityId,
  )
  const subphase = entity?.subphases.find(
    (item) => item.id === node.subphaseId,
  )
  return {
    label: subphase?.title ?? 'Unknown subphase',
    meta: entity ? `Entry: ${entity.name}` : '',
  }
}

const buildLegacyConnections = (
  phases: Phase[],
): Connection[] => {
  const connections: Connection[] = []
  phases.forEach((phase) => {
    const links = phase.linkedEntities ?? []
    links.forEach((link) => {
      connections.push({
        id: `connection-${phase.id}-${link.section}-${link.id}`,
        from: { kind: 'phase', phaseId: phase.id },
        to: { kind: 'entity', section: link.section, entityId: link.id },
        relation: 'relates',
        note: '',
        createdAt: 'Legacy',
      })
    })
  })
  return connections
}

const formatFileSize = (size?: number) => {
  if (!size || size <= 0) {
    return ''
  }
  if (size < 1024) {
    return `${size} B`
  }
  const kb = size / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }
  return `${(kb / 1024).toFixed(1)} MB`
}

function App() {
  const [navOpen, setNavOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = window.localStorage.getItem('history-studio-theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const syncUrl = (import.meta.env.VITE_SYNC_URL || '')
    .trim()
    .replace(/\/+$/, '')
  const syncToken = (import.meta.env.VITE_SYNC_TOKEN || '').trim()
  const syncEnabled = Boolean(syncUrl)
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >(syncEnabled ? 'loading' : 'idle')
  const [phaseData, setPhaseData] = useState<Phase[]>(initialPhases)
  const [hasLoadedPhases, setHasLoadedPhases] = useState(false)
  const [entityData, setEntityData] =
    useState<Record<EntitySection, EntityRecord[]>>(initialEntities)
  const [hasLoadedEntities, setHasLoadedEntities] = useState(false)
  const [entitySelection, setEntitySelection] = useState<
    Record<EntitySection, string>
  >(buildEntitySelection(initialEntities))
  const [activeSection, setActiveSection] = useState<SectionId>('Home')
  const [selectedPhaseId, setSelectedPhaseId] = useState(
    initialPhases[0]?.id ?? '',
  )
  const [selectedSubphaseId, setSelectedSubphaseId] = useState(
    initialPhases[0].subphases[0]?.id ?? '',
  )
  const [activePhaseTab, setActivePhaseTab] =
    useState<PhaseTab>('Overview')
  const [activeEntityTab, setActiveEntityTab] =
    useState<EntityTab>('Overview')
  const [workspaceView, setWorkspaceView] = useState<
    'two-column' | 'focus'
  >('two-column')
  const [workspaceChatScope, setWorkspaceChatScope] = useState<
    'summary' | 'subphase'
  >('subphase')
  const [workspaceChatInput, setWorkspaceChatInput] = useState('')
  const [workspaceChats, setWorkspaceChats] = useState<
    Record<string, DiscussionLine[]>
  >(() => {
    const stored = window.localStorage.getItem(chatsStorageKey)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return {}
      }
    }
    return {}
  })
  const [selectedEntitySubphaseId, setSelectedEntitySubphaseId] = useState(
    initialEntities.Countries[0]?.subphases[0]?.id ?? '',
  )
  const [isAddingSubphase, setIsAddingSubphase] = useState(false)
  const [subphaseForm, setSubphaseForm] = useState({
    prompt: '',
  })
  const [isCreatingSubphase, setIsCreatingSubphase] = useState(false)
  const [isAddingEntitySubphase, setIsAddingEntitySubphase] = useState(false)
  const [entitySubphaseForm, setEntitySubphaseForm] = useState({
    prompt: '',
  })
  const [isCreatingEntitySubphase, setIsCreatingEntitySubphase] =
    useState(false)
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false)
  const [phaseForm, setPhaseForm] = useState({
    prompt: '',
  })
  const [isCreatingPhase, setIsCreatingPhase] = useState(false)
  const [isNarrativeDrafting, setIsNarrativeDrafting] = useState(false)
  const [isNarrativeRefining, setIsNarrativeRefining] = useState(false)
  const [narrativePrompt, setNarrativePrompt] = useState('')
  const [snippetDraft, setSnippetDraft] = useState('')
  const [snippetTag, setSnippetTag] = useState<SnippetTag>('evidence')
  const [isSubphaseLocked, setIsSubphaseLocked] = useState(false)
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false)
  const [entityForm, setEntityForm] = useState({
    prompt: '',
  })
  const [isCreatingEntity, setIsCreatingEntity] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false)
  const [sourceForm, setSourceForm] = useState({
    title: '',
    type: 'Document',
    date: '',
    origin: '',
    excerpt: '',
    tags: '',
    fileName: '',
    fileType: '',
    fileSize: 0,
    fileData: '',
  })
  const [connections, setConnections] = useState<Connection[]>([])
  const [hasLoadedConnections, setHasLoadedConnections] = useState(false)
  const [connectionForm, setConnectionForm] = useState({
    from: '',
    to: '',
    relation: 'relates' as ConnectionRelation,
    note: '',
  })
  const [showGraph, setShowGraph] = useState(false)

  const workspaceNarrativeRef = useRef<HTMLTextAreaElement | null>(null)
  const lastOverviewPathRef = useRef('/')
  const syncTimerRef = useRef<number | null>(null)
  const isApplyingRemoteRef = useRef(false)
  const { addToast } = useToast()
  const location = useLocation()

  const selectedPhase = phaseData.find(
    (phase) => phase.id === selectedPhaseId,
  )
  const selectedSubphase =
    selectedPhase?.subphases.find(
      (subphase) => subphase.id === selectedSubphaseId,
    ) ?? selectedPhase?.subphases[0]

  const selectedEntityId = isEntitySection(activeSection)
    ? entitySelection[activeSection]
    : ''
  const selectedEntity = isEntitySection(activeSection)
    ? entityData[activeSection].find(
        (entity) => entity.id === selectedEntityId,
      )
    : null
  const selectedEntitySubphase =
    selectedEntity?.subphases.find(
      (subphase) => subphase.id === selectedEntitySubphaseId,
    ) ?? selectedEntity?.subphases[0]

  const navigate = useNavigate()
  const phaseMatch = useMatch('/workspace/phase/:phaseId')
  const entityMatch = useMatch('/workspace/entity/:section/:entityId')
  const workspaceContext: WorkspaceContext | null = phaseMatch?.params.phaseId
    ? { kind: 'phase', id: phaseMatch.params.phaseId }
    : entityMatch?.params.section &&
      entityMatch.params.entityId &&
      isEntitySectionId(entityMatch.params.section)
    ? {
        kind: 'entity',
        section: entityMatch.params.section,
        id: entityMatch.params.entityId,
      }
    : null
  const isWorkspaceRoute = Boolean(phaseMatch || entityMatch)

  const workspacePhase =
    workspaceContext?.kind === 'phase'
      ? phaseData.find((phase) => phase.id === workspaceContext.id)
      : null
  const workspaceEntity =
    workspaceContext?.kind === 'entity'
      ? entityData[workspaceContext.section].find(
          (entity) => entity.id === workspaceContext.id,
        )
      : null
  const workspaceTitle =
    workspacePhase?.title ?? workspaceEntity?.name ?? 'Workspace'
  const workspaceRange =
    workspacePhase?.range ?? workspaceEntity?.era ?? 'Range'
  const workspaceSummary =
    workspacePhase?.summary ?? workspaceEntity?.summary ?? ''
  const workspaceWebOverview =
    workspacePhase?.webOverview ?? workspaceEntity?.webOverview ?? ''
  const workspaceWebSources =
    workspacePhase?.webSources ?? workspaceEntity?.webSources ?? []
  const workspaceSources =
    workspacePhase?.sources ?? workspaceEntity?.sources ?? []
  const workspaceMainPoints = useMemo(() => {
    if (workspaceContext?.kind === 'phase') {
      return normalizeMainPoints(workspacePhase)
    }
    if (workspaceContext?.kind === 'entity') {
      return normalizeMainPoints(workspaceEntity)
    }
    return []
  }, [workspaceContext, workspacePhase, workspaceEntity])
  const workspaceSubphases =
    workspacePhase?.subphases ?? workspaceEntity?.subphases ?? []
  const workspaceHighlights =
    workspacePhase?.narrativeHighlights ??
    workspaceEntity?.narrativeHighlights ??
    []
  const workspaceSnippets =
    workspacePhase?.narrativeSnippets ??
    workspaceEntity?.narrativeSnippets ??
    []
  const workspaceVersions =
    workspacePhase?.narrativeVersions ??
    workspaceEntity?.narrativeVersions ??
    []
  const workspaceSelectedSubphase =
    workspaceContext?.kind === 'phase'
      ? workspaceSubphases.find(
          (subphase) => subphase.id === selectedSubphaseId,
        ) ?? workspaceSubphases[0]
      : workspaceContext?.kind === 'entity'
      ? workspaceSubphases.find(
          (subphase) => subphase.id === selectedEntitySubphaseId,
        ) ?? workspaceSubphases[0]
      : undefined
  const workspaceKindLabel =
    workspaceContext?.kind === 'entity'
      ? workspaceContext.section
      : workspaceContext?.kind === 'phase'
      ? 'Phase'
      : 'Workspace'
  const workspaceChatScopeResolved =
    (isSubphaseLocked || workspaceChatScope === 'subphase') &&
    workspaceSelectedSubphase
      ? 'subphase'
      : 'summary'
  const workspaceChatKey = workspaceContext
    ? workspaceContext.kind === 'phase'
      ? `phase:${workspaceContext.id}:${
          workspaceChatScopeResolved === 'subphase'
            ? workspaceSelectedSubphase?.id ?? 'summary'
            : 'summary'
        }`
      : `entity:${workspaceContext.section}:${workspaceContext.id}:${
          workspaceChatScopeResolved === 'subphase'
            ? workspaceSelectedSubphase?.id ?? 'summary'
            : 'summary'
        }`
    : null
  const workspaceChat = workspaceChatKey
    ? workspaceChats[workspaceChatKey] ?? []
    : []
  const workspaceChatLabel =
    workspaceChatScopeResolved === 'summary'
      ? `${workspaceTitle} summary`
      : workspaceSelectedSubphase?.title ?? 'Subphase'
  const isWorkspaceView = isWorkspaceRoute

  const buildSyncHeaders = (includeJson = true) => {
    const headers: Record<string, string> = {}
    if (includeJson) {
      headers['Content-Type'] = 'application/json'
    }
    if (syncToken) {
      headers.Authorization = `Bearer ${syncToken}`
    }
    return headers
  }

  const resolveSyncFileUrl = (fileUrl?: string) => {
    if (!fileUrl) return ''
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl
    }
    if (!syncUrl) {
      return fileUrl
    }
    return `${syncUrl}${fileUrl}`
  }

  const connectionOptionGroups = useMemo(() => {
    const phaseOptions: ConnectionOption[] = phaseData.map((phase) => ({
      value: buildConnectionNodeId({ kind: 'phase', phaseId: phase.id }),
      label: `${phase.title} (${phase.range})`,
    }))
    const phaseSubphaseOptions: ConnectionOption[] = phaseData.flatMap(
      (phase) =>
        phase.subphases.map((subphase) => ({
          value: buildConnectionNodeId({
            kind: 'phase-subphase',
            phaseId: phase.id,
            subphaseId: subphase.id,
          }),
          label: `${subphase.title} - ${phase.title}`,
        })),
    )
    const entityOptions: Record<EntitySection, ConnectionOption[]> =
      entitySections.reduce(
        (acc, section) => ({
          ...acc,
          [section]: entityData[section].map((entity) => ({
            value: buildConnectionNodeId({
              kind: 'entity',
              section,
              entityId: entity.id,
            }),
            label: `${entity.name} (${entity.era})`,
          })),
        }),
        {} as Record<EntitySection, ConnectionOption[]>,
      )
    const entitySubphaseOptions: Record<EntitySection, ConnectionOption[]> =
      entitySections.reduce(
        (acc, section) => ({
          ...acc,
          [section]: entityData[section].flatMap((entity) =>
            entity.subphases.map((subphase) => ({
              value: buildConnectionNodeId({
                kind: 'entity-subphase',
                section,
                entityId: entity.id,
                subphaseId: subphase.id,
              }),
              label: `${subphase.title} - ${entity.name}`,
            })),
          ),
        }),
        {} as Record<EntitySection, ConnectionOption[]>,
      )
    return {
      phaseOptions,
      phaseSubphaseOptions,
      entityOptions,
      entitySubphaseOptions,
    }
  }, [entityData, phaseData])

  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    connections.forEach((connection) => {
      const fromId = buildConnectionNodeId(connection.from)
      const toId = buildConnectionNodeId(connection.to)
      counts.set(fromId, (counts.get(fromId) ?? 0) + 1)
      counts.set(toId, (counts.get(toId) ?? 0) + 1)
    })
    return counts
  }, [connections])

  const getConnectionCount = useCallback(
    (node: ConnectionNode) =>
      connectionCounts.get(buildConnectionNodeId(node)) ?? 0,
    [connectionCounts],
  )

  const phaseCount = phaseData.length
  const phaseSubphaseCount = phaseData.reduce(
    (sum, phase) => sum + phase.subphases.length,
    0,
  )
  const entityCounts = entitySections.reduce(
    (acc, section) => ({
      ...acc,
      [section]: entityData[section].length,
    }),
    {} as Record<EntitySection, number>,
  )

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('history-studio-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!syncEnabled) {
      return
    }
    let cancelled = false
    const loadRemote = async () => {
      setSyncStatus('loading')
      try {
        const response = await fetch(`${syncUrl}/api/sync`, {
          headers: buildSyncHeaders(false),
        })
        if (!response.ok) {
          throw new Error('Sync unavailable')
        }
        const payload = await response.json()
        if (cancelled) {
          return
        }
        if (payload?.updatedAt) {
          isApplyingRemoteRef.current = true
          if (Array.isArray(payload.phases)) {
            setPhaseData(payload.phases)
            setSelectedPhaseId(payload.phases[0]?.id ?? '')
            setSelectedSubphaseId(payload.phases[0]?.subphases[0]?.id ?? '')
            setHasLoadedPhases(true)
          }
          if (payload.entities && typeof payload.entities === 'object') {
            setEntityData(payload.entities)
            setEntitySelection(buildEntitySelection(payload.entities))
            setSelectedEntitySubphaseId(
              payload.entities.Countries?.[0]?.subphases[0]?.id ?? '',
            )
            setHasLoadedEntities(true)
          }
          if (payload.chats && typeof payload.chats === 'object') {
            setWorkspaceChats(payload.chats)
          }
          if (Array.isArray(payload.connections)) {
            setConnections(payload.connections)
            setHasLoadedConnections(true)
          }
          if (payload.theme === 'light' || payload.theme === 'dark') {
            setTheme(payload.theme)
          }
        }
        setSyncStatus('ready')
      } catch (error) {
        console.warn(error)
        if (!cancelled) {
          setSyncStatus('error')
        }
      }
    }
    loadRemote()
    return () => {
      cancelled = true
    }
  }, [syncEnabled, syncUrl, syncToken])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  useEffect(() => {
    const stored = loadStoredPhases()
    // null means no data in localStorage (first visit) - keep initial sample data
    // empty array means user deleted everything - respect that choice
    if (stored === null) {
      setHasLoadedPhases(true)
      return
    }
    setPhaseData(stored)
    setSelectedPhaseId(stored[0]?.id ?? '')
    setSelectedSubphaseId(stored[0]?.subphases[0]?.id ?? '')
    setHasLoadedPhases(true)
  }, [])

  useEffect(() => {
    // Only save after initial load to avoid overwriting stored data
    if (!hasLoadedPhases) {
      return
    }
    savePhases(phaseData)
  }, [phaseData, hasLoadedPhases])

  // Persist workspace chats to localStorage
  useEffect(() => {
    if (Object.keys(workspaceChats).length > 0) {
      window.localStorage.setItem(chatsStorageKey, JSON.stringify(workspaceChats))
    }
  }, [workspaceChats])

  useEffect(() => {
    if (!selectedPhase) {
      return
    }
    const hasPhase = phaseData.some((phase) => phase.id === selectedPhaseId)
    if (!hasPhase) {
      setSelectedPhaseId(phaseData[0]?.id ?? '')
      return
    }
    const hasSubphase = selectedPhase.subphases.some(
      (subphase) => subphase.id === selectedSubphaseId,
    )
    if (!hasSubphase) {
      setSelectedSubphaseId(selectedPhase.subphases[0]?.id ?? '')
    }
  }, [phaseData, selectedPhaseId, selectedSubphaseId, selectedPhase])

  useEffect(() => {
    const stored = loadStoredEntities()
    if (!stored) {
      setHasLoadedEntities(true)
      return
    }
    setEntityData(stored)
    setEntitySelection(buildEntitySelection(stored))
    setSelectedEntitySubphaseId(
      stored.Countries[0]?.subphases[0]?.id ?? '',
    )
    setHasLoadedEntities(true)
  }, [])

  useEffect(() => {
    // Only save after initial load to avoid overwriting stored data
    if (!hasLoadedEntities) {
      return
    }
    saveEntities(entityData)
  }, [entityData, hasLoadedEntities])

  useEffect(() => {
    if (hasLoadedConnections) {
      return
    }
    const stored = loadStoredConnections()
    if (stored) {
      setConnections(stored)
      setHasLoadedConnections(true)
      return
    }
    if (!hasLoadedPhases) {
      return
    }
    const legacy = buildLegacyConnections(phaseData)
    if (legacy.length) {
      setConnections(legacy)
    }
    setHasLoadedConnections(true)
  }, [hasLoadedConnections, hasLoadedPhases, phaseData])

  useEffect(() => {
    if (!hasLoadedConnections) {
      return
    }
    saveConnections(connections)
  }, [connections, hasLoadedConnections])

  useEffect(() => {
    if (!syncEnabled || syncStatus !== 'ready') {
      return
    }
    if (isApplyingRemoteRef.current) {
      isApplyingRemoteRef.current = false
      return
    }
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current)
    }
    syncTimerRef.current = window.setTimeout(() => {
      const payload = {
        phases: phaseData,
        entities: entityData,
        chats: workspaceChats,
        connections,
        theme,
      }
      fetch(`${syncUrl}/api/sync`, {
        method: 'POST',
        headers: buildSyncHeaders(),
        body: JSON.stringify(payload),
      }).catch((error) => {
        console.warn('Sync failed', error)
      })
    }, 800)
    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current)
      }
    }
  }, [
    connections,
    entityData,
    phaseData,
    syncEnabled,
    syncStatus,
    syncUrl,
    theme,
    workspaceChats,
  ])

  useEffect(() => {
    if (isSubphaseLocked && !workspaceSelectedSubphase) {
      setIsSubphaseLocked(false)
    }
  }, [isSubphaseLocked, workspaceSelectedSubphase])

  useEffect(() => {
    if (!isWorkspaceRoute) {
      return
    }
    setNavOpen(false)
    if (!workspaceContext) {
      navigate('/', { replace: true })
      return
    }
    if (workspaceContext.kind === 'phase') {
      if (!hasLoadedPhases) {
        return
      }
      if (!workspacePhase) {
        navigate('/', { replace: true })
        return
      }
      setActiveSection('Phases')
      setSelectedPhaseId(workspacePhase.id)
      const hasSubphase = workspacePhase.subphases.some(
        (subphase) => subphase.id === selectedSubphaseId,
      )
      if (!hasSubphase) {
        setSelectedSubphaseId(workspacePhase.subphases[0]?.id ?? '')
      }
      return
    }
    if (!hasLoadedEntities) {
      return
    }
    if (!workspaceEntity) {
      navigate('/', { replace: true })
      return
    }
    setActiveSection(workspaceContext.section)
    setEntitySelection((prev) => ({
      ...prev,
      [workspaceContext.section]: workspaceEntity.id,
    }))
    const hasSubphase = workspaceEntity.subphases.some(
      (subphase) => subphase.id === selectedEntitySubphaseId,
    )
    if (!hasSubphase) {
      setSelectedEntitySubphaseId(workspaceEntity.subphases[0]?.id ?? '')
    }
  }, [
    hasLoadedEntities,
    hasLoadedPhases,
    isWorkspaceRoute,
    navigate,
    selectedEntitySubphaseId,
    selectedSubphaseId,
    workspaceContext,
    workspaceEntity,
    workspacePhase,
  ])

  useEffect(() => {
    if (!isWorkspaceRoute) {
      lastOverviewPathRef.current = `${location.pathname}${location.search}${location.hash}`
    }
  }, [
    isWorkspaceRoute,
    location.pathname,
    location.search,
    location.hash,
  ])

  useEffect(() => {
    if (!isWorkspaceView) {
      return
    }
    if (!workspaceSelectedSubphase) {
      setWorkspaceChatScope('summary')
    }
  }, [isWorkspaceView, workspaceSelectedSubphase])

  useEffect(() => {
    if (!isEntitySection(activeSection)) {
      return
    }
    const list = entityData[activeSection]
    const currentId = entitySelection[activeSection]
    if (list.some((entity) => entity.id === currentId)) {
      return
    }
    setEntitySelection((prev) => ({
      ...prev,
      [activeSection]: list[0]?.id ?? '',
    }))
  }, [activeSection, entityData, entitySelection])

  useEffect(() => {
    if (!selectedEntity) {
      return
    }
    const hasSubphase = selectedEntity.subphases.some(
      (subphase) => subphase.id === selectedEntitySubphaseId,
    )
    if (!hasSubphase) {
      setSelectedEntitySubphaseId(selectedEntity.subphases[0]?.id ?? '')
    }
  }, [selectedEntity, selectedEntitySubphaseId])

  const updatePhase = (phaseId: string, updates: Partial<Phase>) => {
    setPhaseData((prev) =>
      prev.map((phase) =>
        phase.id === phaseId ? { ...phase, ...updates } : phase,
      ),
    )
  }

  const updateSubphase = (
    phaseId: string,
    subphaseId: string,
    updates: Partial<Subphase>,
  ) => {
    setPhaseData((prev) =>
      prev.map((phase) => {
        if (phase.id !== phaseId) {
          return phase
        }
        return {
          ...phase,
          subphases: phase.subphases.map((subphase) =>
            subphase.id === subphaseId
              ? { ...subphase, ...updates }
              : subphase,
          ),
        }
      }),
    )
  }

  const updateSelectedSubphase = (updates: Partial<Subphase>) => {
    if (!selectedPhase || !selectedSubphase) {
      return
    }
    updateSubphase(selectedPhase.id, selectedSubphase.id, updates)
  }

  const removeConnectionsForNodes = useCallback((nodeIds: string[]) => {
    if (!nodeIds.length) {
      return
    }
    setConnections((prev) =>
      prev.filter((connection) => {
        const fromId = buildConnectionNodeId(connection.from)
        const toId = buildConnectionNodeId(connection.to)
        return !nodeIds.includes(fromId) && !nodeIds.includes(toId)
      }),
    )
  }, [])

  const handleAddSubphase = async () => {
    if (!selectedPhase) {
      return
    }
    const prompt = subphaseForm.prompt.trim()
    if (!prompt) {
      return
    }
    setIsCreatingSubphase(true)
    try {
      const context: AiContext = {
        kind: 'phase',
        scope: 'subphase',
        title: selectedPhase.title,
        range: selectedPhase.range,
        summary: selectedPhase.summary,
        prompt,
      }
      const aiText = await requestAi('setup', context, { message: prompt })
      const parsed = parseSubphaseSetup(aiText)
      const fallbackTitle =
        prompt.length > 60 ? 'New subphase' : prompt
      const title = parsed?.title || fallbackTitle
      const range = parsed?.range || selectedPhase.range
      const nextPrompt =
        parsed?.prompt ||
        `Tell me about ${title} (${range}) and draft a working overview.`
      const id = `subphase-${Date.now()}`
      const newSubphase: Subphase = {
        id,
        title,
        range,
        prompt: nextPrompt,
        webOverview: 'Web brief pending.',
        webSources: [],
        draft: '',
        readingText: '',
        focusPoints: [],
      }
      setPhaseData((prev) =>
        prev.map((phase) =>
          phase.id === selectedPhase.id
            ? { ...phase, subphases: [newSubphase, ...phase.subphases] }
            : phase,
        ),
      )
      setSelectedSubphaseId(id)
      setSubphaseForm({ prompt: '' })
      setIsAddingSubphase(false)
    } finally {
      setIsCreatingSubphase(false)
    }
  }

  const handleDeleteSubphase = (subphaseId: string) => {
    if (!selectedPhase) {
      return
    }
    const target = selectedPhase.subphases.find(
      (subphase) => subphase.id === subphaseId,
    )
    const label = target
      ? `Delete "${target.title}"?`
      : 'Delete this subphase?'
    if (!window.confirm(label)) {
      return
    }
    removeConnectionsForNodes([
      buildConnectionNodeId({
        kind: 'phase-subphase',
        phaseId: selectedPhase.id,
        subphaseId,
      }),
    ])
    const nextSubphases = selectedPhase.subphases.filter(
      (subphase) => subphase.id !== subphaseId,
    )
    updatePhase(selectedPhase.id, { subphases: nextSubphases })
    if (selectedSubphaseId === subphaseId) {
      setSelectedSubphaseId(nextSubphases[0]?.id ?? '')
    }
  }

  const requestAi = async (
    action: AiAction,
    context: AiContext,
    options?: { message?: string; history?: DiscussionLine[] },
  ) => {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          context,
          message: options?.message,
          chatHistory: options?.history?.map(
            (line): AiChatMessage => ({
              role: line.role === 'ai' ? 'assistant' : 'user',
              content: line.text,
            }),
          ),
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'AI request failed')
      }
      const data = (await response.json()) as { text?: string }
      const result = data.text?.trim() ?? ''
      if (result) {
        addToast('AI response received', 'success')
      }
      return result
    } catch (error) {
      console.error(error)
      addToast('AI request failed. Please try again.', 'error')
      return ''
    }
  }

  const handleGenerateDraft = async () => {
    if (!selectedPhase || !selectedSubphase) {
      return
    }
    const context = buildPhaseAiContext(selectedPhase, selectedSubphase)
    const draft = await requestAi('draft', context)
    if (!draft) {
      return
    }
    updateSubphase(selectedPhase.id, selectedSubphase.id, { draft })
  }

  const handleGeneratePhaseNarrative = async () => {
    if (!selectedPhase) {
      return
    }
    setIsNarrativeDrafting(true)
    try {
      const context = buildPhaseAiContext(selectedPhase)
      const direction = narrativePrompt.trim()
      const narrative = await requestAi('draft', context, {
        message: direction || undefined,
      })
      if (!narrative) {
        return
      }
      updatePhase(selectedPhase.id, { summary: narrative })
    } finally {
      setIsNarrativeDrafting(false)
    }
  }

  const handleRefinePhaseNarrative = async () => {
    if (!selectedPhase) {
      return
    }
    if (!selectedPhase.summary.trim()) {
      void handleGeneratePhaseNarrative()
      return
    }
    setIsNarrativeRefining(true)
    try {
      const context = buildPhaseAiContext(selectedPhase)
      const direction = narrativePrompt.trim()
      const narrative = await requestAi('edit', context, {
        message: direction || undefined,
      })
      if (!narrative) {
        return
      }
      updatePhase(selectedPhase.id, { summary: narrative })
    } finally {
      setIsNarrativeRefining(false)
    }
  }

  const handleGenerateEntityNarrative = async () => {
    if (!selectedEntity || !isEntitySection(activeSection)) {
      return
    }
    setIsNarrativeDrafting(true)
    try {
      const context = buildEntityAiContext(selectedEntity)
      const direction = narrativePrompt.trim()
      const narrative = await requestAi('draft', context, {
        message: direction || undefined,
      })
      if (!narrative) {
        return
      }
      updateEntity(activeSection, selectedEntity.id, { summary: narrative })
    } finally {
      setIsNarrativeDrafting(false)
    }
  }

  const handleRefineEntityNarrative = async () => {
    if (!selectedEntity || !isEntitySection(activeSection)) {
      return
    }
    if (!selectedEntity.summary.trim()) {
      void handleGenerateEntityNarrative()
      return
    }
    setIsNarrativeRefining(true)
    try {
      const context = buildEntityAiContext(selectedEntity)
      const direction = narrativePrompt.trim()
      const narrative = await requestAi('edit', context, {
        message: direction || undefined,
      })
      if (!narrative) {
        return
      }
      updateEntity(activeSection, selectedEntity.id, { summary: narrative })
    } finally {
      setIsNarrativeRefining(false)
    }
  }

  const handleSuggestEdits = async () => {
    if (!selectedPhase || !selectedSubphase) {
      return
    }
    const context = buildPhaseAiContext(selectedPhase, selectedSubphase)
    const draft = await requestAi('edit', context)
    if (!draft) {
      return
    }
    updateSubphase(selectedPhase.id, selectedSubphase.id, { draft })
  }

  const handleRefreshPhaseOverview = async () => {
    if (!selectedPhase) {
      return
    }
    const context = buildPhaseAiContext(selectedPhase)
    const webOverview = await requestAi('overview', context)
    if (!webOverview) {
      return
    }
    updatePhase(selectedPhase.id, { webOverview })
  }

  const handleRefreshSubphaseOverview = async () => {
    if (!selectedPhase || !selectedSubphase) {
      return
    }
    const context = buildPhaseAiContext(selectedPhase, selectedSubphase)
    const webOverview = await requestAi('overview', context)
    if (!webOverview) {
      return
    }
    updateSubphase(selectedPhase.id, selectedSubphase.id, { webOverview })
  }

  const updateEntity = (
    section: EntitySection,
    entityId: string,
    updates: Partial<EntityRecord>,
  ) => {
    setEntityData((prev) => ({
      ...prev,
      [section]: prev[section].map((entity) =>
        entity.id === entityId ? { ...entity, ...updates } : entity,
      ),
    }))
  }

  const updateEntitySubphase = (
    section: EntitySection,
    entityId: string,
    subphaseId: string,
    updates: Partial<Subphase>,
  ) => {
    setEntityData((prev) => ({
      ...prev,
      [section]: prev[section].map((entity) => {
        if (entity.id !== entityId) {
          return entity
        }
        return {
          ...entity,
          subphases: entity.subphases.map((subphase) =>
            subphase.id === subphaseId
              ? { ...subphase, ...updates }
              : subphase,
          ),
        }
      }),
    }))
  }

  const updateSelectedEntitySubphase = (updates: Partial<Subphase>) => {
    if (!selectedEntity || !selectedEntitySubphase) {
      return
    }
    if (!isEntitySection(activeSection)) {
      return
    }
    updateEntitySubphase(
      activeSection,
      selectedEntity.id,
      selectedEntitySubphase.id,
      updates,
    )
  }

  const handleAddEntitySubphase = async () => {
    if (!selectedEntity || !isEntitySection(activeSection)) {
      return
    }
    const prompt = entitySubphaseForm.prompt.trim()
    if (!prompt) {
      return
    }
    setIsCreatingEntitySubphase(true)
    try {
      const context: AiContext = {
        kind: 'entity',
        scope: 'subphase',
        title: selectedEntity.name,
        range: selectedEntity.era,
        focus: selectedEntity.focus,
        summary: selectedEntity.summary,
        prompt,
      }
      const aiText = await requestAi('setup', context, { message: prompt })
      const parsed = parseSubphaseSetup(aiText)
      const fallbackTitle =
        prompt.length > 60 ? 'New subphase' : prompt
      const title = parsed?.title || fallbackTitle
      const range = parsed?.range || selectedEntity.era
      const nextPrompt =
        parsed?.prompt ||
        `Tell me about ${title} (${range}) and draft a working overview.`
      const id = `entity-subphase-${Date.now()}`
      const newSubphase: Subphase = {
        id,
        title,
        range,
        prompt: nextPrompt,
        webOverview: 'Web brief pending.',
        webSources: [],
        draft: '',
        readingText: '',
        focusPoints: [],
      }
      setEntityData((prev) => ({
        ...prev,
        [activeSection]: prev[activeSection].map((entity) =>
          entity.id === selectedEntity.id
            ? { ...entity, subphases: [newSubphase, ...entity.subphases] }
            : entity,
        ),
      }))
      setSelectedEntitySubphaseId(id)
      setEntitySubphaseForm({ prompt: '' })
      setIsAddingEntitySubphase(false)
    } finally {
      setIsCreatingEntitySubphase(false)
    }
  }

  const handleDeleteEntitySubphase = (subphaseId: string) => {
    if (!selectedEntity || !isEntitySection(activeSection)) {
      return
    }
    const target = selectedEntity.subphases.find(
      (subphase) => subphase.id === subphaseId,
    )
    const label = target
      ? `Delete "${target.title}"?`
      : 'Delete this subphase?'
    if (!window.confirm(label)) {
      return
    }
    removeConnectionsForNodes([
      buildConnectionNodeId({
        kind: 'entity-subphase',
        section: activeSection,
        entityId: selectedEntity.id,
        subphaseId,
      }),
    ])
    const nextSubphases = selectedEntity.subphases.filter(
      (subphase) => subphase.id !== subphaseId,
    )
    updateEntity(activeSection, selectedEntity.id, {
      subphases: nextSubphases,
    })
    if (selectedEntitySubphaseId === subphaseId) {
      setSelectedEntitySubphaseId(nextSubphases[0]?.id ?? '')
    }
  }

  const handleGenerateEntityDraft = async () => {
    if (!selectedEntity || !selectedEntitySubphase) {
      return
    }
    if (!isEntitySection(activeSection)) {
      return
    }
    const context = buildEntityAiContext(selectedEntity, selectedEntitySubphase)
    const draft = await requestAi('draft', context)
    if (!draft) {
      return
    }
    updateEntitySubphase(
      activeSection,
      selectedEntity.id,
      selectedEntitySubphase.id,
      { draft },
    )
  }

  const handleSuggestEntityEdits = async () => {
    if (!selectedEntity || !selectedEntitySubphase) {
      return
    }
    if (!isEntitySection(activeSection)) {
      return
    }
    const context = buildEntityAiContext(selectedEntity, selectedEntitySubphase)
    const draft = await requestAi('edit', context)
    if (!draft) {
      return
    }
    updateEntitySubphase(
      activeSection,
      selectedEntity.id,
      selectedEntitySubphase.id,
      { draft },
    )
  }

  const handleRefreshEntityOverview = async () => {
    if (!selectedEntity || !isEntitySection(activeSection)) {
      return
    }
    const context = buildEntityAiContext(selectedEntity)
    const webOverview = await requestAi('overview', context)
    if (!webOverview) {
      return
    }
    updateEntity(activeSection, selectedEntity.id, { webOverview })
  }

  const handleRefreshEntitySubphaseOverview = async () => {
    if (!selectedEntity || !selectedEntitySubphase) {
      return
    }
    if (!isEntitySection(activeSection)) {
      return
    }
    const context = buildEntityAiContext(selectedEntity, selectedEntitySubphase)
    const webOverview = await requestAi('overview', context)
    if (!webOverview) {
      return
    }
    updateEntitySubphase(
      activeSection,
      selectedEntity.id,
      selectedEntitySubphase.id,
      { webOverview },
    )
  }

  const handleGoHome = () => {
    setActiveSection('Home')
    setNavOpen(false)
  }

  const handleReviewPrompts = () => {
    if (!selectedPhase) {
      addToast('Create a phase to review prompts.', 'info')
      return
    }
    setActiveSection('Phases')
    setActivePhaseTab('Subphases')
    setNavOpen(false)
  }

  const handleOpenPhaseModal = () => {
    setPhaseForm({
      prompt: '',
    })
    setIsCreatingPhase(false)
    setIsPhaseModalOpen(true)
  }

  const handleAddPhase = async () => {
    const prompt = phaseForm.prompt.trim()
    if (!prompt) {
      return
    }
    setIsCreatingPhase(true)
    try {
      const context: AiContext = {
        kind: 'phase',
        scope: 'summary',
        title: prompt,
        range: '',
        summary: prompt,
        prompt,
      }
      const aiText = await requestAi('setup', context, { message: prompt })
      const parsed = parsePhaseSetup(aiText)
      const title = parsed?.title || prompt
      const range = parsed?.range || 'Custom range'
      const summary =
        parsed?.summary ||
        (parsed ? 'Working overview. Update with sources and AI.' : aiText) ||
        `Working overview for ${title}.`
      const subphaseTitle =
        parsed?.subphaseTitle || `Overview of ${title}`
      const subphaseRange = parsed?.subphaseRange || range
      const subphasePrompt =
        parsed?.subphasePrompt ||
        `Tell me about ${subphaseTitle} (${subphaseRange}) and draft a working overview.`
      const themes = parsed?.themes ?? []
      const questions =
        parsed?.questions ?? [
          'Which sources will anchor this phase?',
          'Which perspectives are missing?',
        ]
      const phaseId = `phase-${Date.now()}`
      const subphaseId = `subphase-${Date.now()}`
      const newPhase: Phase = {
        id: phaseId,
        title,
        range,
        mainPoint: '',
        mainPoints: [],
        summary,
        webOverview: 'Web brief pending.',
        webSources: [],
        themes,
        questions,
        narrativeHighlights: [],
        narrativeSnippets: [],
        narrativeVersions: [],
        discussion: [],
        sources: [],
        notes: [],
        timeline: [],
        subphases: [
          {
            id: subphaseId,
            title: subphaseTitle,
            range: subphaseRange,
            prompt: subphasePrompt,
            webOverview: 'Web brief pending.',
            webSources: [],
            draft: '',
            readingText: '',
            focusPoints: [],
          },
        ],
      }
      setPhaseData((prev) => [newPhase, ...prev])
      setSelectedPhaseId(phaseId)
      setSelectedSubphaseId(subphaseId)
      setActivePhaseTab('Overview')
      setActiveSection('Phases')
      setIsPhaseModalOpen(false)
    } finally {
      setIsCreatingPhase(false)
    }
  }

  const handleDeletePhase = (phaseId: string) => {
    const target = phaseData.find((phase) => phase.id === phaseId)
    const label = target ? `Delete "${target.title}"?` : 'Delete this phase?'
    if (!window.confirm(label)) {
      return
    }
    if (target) {
      const nodeIds = [
        buildConnectionNodeId({ kind: 'phase', phaseId: target.id }),
        ...target.subphases.map((subphase) =>
          buildConnectionNodeId({
            kind: 'phase-subphase',
            phaseId: target.id,
            subphaseId: subphase.id,
          }),
        ),
      ]
      removeConnectionsForNodes(nodeIds)
    }
    const next = phaseData.filter((phase) => phase.id !== phaseId)
    setPhaseData(next)
    if (selectedPhaseId === phaseId) {
      setSelectedPhaseId(next[0]?.id ?? '')
      setSelectedSubphaseId(next[0]?.subphases[0]?.id ?? '')
    }
  }

  const handleDeleteEntity = (section: EntitySection, entityId: string) => {
    const target = entityData[section].find((entity) => entity.id === entityId)
    const label = target ? `Delete "${target.name}"?` : 'Delete this entry?'
    if (!window.confirm(label)) {
      return
    }
    if (target) {
      const nodeIds = [
        buildConnectionNodeId({
          kind: 'entity',
          section,
          entityId: target.id,
        }),
        ...target.subphases.map((subphase) =>
          buildConnectionNodeId({
            kind: 'entity-subphase',
            section,
            entityId: target.id,
            subphaseId: subphase.id,
          }),
        ),
      ]
      removeConnectionsForNodes(nodeIds)
    }
    const nextList = entityData[section].filter(
      (entity) => entity.id !== entityId,
    )
    setEntityData((prev) => ({
      ...prev,
      [section]: nextList,
    }))
    setEntitySelection((prev) => ({
      ...prev,
      [section]: nextList[0]?.id ?? '',
    }))
    if (activeSection === section) {
      setSelectedEntitySubphaseId(nextList[0]?.subphases[0]?.id ?? '')
      setActiveEntityTab('Overview')
    }
    addToast('Entry deleted', 'info')
  }

  const handleOpenEntityModal = () => {
    setEntityForm({
      prompt: '',
    })
    setIsCreatingEntity(false)
    setIsEntityModalOpen(true)
  }

  const handleAddEntity = async () => {
    if (!isEntitySection(activeSection)) {
      return
    }
    const prompt = entityForm.prompt.trim()
    if (!prompt) {
      return
    }
    setIsCreatingEntity(true)
    try {
      const context: AiContext = {
        kind: 'entity',
        scope: 'summary',
        title: prompt,
        range: '',
        summary: prompt,
        prompt,
      }
      const aiText = await requestAi('setup', context, { message: prompt })
      const parsed = parsePhaseSetup(aiText)
      const name = parsed?.title || prompt
      const era = parsed?.range || 'Era'
      const summary =
        parsed?.summary ||
        (parsed ? 'Working overview. Update with sources and AI.' : aiText) ||
        `Working overview for ${name}.`
      const focus = parsed?.themes?.[0] || 'Focus area'
      const subphaseTitle = parsed?.subphaseTitle || `Overview of ${name}`
      const subphaseRange = parsed?.subphaseRange || era
      const subphasePrompt =
        parsed?.subphasePrompt ||
        `Tell me about ${subphaseTitle} (${subphaseRange}) and draft a working overview.`
      const entityId = `entity-${Date.now()}`
      const subphaseId = `entity-subphase-${Date.now()}`
      const newEntity: EntityRecord = {
        id: entityId,
        name,
        era,
        focus,
        mainPoint: '',
        mainPoints: [],
        summary,
        tags: parsed?.themes ?? [],
        webOverview: 'Web brief pending.',
        webSources: [],
        subphases: [
          {
            id: subphaseId,
            title: subphaseTitle,
            range: subphaseRange,
            prompt: subphasePrompt,
            webOverview: 'Web brief pending.',
            webSources: [],
            draft: '',
            readingText: '',
            focusPoints: [],
          },
        ],
        narrativeHighlights: [],
        narrativeSnippets: [],
        narrativeVersions: [],
        sources: [],
        notes: [],
        timeline: [],
      }
      setEntityData((prev) => ({
        ...prev,
        [activeSection]: [newEntity, ...prev[activeSection]],
      }))
      setEntitySelection((prev) => ({
        ...prev,
        [activeSection]: entityId,
      }))
      setSelectedEntitySubphaseId(subphaseId)
      setActiveEntityTab('Overview')
      setIsEntityModalOpen(false)
    } finally {
      setIsCreatingEntity(false)
    }
  }

  // Source management
  const handleOpenSourceModal = () => {
    setSourceForm({
      title: '',
      type: 'Document',
      date: '',
      origin: '',
      excerpt: '',
      tags: '',
      fileName: '',
      fileType: '',
      fileSize: 0,
      fileData: '',
    })
    setIsSourceModalOpen(true)
  }

  const handleTopbarUploadSources = () => {
    if (activeSection === 'Phases') {
      setActivePhaseTab('Sources')
    } else if (isEntitySection(activeSection)) {
      setActiveEntityTab('Sources')
    } else if (activeSection === 'Home' || activeSection === 'Library') {
      if (selectedPhase) {
        setActiveSection('Phases')
        setActivePhaseTab('Sources')
      } else {
        const fallbackSection = entitySections.find(
          (section) => entityData[section].length > 0,
        )
        if (fallbackSection) {
          setActiveSection(fallbackSection)
          setActiveEntityTab('Sources')
          setEntitySelection((prev) => ({
            ...prev,
            [fallbackSection]: entityData[fallbackSection][0]?.id ?? '',
          }))
        } else {
          addToast('Create a phase or entry before adding sources.', 'info')
        }
      }
    }
    handleOpenSourceModal()
  }

  const handleSourceFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const fileName = file.name
    const displayType = file.type.includes('pdf')
      ? 'PDF'
      : file.type.startsWith('image/')
      ? 'Image'
      : 'Document'
    const titleFromFile = fileName.replace(/\.[^/.]+$/, '')
    const today = new Date().toLocaleDateString()
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setSourceForm((prev) => ({
        ...prev,
        title: prev.title || titleFromFile,
        type: displayType,
        date: prev.date || today,
        origin: prev.origin || 'Local upload',
        excerpt: prev.excerpt || `Uploaded file: ${fileName}`,
        fileName,
        fileType: file.type || displayType,
        fileSize: file.size,
        fileData: result,
      }))
    }
    reader.readAsDataURL(file)
  }

  const uploadSourceFile = async () => {
    if (!syncEnabled || !syncUrl || !sourceForm.fileData) {
      return null
    }
    try {
      const response = await fetch(`${syncUrl}/api/upload`, {
        method: 'POST',
        headers: buildSyncHeaders(),
        body: JSON.stringify({
          fileName: sourceForm.fileName || 'upload',
          fileType: sourceForm.fileType || sourceForm.type,
          data: sourceForm.fileData,
        }),
      })
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      return await response.json()
    } catch (error) {
      console.warn(error)
      addToast('File upload failed. Try again.', 'error')
      return null
    }
  }

  const handleAddSource = async () => {
    const hasFile = Boolean(sourceForm.fileName)
    if (hasFile && syncEnabled && !sourceForm.fileData) {
      addToast('File is still loading. Try again in a moment.', 'info')
      return
    }
    let uploadResult: {
      url?: string
      fileName?: string
      fileType?: string
      size?: number
    } | null = null
    if (hasFile && syncEnabled) {
      uploadResult = await uploadSourceFile()
      if (!uploadResult) {
        return
      }
    }
    const newSource: SourceCard = {
      id: `source-${Date.now()}`,
      title:
        sourceForm.title.trim() ||
        sourceForm.fileName ||
        'Untitled source',
      type: sourceForm.type,
      date: sourceForm.date.trim() || (hasFile ? 'Today' : 'Unknown'),
      origin: sourceForm.origin.trim() || (hasFile ? 'Local upload' : 'Unknown'),
      excerpt:
        sourceForm.excerpt.trim() ||
        (hasFile ? `Uploaded file: ${sourceForm.fileName}` : ''),
      confidence: hasFile ? 'Uploaded' : 'Manual entry',
      tags: sourceForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      fileName: uploadResult?.fileName || sourceForm.fileName || undefined,
      fileType: uploadResult?.fileType || sourceForm.fileType || undefined,
      fileSize: uploadResult?.size || sourceForm.fileSize || undefined,
      fileUrl: uploadResult?.url,
    }

    let targetLabel: string | null = null
    if (activeSection === 'Phases' && selectedPhase) {
      updatePhase(selectedPhase.id, {
        sources: [newSource, ...selectedPhase.sources],
      })
      targetLabel = selectedPhase.title
    } else if (isEntitySection(activeSection) && selectedEntity) {
      updateEntity(activeSection, selectedEntity.id, {
        sources: [newSource, ...selectedEntity.sources],
      })
      targetLabel = selectedEntity.name
    } else {
      addToast('Select a phase or entry to attach this source.', 'info')
      return
    }

    setIsSourceModalOpen(false)
    addToast(
      targetLabel ? `Source added to ${targetLabel}` : 'Source added',
      'success',
    )
  }

  const handleDeleteSource = (sourceId: string) => {
    if (!window.confirm('Delete this source?')) return

    if (activeSection === 'Phases' && selectedPhase) {
      updatePhase(selectedPhase.id, {
        sources: selectedPhase.sources.filter(s => s.id !== sourceId),
      })
    } else if (isEntitySection(activeSection) && selectedEntity) {
      updateEntity(activeSection, selectedEntity.id, {
        sources: selectedEntity.sources.filter(s => s.id !== sourceId),
      })
    }
    addToast('Source deleted', 'info')
  }

  const handleOpenLibraryItem = (item: LibraryItem) => {
    const phaseMatch = phaseData.find((phase) => phase.title === item.phase)
    if (!phaseMatch) {
      addToast('No matching phase found for this item yet.', 'info')
      return
    }
    setActiveSection('Phases')
    setSelectedPhaseId(phaseMatch.id)
    setSelectedSubphaseId(phaseMatch.subphases[0]?.id ?? '')
    setActivePhaseTab('Sources')
  }

  const handleSwapConnection = () => {
    setConnectionForm((prev) => ({
      ...prev,
      from: prev.to,
      to: prev.from,
    }))
  }

  const handleAddConnection = () => {
    const fromNode = parseConnectionNodeId(connectionForm.from)
    const toNode = parseConnectionNodeId(connectionForm.to)
    if (!fromNode || !toNode) {
      return
    }
    const fromId = buildConnectionNodeId(fromNode)
    const toId = buildConnectionNodeId(toNode)
    if (fromId === toId) {
      addToast('Pick two different items to link.', 'info')
      return
    }
    const exists = connections.some((connection) => {
      const existingFrom = buildConnectionNodeId(connection.from)
      const existingTo = buildConnectionNodeId(connection.to)
      const samePair =
        (existingFrom === fromId && existingTo === toId) ||
        (existingFrom === toId && existingTo === fromId)
      return samePair && connection.relation === connectionForm.relation
    })
    if (exists) {
      addToast('This connection already exists.', 'info')
      return
    }
    const newConnection: Connection = {
      id: `connection-${Date.now()}`,
      from: fromNode,
      to: toNode,
      relation: connectionForm.relation,
      note: connectionForm.note.trim(),
      createdAt: new Date().toLocaleDateString(),
    }
    setConnections((prev) => [newConnection, ...prev])
    setConnectionForm((prev) => ({
      ...prev,
      from: '',
      to: '',
      note: '',
    }))
    addToast('Connection saved', 'success')
  }

  const handleDeleteConnection = (connectionId: string) => {
    if (!window.confirm('Delete this connection?')) {
      return
    }
    setConnections((prev) =>
      prev.filter((connection) => connection.id !== connectionId),
    )
    addToast('Connection removed', 'info')
  }

  const handleOpenPhaseWorkspace = () => {
    if (!selectedPhase) {
      return
    }
    setNavOpen(false)
    setActiveSection('Phases')
    setSelectedSubphaseId(selectedPhase.subphases[0]?.id ?? '')
    navigate(`/workspace/phase/${selectedPhase.id}`)
  }

  const handleOpenEntityWorkspace = () => {
    if (!selectedEntity || !isEntitySection(activeSection)) {
      return
    }
    setNavOpen(false)
    setSelectedEntitySubphaseId(selectedEntity.subphases[0]?.id ?? '')
    navigate(`/workspace/entity/${activeSection}/${selectedEntity.id}`)
  }

  const handleCloseWorkspace = () => {
    setNavOpen(false)
    if (workspaceContext?.kind === 'phase' && workspacePhase) {
      setActiveSection('Phases')
      setSelectedPhaseId(workspacePhase.id)
      setSelectedSubphaseId(workspacePhase.subphases[0]?.id ?? '')
      setActivePhaseTab('Overview')
    } else if (workspaceContext?.kind === 'entity' && workspaceEntity) {
      setActiveSection(workspaceContext.section)
      setEntitySelection((prev) => ({
        ...prev,
        [workspaceContext.section]: workspaceEntity.id,
      }))
      setSelectedEntitySubphaseId(workspaceEntity.subphases[0]?.id ?? '')
      setActiveEntityTab('Overview')
    } else {
      setActiveSection('Home')
    }
    const fallbackPath = lastOverviewPathRef.current || '/'
    navigate(fallbackPath, { replace: true })
  }

  const handleWorkspaceSummaryChange = (value: string) => {
    if (workspaceContext?.kind === 'phase' && workspacePhase) {
      updatePhase(workspacePhase.id, { summary: value })
    }
    if (workspaceContext?.kind === 'entity' && workspaceEntity) {
      updateEntity(workspaceContext.section, workspaceEntity.id, {
        summary: value,
      })
    }
  }

  const updateWorkspaceMainPoints = (
    updater: (points: MainPoint[]) => MainPoint[],
  ) => {
    if (workspaceContext?.kind === 'phase' && workspacePhase) {
      const current = normalizeMainPoints(workspacePhase)
      updatePhase(workspacePhase.id, {
        mainPoints: updater(current),
        mainPoint: undefined,
      })
    }
    if (workspaceContext?.kind === 'entity' && workspaceEntity) {
      const current = normalizeMainPoints(workspaceEntity)
      updateEntity(workspaceContext.section, workspaceEntity.id, {
        mainPoints: updater(current),
        mainPoint: undefined,
      })
    }
  }

  const handleWorkspaceAddMainPoint = () => {
    const newPoint: MainPoint = {
      id: `main-point-${Date.now()}`,
      title: 'New point',
      description: '',
    }
    updateWorkspaceMainPoints((points) => [newPoint, ...points])
  }

  const handleWorkspaceUpdateMainPoint = (
    pointId: string,
    updates: Partial<MainPoint>,
  ) => {
    updateWorkspaceMainPoints((points) =>
      points.map((point) =>
        point.id === pointId ? { ...point, ...updates } : point,
      ),
    )
  }

  const handleWorkspaceRemoveMainPoint = (pointId: string) => {
    updateWorkspaceMainPoints((points) =>
      points.filter((point) => point.id !== pointId),
    )
  }

  const updateWorkspaceNarrative = (updates: NarrativeUpdate) => {
    if (workspaceContext?.kind === 'phase' && workspacePhase) {
      updatePhase(workspacePhase.id, updates)
    }
    if (workspaceContext?.kind === 'entity' && workspaceEntity) {
      updateEntity(workspaceContext.section, workspaceEntity.id, updates)
    }
  }

  const handleWorkspaceAddHighlight = () => {
    const target = workspaceNarrativeRef.current
    if (!target) {
      return
    }
    const start = target.selectionStart ?? 0
    const end = target.selectionEnd ?? 0
    const text = target.value.slice(start, end).trim()
    if (!text) {
      return
    }
    const entry: NarrativeHighlight = {
      id: `highlight-${Date.now()}`,
      text,
      note: '',
    }
    updateWorkspaceNarrative({
      narrativeHighlights: [entry, ...workspaceHighlights],
    })
  }

  const handleWorkspaceHighlightNote = (id: string, note: string) => {
    const next = workspaceHighlights.map((highlight) =>
      highlight.id === id ? { ...highlight, note } : highlight,
    )
    updateWorkspaceNarrative({ narrativeHighlights: next })
  }

  const handleWorkspaceRemoveHighlight = (id: string) => {
    const next = workspaceHighlights.filter((highlight) => highlight.id !== id)
    updateWorkspaceNarrative({ narrativeHighlights: next })
  }

  const handleWorkspaceAddSnippet = () => {
    const text = snippetDraft.trim()
    if (!text) {
      return
    }
    const entry: NarrativeSnippet = {
      id: `snippet-${Date.now()}`,
      text,
      tag: snippetTag,
    }
    updateWorkspaceNarrative({
      narrativeSnippets: [entry, ...workspaceSnippets],
    })
    setSnippetDraft('')
  }

  const handleWorkspaceUpdateSnippet = (
    id: string,
    updates: Partial<NarrativeSnippet>,
  ) => {
    const next = workspaceSnippets.map((snippet) =>
      snippet.id === id ? { ...snippet, ...updates } : snippet,
    )
    updateWorkspaceNarrative({ narrativeSnippets: next })
  }

  const handleWorkspaceRemoveSnippet = (id: string) => {
    const next = workspaceSnippets.filter((snippet) => snippet.id !== id)
    updateWorkspaceNarrative({ narrativeSnippets: next })
  }

  const handleWorkspaceSaveVersion = () => {
    const text = workspaceSummary.trim()
    if (!text) {
      return
    }
    const entry: NarrativeVersion = {
      id: `version-${Date.now()}`,
      content: text,
      createdAt: new Date().toLocaleString(),
    }
    updateWorkspaceNarrative({
      narrativeVersions: [entry, ...workspaceVersions],
    })
  }

  const handleWorkspaceRestoreVersion = (id: string) => {
    const version = workspaceVersions.find((item) => item.id === id)
    if (!version) {
      return
    }
    handleWorkspaceSummaryChange(version.content)
  }

  const handleWorkspaceRemoveVersion = (id: string) => {
    const next = workspaceVersions.filter((item) => item.id !== id)
    updateWorkspaceNarrative({ narrativeVersions: next })
  }

  const handleToggleSubphaseLock = () => {
    if (!workspaceSelectedSubphase) {
      return
    }
    setIsSubphaseLocked((prev) => {
      const next = !prev
      if (next) {
        setWorkspaceChatScope('subphase')
      }
      return next
    })
  }

  const handleWorkspaceDraftNarrative = async () => {
    if (!workspaceContext) {
      return
    }
    const context =
      workspaceContext.kind === 'phase'
        ? workspacePhase
          ? buildPhaseAiContext(workspacePhase)
          : null
        : workspaceEntity
        ? buildEntityAiContext(workspaceEntity)
        : null
    if (!context) {
      return
    }
    setIsNarrativeDrafting(true)
    try {
      const direction = narrativePrompt.trim()
      const narrative = await requestAi('draft', context, {
        message: direction || undefined,
      })
      if (!narrative) {
        return
      }
      handleWorkspaceSummaryChange(narrative)
    } finally {
      setIsNarrativeDrafting(false)
    }
  }

  const handleWorkspaceRefineNarrative = async () => {
    if (!workspaceContext) {
      return
    }
    if (!workspaceSummary.trim()) {
      void handleWorkspaceDraftNarrative()
      return
    }
    const context =
      workspaceContext.kind === 'phase'
        ? workspacePhase
          ? buildPhaseAiContext(workspacePhase)
          : null
        : workspaceEntity
        ? buildEntityAiContext(workspaceEntity)
        : null
    if (!context) {
      return
    }
    setIsNarrativeRefining(true)
    try {
      const direction = narrativePrompt.trim()
      const narrative = await requestAi('edit', context, {
        message: direction || undefined,
      })
      if (!narrative) {
        return
      }
      handleWorkspaceSummaryChange(narrative)
    } finally {
      setIsNarrativeRefining(false)
    }
  }

  const handleWorkspaceSelectSubphase = (subphaseId: string) => {
    if (workspaceContext?.kind === 'phase') {
      setSelectedSubphaseId(subphaseId)
      return
    }
    if (workspaceContext?.kind === 'entity') {
      setSelectedEntitySubphaseId(subphaseId)
    }
  }

  const handleWorkspaceSubphaseUpdate = (updates: Partial<Subphase>) => {
    if (!workspaceSelectedSubphase) {
      return
    }
    if (workspaceContext?.kind === 'phase' && workspacePhase) {
      updateSubphase(workspacePhase.id, workspaceSelectedSubphase.id, updates)
      return
    }
    if (workspaceContext?.kind === 'entity' && workspaceEntity) {
      updateEntitySubphase(
        workspaceContext.section,
        workspaceEntity.id,
        workspaceSelectedSubphase.id,
        updates,
      )
    }
  }

  const handleWorkspaceChatSubmit = async () => {
    if (!workspaceChatKey) {
      return
    }
    const message = workspaceChatInput.trim()
    if (!message) {
      return
    }
    if (!workspaceContext) {
      return
    }
    setWorkspaceChats((prev) => ({
      ...prev,
      [workspaceChatKey]: [
        ...(prev[workspaceChatKey] ?? []),
        { role: 'you', text: message },
      ],
    }))
    setWorkspaceChatInput('')
    const history = workspaceChat.slice(-6)
    const context =
      workspaceContext.kind === 'phase'
        ? workspacePhase
          ? buildPhaseAiContext(
              workspacePhase,
              workspaceChatScopeResolved === 'subphase'
                ? workspaceSelectedSubphase
                : undefined,
            )
          : null
        : workspaceEntity
        ? buildEntityAiContext(
            workspaceEntity,
            workspaceChatScopeResolved === 'subphase'
              ? workspaceSelectedSubphase
              : undefined,
          )
        : null
    if (!context) {
      return
    }
    const reply = await requestAi('chat', context, {
      message,
      history,
    })
    const safeReply =
      reply || 'Sorry, I could not reach the AI. Try again in a moment.'
    setWorkspaceChats((prev) => ({
      ...prev,
      [workspaceChatKey]: [
        ...(prev[workspaceChatKey] ?? []),
        { role: 'ai', text: safeReply },
      ],
    }))
  }

  const handleWorkspaceGenerateDraft = () => {
    if (!workspaceSelectedSubphase) {
      return
    }
    if (workspaceContext?.kind === 'phase') {
      void handleGenerateDraft()
      return
    }
    void handleGenerateEntityDraft()
  }

  const handleWorkspaceSuggestEdits = () => {
    if (!workspaceSelectedSubphase) {
      return
    }
    if (workspaceContext?.kind === 'phase') {
      void handleSuggestEdits()
      return
    }
    void handleSuggestEntityEdits()
  }

  const handleWorkspaceRefreshOverview = () => {
    if (workspaceContext?.kind === 'phase') {
      void handleRefreshPhaseOverview()
      return
    }
    void handleRefreshEntityOverview()
  }

  const handleWorkspaceRefreshSubphaseOverview = () => {
    if (!workspaceSelectedSubphase) {
      return
    }
    if (workspaceContext?.kind === 'phase') {
      void handleRefreshSubphaseOverview()
      return
    }
    void handleRefreshEntitySubphaseOverview()
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: useCallback(() => {
      if (isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false)
        return
      }
      if (isPhaseModalOpen) {
        setIsPhaseModalOpen(false)
        return
      }
      if (isEntityModalOpen) {
        setIsEntityModalOpen(false)
        return
      }
      if (navOpen) {
        setNavOpen(false)
        return
      }
    }, [isCommandPaletteOpen, isPhaseModalOpen, isEntityModalOpen, navOpen]),
    onSave: useCallback(() => {
      addToast('Progress saved', 'success')
    }, [addToast]),
    onCommandPalette: useCallback(() => {
      setIsCommandPaletteOpen((open) => !open)
    }, []),
  })

  // Command palette items
  const commandPaletteItems = useMemo(() => {
    const items: { id: string; title: string; section: string; hint?: string; action: () => void }[] = []

    // Phases
    phaseData.forEach((phase) => {
      items.push({
        id: `phase-${phase.id}`,
        title: phase.title,
        section: 'Phases',
        hint: phase.range,
        action: () => {
          setActiveSection('Phases')
          setSelectedPhaseId(phase.id)
          setNavOpen(false)
        },
      })
    })

    // Entities
    entitySections.forEach((section) => {
      entityData[section].forEach((entity) => {
        items.push({
          id: `entity-${entity.id}`,
          title: entity.name,
          section,
          hint: entity.era,
          action: () => {
            setActiveSection(section)
            setEntitySelection((prev) => ({ ...prev, [section]: entity.id }))
            setNavOpen(false)
          },
        })
      })
    })

    // Actions
    items.push({
      id: 'action-new-phase',
      title: 'Create new phase',
      section: 'Actions',
      action: () => handleOpenPhaseModal(),
    })

    items.push({
      id: 'action-workspace',
      title: 'Open workspace',
      section: 'Actions',
      action: () => {
        if (selectedPhase) {
          navigate(`/workspace/phase/${selectedPhase.id}`)
        }
      },
    })

    return items
  }, [phaseData, entityData, selectedPhase, navigate])

  // Breadcrumbs for workspace
  const workspaceBreadcrumbs = useMemo(() => {
    if (!isWorkspaceView) return []

    const items: { label: string; onClick?: () => void }[] = [
      {
        label: 'Home',
        onClick: () => {
          navigate('/')
          setActiveSection('Home')
        },
      },
    ]

    if (workspaceContext?.kind === 'phase') {
      items.push({ label: 'Phases', onClick: () => { navigate('/'); setActiveSection('Phases') } })
      items.push({ label: workspaceTitle })
    } else if (workspaceContext?.kind === 'entity') {
      items.push({ label: workspaceContext.section, onClick: () => { navigate('/'); setActiveSection(workspaceContext.section) } })
      items.push({ label: workspaceTitle })
    }

    if (workspaceSelectedSubphase) {
      items.push({ label: workspaceSelectedSubphase.title })
    }

    return items
  }, [isWorkspaceView, workspaceContext, workspaceTitle, workspaceSelectedSubphase, navigate])

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        items={commandPaletteItems}
      />
      <div className="app">
      {!isWorkspaceView ? (
        <>
          <header className="topbar" data-animate style={animateStyle(0)}>
            <div className="topbar-left">
              <button
                className={`menu-button${navOpen ? ' open' : ''}`}
                type="button"
                aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={navOpen}
                aria-controls="primary-navigation"
                onClick={() => setNavOpen((open) => !open)}
              >
                <span className="menu-lines" />
                <span className="menu-label">{navOpen ? 'Close' : 'Menu'}</span>
              </button>
            </div>
            <button
              className="brand brand-link"
              type="button"
              onClick={handleGoHome}
              aria-label="Go to home"
            >
              <div className="brand-mark" />
              <div>
                <p className="brand-name">History Studio</p>
                <p className="brand-tag">
                  Guided research workspace with memory
                </p>
              </div>
            </button>
            <div className="topbar-actions">
              <button
                className="theme-toggle"
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? '\u263E' : '\u2600'}
              </button>
              <div
                className="search"
                onClick={() => setIsCommandPaletteOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setIsCommandPaletteOpen(true)
                  }
                }}
                aria-label="Open search (Ctrl+K)"
              >
                <span className="search-icon">Search</span>
                <input
                  type="search"
                  placeholder="Search phases, people, sources"
                  readOnly
                  style={{ cursor: 'pointer' }}
                />
                <span className="search-shortcut">Ctrl+K</span>
              </div>
              <button
                className="btn ghost"
                type="button"
                onClick={handleTopbarUploadSources}
              >
                Upload sources
              </button>
              <button
                className="btn primary"
                type="button"
                onClick={handleOpenPhaseModal}
              >
                New phase
              </button>
            </div>
          </header>

          <div
            className={`drawer-scrim ${navOpen ? 'open' : ''}`}
            onClick={() => setNavOpen(false)}
          />
          <aside
            id="primary-navigation"
            className={`sidebar ${navOpen ? 'open' : ''}`}
          >
            <div className="sidebar-header">
              <p className="sidebar-title">Navigate</p>
              <button
                className="btn ghost"
                type="button"
                onClick={() => setNavOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="sidebar-nav">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`nav-item ${
                    activeSection === section.id ? 'active' : ''
                  }`}
                  onClick={() => {
                    setActiveSection(section.id)
                    if (section.id === 'Phases') {
                      setActivePhaseTab('Overview')
                    }
                    if (isEntitySection(section.id)) {
                      setActiveEntityTab('Overview')
                    }
                    setNavOpen(false)
                  }}
                  type="button"
                >
                  <span className="nav-item-title">{section.id}</span>
                  <span className="nav-desc">{section.description}</span>
                </button>
              ))}
            </div>
          </aside>
        </>
      ) : null}

      <div
        className={`shell ${
          isWorkspaceView ? 'workspace-shell' : ''
        } ${navOpen && !isWorkspaceView ? 'with-nav' : ''}`}
      >
        <main id="main-content" className="main" data-animate style={animateStyle(140)}>
          {isWorkspaceView ? (
            <div className="workspace-view">
              {workspaceBreadcrumbs.length > 0 && (
                <Breadcrumbs items={workspaceBreadcrumbs} />
              )}
              <div className="workspace-topbar">
                <div className="brand workspace-brand">
                  <div className="brand-mark" />
                  <div>
                    <p className="brand-name">History Studio</p>
                    <p className="brand-tag">Learning workspace</p>
                  </div>
                </div>
                <div className="workspace-context">
                  <span className="chip muted">{workspaceKindLabel}</span>
                  <span className="muted">{workspaceRange}</span>
                </div>
                <div className="workspace-actions">
                  <div className="workspace-view-toggle">
                    <button
                      className={`btn ${
                        workspaceView === 'two-column' ? 'primary' : 'ghost'
                      }`}
                      type="button"
                      onClick={() => setWorkspaceView('two-column')}
                    >
                      Two-column
                    </button>
                    <button
                      className={`btn ${
                        workspaceView === 'focus' ? 'primary' : 'ghost'
                      }`}
                      type="button"
                      onClick={() => setWorkspaceView('focus')}
                    >
                      Focus mode
                    </button>
                  </div>
                  {workspaceSelectedSubphase ? (
                    <button
                      className={`btn ${
                        isSubphaseLocked ? 'primary' : 'ghost'
                      }`}
                      type="button"
                      onClick={handleToggleSubphaseLock}
                      aria-pressed={isSubphaseLocked}
                    >
                      {isSubphaseLocked
                        ? 'Subphase focus on'
                        : 'Subphase focus'}
                    </button>
                  ) : null}
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={handleCloseWorkspace}
                  >
                    Back to overview
                  </button>
                </div>
              </div>
              <div className="workspace-header">
                <p className="eyebrow">Workspace brief</p>
                <h1>{workspaceTitle}</h1>
                <p className="lede">
                  Read, draft, and refine the narrative with sources nearby.
                </p>
              </div>

              <div className={`workspace-layout ${workspaceView}`}>
                {workspaceView === 'focus' ? null : (
                  <aside className="workspace-rail left">
                    <details
                      className="panel-card rail-card workspace-context-card expandable"
                      open
                    >
                      <summary className="panel-summary">
                        <span>Context</span>
                        <span className="chip muted">{workspaceRange}</span>
                      </summary>
                      <div className="panel-body">
                        <p>{workspaceSummary}</p>
                      </div>
                    </details>
                    <details className="panel-card rail-card expandable" open>
                      <summary className="panel-summary">
                        <span>Subphases</span>
                        <span className="chip muted">
                          {workspaceSubphases.length}
                        </span>
                      </summary>
                      <div className="panel-body">
                        <div className="subphase-stack">
                          {workspaceSubphases.map((subphase) => (
                            <button
                              key={subphase.id}
                              className={`subphase-card ${
                                subphase.id === workspaceSelectedSubphase?.id
                                  ? 'active'
                                  : ''
                              }`}
                              type="button"
                              onClick={() =>
                                handleWorkspaceSelectSubphase(subphase.id)
                              }
                            >
                              <p className="phase-range">{subphase.range}</p>
                              <h4>{subphase.title}</h4>
                              <p className="muted">{subphase.prompt}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </details>
                  </aside>
                )}
                <section className="workspace-canvas">
                  {workspaceView === 'focus' && workspaceSubphases.length ? (
                    <details className="panel-card focus-panel expandable" open>
                      <summary className="panel-summary">
                        <span>Active subphase</span>
                        <span className="chip muted">
                          {workspaceSubphases.length}
                        </span>
                      </summary>
                      <div className="panel-body">
                        <select
                          value={workspaceSelectedSubphase?.id ?? ''}
                          onChange={(event) =>
                            handleWorkspaceSelectSubphase(event.target.value)
                          }
                        >
                          {workspaceSubphases.map((subphase) => (
                            <option key={subphase.id} value={subphase.id}>
                              {subphase.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </details>
                  ) : null}
                  <details className="panel-card canvas-card expandable" open>
                    <summary className="panel-summary">
                      <span>Main points</span>
                      <span className="chip muted">
                        {workspaceMainPoints.length}
                      </span>
                    </summary>
                    <div className="panel-body">
                      <div className="main-point-toolbar">
                        <p className="muted">
                          Keep the key takeaways here. Each point expands to show
                          its description.
                        </p>
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={handleWorkspaceAddMainPoint}
                        >
                          Add point
                        </button>
                      </div>
                      {workspaceMainPoints.length ? (
                        <div className="main-points">
                          {workspaceMainPoints.map((point) => {
                            const isEmpty =
                              !point.title.trim() && !point.description.trim()
                            return (
                              <details
                                key={point.id}
                                className="main-point"
                                defaultOpen={isEmpty || point.title === 'New point'}
                              >
                                <summary className="main-point-summary">
                                  <span>
                                    {point.title.trim() || 'Untitled point'}
                                  </span>
                                </summary>
                                <div className="main-point-body">
                                  <label className="form-field">
                                    Title
                                    <input
                                      type="text"
                                      value={point.title}
                                      onChange={(event) =>
                                        handleWorkspaceUpdateMainPoint(
                                          point.id,
                                          { title: event.target.value },
                                        )
                                      }
                                      placeholder="Short title"
                                    />
                                  </label>
                                  <label className="form-field">
                                    Description
                                    <textarea
                                      rows={4}
                                      value={point.description}
                                      onChange={(event) =>
                                        handleWorkspaceUpdateMainPoint(
                                          point.id,
                                          { description: event.target.value },
                                        )
                                      }
                                      placeholder="Explain the point with key details."
                                    />
                                  </label>
                                  <div className="main-point-actions">
                                    <button
                                      className="btn ghost"
                                      type="button"
                                      onClick={() =>
                                        handleWorkspaceRemoveMainPoint(point.id)
                                      }
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </details>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="empty-state">
                          <h3>No main points yet</h3>
                          <p>Add your first point to anchor the narrative.</p>
                        </div>
                      )}
                    </div>
                  </details>
                  <details className="panel-card canvas-card expandable" open>
                    <summary className="panel-summary">
                      <span>
                        {workspaceContext?.kind === 'entity'
                          ? 'Entry narrative'
                          : 'Phase narrative'}
                      </span>
                      <span className="chip muted">Editable</span>
                    </summary>
                    <div className="panel-body">
                      <div className="narrative-toolbar">
                        <input
                          type="text"
                          value={narrativePrompt}
                          onChange={(event) =>
                            setNarrativePrompt(event.target.value)
                          }
                          placeholder="Guide the AI narrative (optional)"
                        />
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={handleWorkspaceDraftNarrative}
                          disabled={isNarrativeDrafting}
                        >
                          {isNarrativeDrafting
                            ? 'Drafting...'
                            : 'Draft with AI'}
                        </button>
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={handleWorkspaceRefineNarrative}
                          disabled={
                            isNarrativeRefining || !workspaceSummary.trim()
                          }
                        >
                          {isNarrativeRefining
                            ? 'Refining...'
                            : 'Refine with AI'}
                        </button>
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={handleWorkspaceSaveVersion}
                          disabled={!workspaceSummary.trim()}
                        >
                          Save version
                        </button>
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={handleWorkspaceAddHighlight}
                        >
                          Highlight selection
                        </button>
                      </div>
                      <textarea
                        className="editor"
                        rows={6}
                        value={workspaceSummary}
                        onChange={(event) =>
                          handleWorkspaceSummaryChange(event.target.value)
                        }
                        ref={workspaceNarrativeRef}
                      />
                    </div>
                  </details>

                  {workspaceSelectedSubphase ? (
                    <details className="panel-card canvas-card expandable" open>
                      <summary className="panel-summary">
                        <span>{workspaceSelectedSubphase.title}</span>
                        <span className="chip">
                          {workspaceSelectedSubphase.range}
                        </span>
                      </summary>
                      <div className="panel-body">
                        <div className="editor-toolbar">
                          <input
                            type="text"
                            value={workspaceSelectedSubphase.prompt}
                            onChange={(event) =>
                              handleWorkspaceSubphaseUpdate({
                                prompt: event.target.value,
                              })
                            }
                            placeholder="Ask the AI to draft a paper..."
                          />
                          <button
                            className="btn primary"
                            type="button"
                            onClick={handleWorkspaceGenerateDraft}
                          >
                            Generate draft
                          </button>
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={handleWorkspaceSuggestEdits}
                          >
                            Suggest edits
                          </button>
                        </div>
                        <textarea
                          className="editor"
                          rows={12}
                          value={workspaceSelectedSubphase.draft}
                          onChange={(event) =>
                            handleWorkspaceSubphaseUpdate({
                              draft: event.target.value,
                            })
                          }
                        />
                        <textarea
                          className="editor"
                          rows={6}
                          value={workspaceSelectedSubphase.readingText}
                          onChange={(event) =>
                            handleWorkspaceSubphaseUpdate({
                              readingText: event.target.value,
                            })
                          }
                        />
                      </div>
                    </details>
                  ) : null}

                  {workspaceView === 'focus' ? (
                    <details
                      className="panel-card chat workspace-chat expandable"
                      open
                    >
                      <summary className="panel-summary">
                        <span>AI drafting chat</span>
                        <span className="muted">{workspaceChatLabel}</span>
                      </summary>
                      <div className="panel-body">
                        <div className="chat-scope">
                          {!isSubphaseLocked ? (
                            <button
                              className={`btn ${
                                workspaceChatScopeResolved === 'summary'
                                  ? 'primary'
                                  : 'ghost'
                              }`}
                              type="button"
                              onClick={() => setWorkspaceChatScope('summary')}
                            >
                              Summary
                            </button>
                          ) : null}
                          {workspaceSelectedSubphase ? (
                            <button
                              className={`btn ${
                                workspaceChatScopeResolved === 'subphase'
                                  ? 'primary'
                                  : 'ghost'
                              }`}
                              type="button"
                              onClick={() => setWorkspaceChatScope('subphase')}
                            >
                              Subphase
                            </button>
                          ) : null}
                        </div>
                        <div className="chat-thread">
                          {workspaceChat.length ? (
                            workspaceChat.map((line, index) => (
                              <div
                                key={`${line.role}-${index}`}
                                className={`chat-line ${line.role}`}
                              >
                                <span className="chat-role">
                                  {line.role === 'ai' ? 'AI' : 'You'}
                                </span>
                                <p>{line.text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="muted">
                              Ask for edits, clarity, or a rewrite of the canvas.
                            </p>
                          )}
                        </div>
                        <div className="chat-input">
                          <textarea
                            rows={3}
                            value={workspaceChatInput}
                            onChange={(event) =>
                              setWorkspaceChatInput(event.target.value)
                            }
                            placeholder="Ask the AI about this canvas..."
                          />
                          <button
                            className="btn primary"
                            type="button"
                            onClick={handleWorkspaceChatSubmit}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </details>
                  ) : null}

                </section>
                {workspaceView === 'focus' ? null : (
                  <aside className="workspace-rail right">
                    <details className="workspace-tools">
                      <summary>Research tray</summary>
                      <div className="workspace-tools-body">
                        <details className="panel-card tool-section" open>
                          <summary className="tool-summary">
                            <div className="panel-header">
                              <h3>Highlights</h3>
                              <span className="chip muted">
                                {workspaceHighlights.length}
                              </span>
                            </div>
                          </summary>
                          <div className="tool-body">
                            <p className="muted">
                              Select text in the narrative, then add a note or
                              question.
                            </p>
                            {workspaceHighlights.length ? (
                              <div className="tool-list">
                                {workspaceHighlights.map((highlight) => (
                                  <div key={highlight.id} className="tool-item">
                                    <p className="tool-text">{highlight.text}</p>
                                    <textarea
                                      className="tool-input"
                                      rows={2}
                                      value={highlight.note}
                                      onChange={(event) =>
                                        handleWorkspaceHighlightNote(
                                          highlight.id,
                                          event.target.value,
                                        )
                                      }
                                      placeholder="Add a note or question..."
                                    />
                                    <button
                                      className="btn ghost"
                                      type="button"
                                      onClick={() =>
                                        handleWorkspaceRemoveHighlight(
                                          highlight.id,
                                        )
                                      }
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="muted">No highlights yet.</p>
                            )}
                          </div>
                        </details>

                        <details className="panel-card tool-section" open>
                          <summary className="tool-summary">
                            <div className="panel-header">
                              <h3>Source snippets</h3>
                              <span className="chip muted">
                                {workspaceSnippets.length}
                              </span>
                            </div>
                          </summary>
                          <div className="tool-body">
                            <div className="snippet-form">
                              <textarea
                                className="tool-input"
                                rows={3}
                                value={snippetDraft}
                                onChange={(event) =>
                                  setSnippetDraft(event.target.value)
                                }
                                placeholder="Paste a key quote, excerpt, or fact."
                              />
                              <div className="snippet-actions">
                                <select
                                  className="tool-select"
                                  value={snippetTag}
                                  onChange={(event) =>
                                    setSnippetTag(
                                      event.target.value as SnippetTag,
                                    )
                                  }
                                >
                                  {snippetTags.map((tag) => (
                                    <option key={tag} value={tag}>
                                      {tag}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  className="btn ghost"
                                  type="button"
                                  onClick={handleWorkspaceAddSnippet}
                                  disabled={!snippetDraft.trim()}
                                >
                                  Add snippet
                                </button>
                              </div>
                            </div>
                            {workspaceSnippets.length ? (
                              <div className="tool-list">
                                {workspaceSnippets.map((snippet) => (
                                  <div key={snippet.id} className="tool-item">
                                    <textarea
                                      className="tool-input"
                                      rows={3}
                                      value={snippet.text}
                                      onChange={(event) =>
                                        handleWorkspaceUpdateSnippet(
                                          snippet.id,
                                          { text: event.target.value },
                                        )
                                      }
                                    />
                                    <div className="tool-meta">
                                      <select
                                        className="tool-select"
                                        value={snippet.tag}
                                        onChange={(event) =>
                                          handleWorkspaceUpdateSnippet(
                                            snippet.id,
                                            {
                                              tag: event.target.value as SnippetTag,
                                            },
                                          )
                                        }
                                      >
                                        {snippetTags.map((tag) => (
                                          <option key={tag} value={tag}>
                                            {tag}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        className="btn ghost"
                                        type="button"
                                        onClick={() =>
                                          handleWorkspaceRemoveSnippet(
                                            snippet.id,
                                          )
                                        }
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="muted">No snippets yet.</p>
                            )}
                          </div>
                        </details>

                        <details className="panel-card expandable" open>
                          <summary className="panel-summary">
                            <span>Versions</span>
                            <span className="chip muted">
                              {workspaceVersions.length}
                            </span>
                          </summary>
                          <div className="panel-body">
                            <button
                              className="btn ghost"
                              type="button"
                              onClick={handleWorkspaceSaveVersion}
                              disabled={!workspaceSummary.trim()}
                            >
                              Save version
                            </button>
                            {workspaceVersions.length ? (
                              <div className="tool-list">
                                {workspaceVersions.map((version) => {
                                  const preview =
                                    version.content.length > 160
                                      ? `${version.content.slice(0, 160)}...`
                                      : version.content
                                  return (
                                    <div key={version.id} className="tool-item">
                                      <div className="tool-meta">
                                        <span className="chip muted">
                                          {version.createdAt}
                                        </span>
                                      </div>
                                      <p className="tool-text">{preview}</p>
                                      <div className="tool-actions">
                                        <button
                                          className="btn ghost"
                                          type="button"
                                          onClick={() =>
                                            handleWorkspaceRestoreVersion(
                                              version.id,
                                            )
                                          }
                                        >
                                          Restore
                                        </button>
                                        <button
                                          className="btn ghost"
                                          type="button"
                                          onClick={() =>
                                            handleWorkspaceRemoveVersion(
                                              version.id,
                                            )
                                          }
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="muted">No versions saved yet.</p>
                            )}
                          </div>
                        </details>
                      </div>
                    </details>

                    <details className="workspace-details">
                      <summary>Overview and linked sources</summary>
                      <div className="workspace-details-body">
                        <details className="panel-card expandable" open>
                          <summary className="panel-summary">
                            <span>Top layer overview</span>
                            <span className="chip muted">Web</span>
                          </summary>
                          <div className="panel-body">
                            <p>{workspaceWebOverview}</p>
                            <ul className="source-list">
                              {workspaceWebSources.map((source) => (
                                <li key={source}>{source}</li>
                              ))}
                            </ul>
                            <button
                              className="btn ghost"
                              type="button"
                              onClick={handleWorkspaceRefreshOverview}
                            >
                              Refresh overview
                            </button>
                            {workspaceSelectedSubphase ? (
                              <button
                                className="btn ghost"
                                type="button"
                                onClick={handleWorkspaceRefreshSubphaseOverview}
                              >
                                Refresh subphase brief
                              </button>
                            ) : null}
                          </div>
                        </details>
                        <details className="panel-card expandable">
                          <summary className="panel-summary">
                            <span>Linked sources</span>
                            <span className="chip muted">
                              {workspaceSources.length}
                            </span>
                          </summary>
                          <div className="panel-body">
                            <div className="source-grid compact">
                              {workspaceSources.slice(0, 3).map((source) => (
                                <div key={source.id} className="source-card">
                                  <div className="source-meta">
                                    <span className="chip">{source.type}</span>
                                    <span className="muted">{source.date}</span>
                                  </div>
                                  <h4>{source.title}</h4>
                                  <p>{source.excerpt}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </details>
                      </div>
                    </details>
                  </aside>
                )}
              </div>
            </div>
          ) : (
            <>
          {activeSection === 'Home' ? (
            <div className="home-view">
              <div className="page-header">
                <div>
                  <p className="eyebrow">Start</p>
                  <h1>Choose a category or connect ideas</h1>
                  <p className="lede">
                    Jump into phases, build entry pages, and map how ideas connect.
                  </p>
                </div>
              </div>

              <div className="home-layout">
                <section className="home-categories">
                  <div className="panel-header">
                    <h2>Main categories</h2>
                  </div>
                  <div className="category-grid">
                    <button
                      className="category-card"
                      type="button"
                      onClick={() => {
                        setActiveSection('Phases')
                        setActivePhaseTab('Overview')
                      }}
                    >
                      <p className="eyebrow">Phases</p>
                      <h3>{phaseCount} phases</h3>
                      <p className="muted">
                        {phaseSubphaseCount} subphases tracked
                      </p>
                    </button>
                    {entitySections.map((section) => (
                      <button
                        key={section}
                        className="category-card"
                        type="button"
                        onClick={() => {
                          setActiveSection(section)
                          setActiveEntityTab('Overview')
                        }}
                      >
                        <p className="eyebrow">{section}</p>
                        <h3>{entityCounts[section]} entries</h3>
                        <p className="muted">Explore linked narratives</p>
                      </button>
                    ))}
                    <button
                      className="category-card"
                      type="button"
                      onClick={() => setActiveSection('Library')}
                    >
                      <p className="eyebrow">Library</p>
                      <h3>{libraryItems.length} items</h3>
                      <p className="muted">Uploaded source material</p>
                    </button>
                  </div>
                </section>

                <aside className="home-rail">
                  <div className="panel-card home-actions">
                    <div className="panel-header">
                      <h3>Quick actions</h3>
                    </div>
                    <button
                      className="btn primary"
                      type="button"
                      onClick={handleOpenPhaseModal}
                    >
                      Create a phase
                    </button>
                    <div className="home-action-group">
                      <p className="muted">Create an entry</p>
                      <div className="chip-row">
                        {entitySections.map((section) => (
                          <button
                            key={section}
                            className="btn ghost small"
                            type="button"
                            onClick={() => {
                              setActiveSection(section)
                              setActiveEntityTab('Overview')
                              handleOpenEntityModal()
                            }}
                          >
                            {section}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <details className="panel-card collapsible-card">
                    <summary className="collapsible-summary">
                      <span>Connections</span>
                      <span className="chip muted">{connections.length}</span>
                    </summary>
                    <div className="collapsible-body">
                      <p className="muted">
                        Link phases, entries, and subphases to map relationships.
                      </p>
                      <div className="connection-builder">
                        <label className="form-field">
                          From
                          <select
                            value={connectionForm.from}
                            onChange={(event) =>
                              setConnectionForm((prev) => ({
                                ...prev,
                                from: event.target.value,
                              }))
                            }
                          >
                            <option value="">Select an item</option>
                            <optgroup label="Phases">
                              {connectionOptionGroups.phaseOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Phase subphases">
                              {connectionOptionGroups.phaseSubphaseOptions.map(
                                (option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ),
                              )}
                            </optgroup>
                            {entitySections.map((section) => (
                              <optgroup key={section} label={section}>
                                {connectionOptionGroups.entityOptions[section].map(
                                  (option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ),
                                )}
                              </optgroup>
                            ))}
                            {entitySections.map((section) => (
                              <optgroup
                                key={`${section}-subphases`}
                                label={`${section} subphases`}
                              >
                                {connectionOptionGroups.entitySubphaseOptions[section].map(
                                  (option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ),
                                )}
                              </optgroup>
                            ))}
                          </select>
                        </label>

                        <div className="form-row">
                          <label className="form-field">
                            Relation
                            <select
                              value={connectionForm.relation}
                              onChange={(event) =>
                                setConnectionForm((prev) => ({
                                  ...prev,
                                  relation: event.target
                                    .value as ConnectionRelation,
                                }))
                              }
                            >
                              {connectionRelations.map((relation) => (
                                <option key={relation} value={relation}>
                                  {relation}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="form-field">
                            To
                            <select
                              value={connectionForm.to}
                              onChange={(event) =>
                                setConnectionForm((prev) => ({
                                  ...prev,
                                  to: event.target.value,
                                }))
                              }
                            >
                              <option value="">Select an item</option>
                              <optgroup label="Phases">
                                {connectionOptionGroups.phaseOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Phase subphases">
                                {connectionOptionGroups.phaseSubphaseOptions.map(
                                  (option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ),
                                )}
                              </optgroup>
                              {entitySections.map((section) => (
                                <optgroup key={section} label={section}>
                                  {connectionOptionGroups.entityOptions[section].map(
                                    (option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ),
                                  )}
                                </optgroup>
                              ))}
                              {entitySections.map((section) => (
                                <optgroup
                                  key={`${section}-subphases-to`}
                                  label={`${section} subphases`}
                                >
                                  {connectionOptionGroups.entitySubphaseOptions[section].map(
                                    (option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ),
                                  )}
                                </optgroup>
                              ))}
                            </select>
                          </label>
                        </div>

                        <label className="form-field">
                          Note (optional)
                          <textarea
                            rows={2}
                            value={connectionForm.note}
                            onChange={(event) =>
                              setConnectionForm((prev) => ({
                                ...prev,
                                note: event.target.value,
                              }))
                            }
                            placeholder="Why are these connected?"
                          />
                        </label>
                        <div className="panel-actions">
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={handleSwapConnection}
                            disabled={!connectionForm.from || !connectionForm.to}
                          >
                            Swap
                          </button>
                          <button
                            className="btn primary"
                            type="button"
                            onClick={handleAddConnection}
                            disabled={!connectionForm.from || !connectionForm.to}
                          >
                            Save connection
                          </button>
                        </div>
                      </div>
                    </div>
                  </details>

                  <details
                    className="panel-card collapsible-card"
                    open={connections.length > 0}
                  >
                    <summary className="collapsible-summary">
                      <span>Connection list</span>
                      <span className="chip muted">{connections.length}</span>
                    </summary>
                    <div className="collapsible-body">
                      <div className="panel-actions">
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={() => setShowGraph(true)}
                        >
                          Open knowledge graph
                        </button>
                      </div>
                      {connections.length ? (
                        <div className="connection-list">
                          {connections.map((connection) => {
                            const from = resolveConnectionNode(
                              connection.from,
                              phaseData,
                              entityData,
                            )
                            const to = resolveConnectionNode(
                              connection.to,
                              phaseData,
                              entityData,
                            )
                            return (
                              <div
                                key={connection.id}
                                className="connection-item"
                              >
                                <div>
                                  <p className="connection-title">
                                    {from.label} {connection.relation}{' '}
                                    {to.label}
                                  </p>
                                  <p className="muted">
                                    {from.meta || to.meta
                                      ? `${from.meta}${from.meta && to.meta ? ' - ' : ''}${to.meta}`
                                      : 'Connection'}
                                  </p>
                                  {connection.note ? (
                                    <p className="connection-note">
                                      {connection.note}
                                    </p>
                                  ) : null}
                                </div>
                                <button
                                  className="btn ghost small"
                                  type="button"
                                  onClick={() =>
                                    handleDeleteConnection(connection.id)
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="muted">No connections yet.</p>
                      )}
                    </div>
                  </details>
                </aside>
              </div>
            </div>
          ) : null}
          {activeSection === 'Phases' && !selectedPhase ? (
            <div className="empty-state">
              <p className="eyebrow">Phases</p>
              <h1>No phases yet</h1>
              <p className="lede">
                Create a phase to start building subphases and shared drafts.
              </p>
              <button
                className="btn primary"
                type="button"
                onClick={handleOpenPhaseModal}
              >
                Create a phase
              </button>
            </div>
          ) : null}

          {activeSection === 'Phases' && selectedPhase ? (
            <div className="phase-view">
              <div className="page-header">
                <div>
                  <p className="eyebrow">Phases</p>
                  <h1>Write the phase narrative, then build subphases</h1>
                  <p className="lede">
                    Draft the main narrative, grow subphases, and attach
                    sources as you learn.
                  </p>
                </div>
                <div className="header-stats">
                  <div className="stat">
                    <span className="stat-label">Subphases</span>
                    <span className="stat-value">
                      {selectedPhase.subphases.length}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Sources linked</span>
                    <span className="stat-value">
                      {selectedPhase.sources.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="phase-layout">
                <section className="phase-list">
                  <div className="phase-list-header">
                    <h2>Phase board</h2>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={handleOpenPhaseModal}
                    >
                      Create phase
                    </button>
                  </div>
                  <div className="phase-cards">
                    {phaseData.map((phase, index) => (
                      <button
                        key={phase.id}
                        className={`phase-card ${
                          phase.id === selectedPhaseId ? 'active' : ''
                        }`}
                        onClick={() => {
                          setSelectedPhaseId(phase.id)
                          setSelectedSubphaseId(phase.subphases[0]?.id ?? '')
                          setActivePhaseTab('Overview')
                        }}
                        type="button"
                        data-animate
                        style={animateStyle(200 + index * 40)}
                      >
                        <h3>{phase.title}</h3>
                        <div className="phase-preview">
                          <p className="phase-range">{phase.range}</p>
                          <p className="phase-summary">{phase.summary}</p>
                        </div>
                      </button>
                    ))}
                    <div className="phase-card create">
                      <p className="phase-range">Custom</p>
                      <h3>Define a new phase</h3>
                      <p>
                        Describe the phase and let the AI draft a narrative and
                        starter subphase.
                      </p>
                      <button
                        className="btn primary"
                        type="button"
                        onClick={handleOpenPhaseModal}
                      >
                        Build a phase
                      </button>
                    </div>
                  </div>
                </section>

                <section className="phase-detail">
                  <div className="phase-hero" data-animate style={animateStyle(240)}>
                    <div>
                      <p className="eyebrow">Selected phase</p>
                      <h2>{selectedPhase.title}</h2>
                      <p>{selectedPhase.summary}</p>
                    </div>
                    <div className="phase-meta">
                      <div className="stat">
                        <span className="stat-label">Range</span>
                        <span className="stat-value">
                          {selectedPhase.range}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Subphases</span>
                        <span className="stat-value">
                          {selectedPhase.subphases.length}
                        </span>
                      </div>
                      <div className="phase-meta-actions">
                        <button
                          className="btn secondary phase-action"
                          type="button"
                          onClick={handleOpenPhaseWorkspace}
                        >
                          Open workspace
                        </button>
                        <button
                          className="btn danger phase-action"
                          type="button"
                          onClick={() => handleDeletePhase(selectedPhase.id)}
                        >
                          Delete phase
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="phase-tabs">
                    {phaseTabs.map((tab) => (
                      <button
                        key={tab}
                        className={`phase-tab ${
                          activePhaseTab === tab ? 'active' : ''
                        }`}
                        onClick={() => setActivePhaseTab(tab)}
                        type="button"
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="phase-panel" data-animate style={animateStyle(300)}>
                    {activePhaseTab === 'Overview' && (
                      <>
                      <div className="panel-grid two-col">
                        <div className="panel-card">
                          <div className="panel-header">
                            <h3>Phase narrative</h3>
                            <div className="panel-actions">
                              <span className="chip muted">Editable</span>
                              <button
                                className="btn ghost"
                                type="button"
                                onClick={handleGeneratePhaseNarrative}
                                disabled={isNarrativeDrafting}
                              >
                                {isNarrativeDrafting
                                  ? 'Drafting...'
                                  : 'Draft with AI'}
                              </button>
                              <button
                                className="btn ghost"
                                type="button"
                                onClick={handleRefinePhaseNarrative}
                                disabled={
                                  isNarrativeRefining ||
                                  !selectedPhase.summary.trim()
                                }
                              >
                                {isNarrativeRefining
                                  ? 'Refining...'
                                  : 'Refine with AI'}
                              </button>
                            </div>
                          </div>
                          <textarea
                            className="editor"
                            rows={12}
                            value={selectedPhase.summary}
                            onChange={(event) =>
                              updatePhase(selectedPhase.id, {
                                summary: event.target.value,
                              })
                            }
                            placeholder="Write the long-form narrative for this phase."
                          />
                        </div>
                        <div className="panel-card">
                          <div className="panel-header">
                            <h3>Top layer overview</h3>
                            <span className="chip muted">Web</span>
                          </div>
                          <p>{selectedPhase.webOverview}</p>
                          <ul className="source-list">
                            {selectedPhase.webSources.map((source) => (
                              <li key={source}>{source}</li>
                            ))}
                          </ul>
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={handleRefreshPhaseOverview}
                          >
                            Refresh overview
                          </button>
                        </div>
                      </div>
                      </>
                    )}

                    {activePhaseTab === 'Subphases' && selectedSubphase && (
                      <div className="subphase-layout">
                        <div className="panel-card subphase-list">
                          <div className="panel-header">
                            <h3>Subphases</h3>
                            <button
                              className="btn ghost"
                              type="button"
                              onClick={() =>
                                setIsAddingSubphase((open) => !open)
                              }
                            >
                              {isAddingSubphase ? 'Close' : 'Add subphase'}
                            </button>
                          </div>
                          {isAddingSubphase ? (
                            <div className="subphase-form">
                              <label className="form-field">
                                Describe the subphase
                                <textarea
                                  rows={3}
                                  value={subphaseForm.prompt}
                                  onChange={(event) =>
                                    setSubphaseForm((prev) => ({
                                      ...prev,
                                      prompt: event.target.value,
                                    }))
                                  }
                                  placeholder="1789 French Revolution, early assemblies, key turning points."
                                />
                              </label>
                              <p className="muted">
                                The AI will name the subphase and draft the
                                starter prompt.
                              </p>
                              <div className="subphase-actions">
                                <button
                                  className="btn ghost"
                                  type="button"
                                  onClick={() => {
                                    setIsAddingSubphase(false)
                                    setSubphaseForm({
                                      prompt: '',
                                    })
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="btn primary"
                                  type="button"
                                  onClick={handleAddSubphase}
                                  disabled={
                                    !subphaseForm.prompt.trim() ||
                                    isCreatingSubphase
                                  }
                                >
                                  {isCreatingSubphase
                                    ? 'Creating...'
                                    : 'Create with AI'}
                                </button>
                              </div>
                            </div>
                          ) : null}
                          <div className="subphase-stack">
                            {selectedPhase.subphases.map((subphase) => (
                              <button
                                key={subphase.id}
                                className={`subphase-card ${
                                  subphase.id === selectedSubphase.id
                                    ? 'active'
                                    : ''
                                }`}
                                type="button"
                                onClick={() => setSelectedSubphaseId(subphase.id)}
                              >
                                <div className="subphase-card-actions">
                                  <button
                                    className="delete"
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      handleDeleteSubphase(subphase.id)
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                                <p className="phase-range">{subphase.range}</p>
                                <h4>{subphase.title}</h4>
                                <p className="muted">{subphase.prompt}</p>
                                <div className="tag-grid">
                                  {subphase.focusPoints
                                    .slice(0, 2)
                                    .map((point) => (
                                      <span key={point} className="chip muted">
                                        {point}
                                      </span>
                                    ))}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="subphase-detail">
                          <div className="panel-card">
                            <div className="panel-header">
                              <h3>{selectedSubphase.title}</h3>
                              <span className="chip">{selectedSubphase.range}</span>
                            </div>
                            <p className="muted">
                              Prompt: {selectedSubphase.prompt}
                            </p>
                            <div className="subphase-section">
                              <div className="panel-header">
                                <h4>Web overview</h4>
                                <span className="chip muted">Web</span>
                              </div>
                              <p>{selectedSubphase.webOverview}</p>
                              <ul className="source-list">
                                {selectedSubphase.webSources.map((source) => (
                                  <li key={source}>{source}</li>
                                ))}
                              </ul>
                              <button
                                className="btn ghost"
                                type="button"
                                onClick={handleRefreshSubphaseOverview}
                              >
                                Refresh web brief
                              </button>
                            </div>
                            <div className="subphase-section">
                              <h4>Shared draft</h4>
                              <div className="editor-toolbar">
                                <input
                                  type="text"
                                  value={selectedSubphase.prompt}
                                  onChange={(event) =>
                                    updateSelectedSubphase({
                                      prompt: event.target.value,
                                    })
                                  }
                                  placeholder="Ask the AI to draft a paper..."
                                />
                                <button
                                  className="btn primary"
                                  type="button"
                                  onClick={handleGenerateDraft}
                                >
                                  Generate draft
                                </button>
                                <button
                                  className="btn ghost"
                                  type="button"
                                  onClick={handleSuggestEdits}
                                >
                                  Suggest edits
                                </button>
                              </div>
                              <textarea
                                className="editor"
                                rows={10}
                                value={selectedSubphase.draft}
                                onChange={(event) =>
                                  updateSelectedSubphase({
                                    draft: event.target.value,
                                  })
                                }
                              />
                              <p className="editor-meta">
                                Shared draft space for you and the AI. Edit the
                                text directly and link sources as you work.
                              </p>
                            </div>
                            <div className="subphase-section">
                              <h4>Reading text</h4>
                              <textarea
                                className="editor"
                                rows={6}
                                value={selectedSubphase.readingText}
                                onChange={(event) =>
                                  updateSelectedSubphase({
                                    readingText: event.target.value,
                                  })
                                }
                              />
                              <p className="editor-meta">
                                Paste or edit source text here so both you and
                                the AI can work directly on it.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activePhaseTab === 'Sources' && (
                      <div
                        className={`panel-grid sources ${
                          selectedPhase.sources.length ? '' : 'empty'
                        }`}
                      >
                        <div className="panel-card upload">
                          <h3>Add sources manually</h3>
                          <p>
                            Add documents, letters, ledgers, and other primary
                            sources to support your research.
                          </p>
                          <button
                            className="btn primary"
                            type="button"
                            onClick={handleOpenSourceModal}
                          >
                            Add source
                          </button>
                        </div>
                        {selectedPhase.sources.length ? (
                          <div className="source-grid">
                            {selectedPhase.sources.map((source) => (
                              <div key={source.id} className="source-card">
                                <div className="source-actions">
                                  <button
                                    className="delete"
                                    type="button"
                                    onClick={() => handleDeleteSource(source.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                                <div className="source-meta">
                                  <span className="chip">{source.type}</span>
                                  <span className="muted">
                                    {source.date} - {source.origin}
                                  </span>
                                </div>
                                <h4>{source.title}</h4>
                                <p>{source.excerpt}</p>
                                <div className="source-tags">
                                  {source.tags.map((tag) => (
                                    <span key={tag} className="chip muted">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              {source.fileName ? (
                                <p className="source-file">
                                  File: {source.fileName}
                                  {source.fileSize
                                    ? ` (${formatFileSize(source.fileSize)})`
                                    : ''}
                                </p>
                              ) : null}
                              {source.fileUrl ? (
                                <a
                                  className="source-link"
                                  href={resolveSyncFileUrl(source.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open file
                                </a>
                              ) : null}
                              <p className="confidence">{source.confidence}</p>
                            </div>
                          ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            <h3>No sources yet</h3>
                            <p>Add your first source to start linking evidence.</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {isEntitySection(activeSection) && (
            <div className="entity-view">
              <div className="page-header">
                <div>
                  <p className="eyebrow">{activeSection}</p>
                  <h1>Write the entry narrative, then build subphases</h1>
                  <p className="lede">
                    Draft the main narrative, grow subphases, and attach
                    sources as you learn.
                  </p>
                </div>
                <div className="header-stats">
                  {selectedEntity ? (
                    <>
                      <div className="stat">
                        <span className="stat-label">Subphases</span>
                        <span className="stat-value">
                          {selectedEntity.subphases.length}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Sources linked</span>
                        <span className="stat-value">
                          {selectedEntity.sources.length}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="entity-layout">
                <section className="entity-list">
                  <div className="entity-list-header">
                    <h2>{activeSection}</h2>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={handleOpenEntityModal}
                    >
                      Create entry
                    </button>
                  </div>
                  <div className="entity-cards">
                    {entityData[activeSection].map((entity) => (
                      <button
                        key={entity.id}
                        className={`entity-card ${
                          entity.id === selectedEntityId ? 'active' : ''
                        }`}
                        type="button"
                        onClick={() => {
                          setEntitySelection((prev) => ({
                            ...prev,
                            [activeSection]: entity.id,
                          }))
                          setSelectedEntitySubphaseId(
                            entity.subphases[0]?.id ?? '',
                          )
                          setActiveEntityTab('Overview')
                        }}
                      >
                        <h3>{entity.name}</h3>
                        <div className="entity-preview">
                          <p className="phase-range">{entity.era}</p>
                          <p className="entity-summary">{entity.summary}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {selectedEntity ? (
                  <section className="entity-detail">
                    <div className="phase-hero">
                      <div>
                        <p className="eyebrow">Selected</p>
                        <h2>{selectedEntity.name}</h2>
                        <p>{selectedEntity.summary}</p>
                      </div>
                      <div className="phase-meta">
                        <div className="stat">
                          <span className="stat-label">Era</span>
                          <span className="stat-value">
                            {selectedEntity.era}
                          </span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Subphases</span>
                          <span className="stat-value">
                            {selectedEntity.subphases.length}
                          </span>
                        </div>
                        <div className="phase-meta-actions">
                          <button
                            className="btn secondary phase-action"
                            type="button"
                            onClick={handleOpenEntityWorkspace}
                          >
                            Open workspace
                          </button>
                          <button
                            className="btn danger phase-action"
                            type="button"
                            onClick={() =>
                              handleDeleteEntity(
                                activeSection,
                                selectedEntity.id,
                              )
                            }
                          >
                            Delete entry
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="phase-tabs">
                      {entityTabs.map((tab) => (
                        <button
                          key={tab}
                          className={`phase-tab ${
                            activeEntityTab === tab ? 'active' : ''
                          }`}
                          onClick={() => setActiveEntityTab(tab)}
                          type="button"
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="phase-panel">
                      {activeEntityTab === 'Overview' && (
                        <div className="panel-grid two-col">
                          <div className="panel-card">
                            <div className="panel-header">
                              <h3>Entry narrative</h3>
                              <div className="panel-actions">
                                <span className="chip muted">Editable</span>
                                <button
                                  className="btn ghost"
                                  type="button"
                                  onClick={handleGenerateEntityNarrative}
                                  disabled={isNarrativeDrafting}
                                >
                                  {isNarrativeDrafting
                                    ? 'Drafting...'
                                    : 'Draft with AI'}
                                </button>
                                <button
                                  className="btn ghost"
                                  type="button"
                                  onClick={handleRefineEntityNarrative}
                                  disabled={
                                    isNarrativeRefining ||
                                    !selectedEntity.summary.trim()
                                  }
                                >
                                  {isNarrativeRefining
                                    ? 'Refining...'
                                    : 'Refine with AI'}
                                </button>
                              </div>
                            </div>
                            <textarea
                              className="editor"
                              rows={12}
                              value={selectedEntity.summary}
                              onChange={(event) =>
                                updateEntity(activeSection, selectedEntity.id, {
                                  summary: event.target.value,
                                })
                              }
                              placeholder="Write the long-form narrative for this entry."
                            />
                          </div>
                          <div className="panel-card">
                            <div className="panel-header">
                              <h3>Top layer overview</h3>
                              <span className="chip muted">Web</span>
                            </div>
                            <p>{selectedEntity.webOverview}</p>
                            <ul className="source-list">
                              {selectedEntity.webSources.map((source) => (
                                <li key={source}>{source}</li>
                              ))}
                            </ul>
                            <button
                              className="btn ghost"
                              type="button"
                              onClick={handleRefreshEntityOverview}
                            >
                              Refresh overview
                            </button>
                          </div>
                        </div>
                      )}

                      {activeEntityTab === 'Subphases' &&
                        selectedEntitySubphase && (
                          <div className="subphase-layout">
                            <div className="panel-card subphase-list">
                              <div className="panel-header">
                                <h3>Subphases</h3>
                                <button
                                  className="btn ghost"
                                  type="button"
                                  onClick={() =>
                                    setIsAddingEntitySubphase((open) => !open)
                                  }
                                >
                                  {isAddingEntitySubphase
                                    ? 'Close'
                                    : 'Add subphase'}
                                </button>
                              </div>
                              {isAddingEntitySubphase ? (
                                <div className="subphase-form">
                                  <label className="form-field">
                                    Describe the subphase
                                    <textarea
                                      rows={3}
                                      value={entitySubphaseForm.prompt}
                                      onChange={(event) =>
                                        setEntitySubphaseForm((prev) => ({
                                          ...prev,
                                          prompt: event.target.value,
                                        }))
                                      }
                                      placeholder="Key leaders and policies during this era."
                                    />
                                  </label>
                                  <p className="muted">
                                    The AI will name the subphase and draft the
                                    starter prompt.
                                  </p>
                                  <div className="subphase-actions">
                                    <button
                                      className="btn ghost"
                                      type="button"
                                      onClick={() => {
                                        setIsAddingEntitySubphase(false)
                                        setEntitySubphaseForm({
                                          prompt: '',
                                        })
                                      }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      className="btn primary"
                                      type="button"
                                      onClick={handleAddEntitySubphase}
                                      disabled={
                                        !entitySubphaseForm.prompt.trim() ||
                                        isCreatingEntitySubphase
                                      }
                                    >
                                      {isCreatingEntitySubphase
                                        ? 'Creating...'
                                        : 'Create with AI'}
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                              <div className="subphase-stack">
                                {selectedEntity.subphases.map((subphase) => (
                                  <button
                                    key={subphase.id}
                                    className={`subphase-card ${
                                      subphase.id ===
                                      selectedEntitySubphase.id
                                        ? 'active'
                                        : ''
                                    }`}
                                    type="button"
                                    onClick={() =>
                                      setSelectedEntitySubphaseId(subphase.id)
                                    }
                                  >
                                    <div className="subphase-card-actions">
                                      <button
                                        className="delete"
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          handleDeleteEntitySubphase(subphase.id)
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                    <p className="phase-range">
                                      {subphase.range}
                                    </p>
                                    <h4>{subphase.title}</h4>
                                    <p className="muted">{subphase.prompt}</p>
                                    <div className="tag-grid">
                                      {subphase.focusPoints
                                        .slice(0, 2)
                                        .map((point) => (
                                          <span
                                            key={point}
                                            className="chip muted"
                                          >
                                            {point}
                                          </span>
                                        ))}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="subphase-detail">
                              <div className="panel-card">
                                <div className="panel-header">
                                  <h3>{selectedEntitySubphase.title}</h3>
                                  <span className="chip">
                                    {selectedEntitySubphase.range}
                                  </span>
                                </div>
                                <p className="muted">
                                  Prompt: {selectedEntitySubphase.prompt}
                                </p>
                                <div className="subphase-section">
                                  <div className="panel-header">
                                    <h4>Web overview</h4>
                                    <span className="chip muted">Web</span>
                                  </div>
                                  <p>{selectedEntitySubphase.webOverview}</p>
                                  <ul className="source-list">
                                    {selectedEntitySubphase.webSources.map(
                                      (source) => (
                                        <li key={source}>{source}</li>
                                      ),
                                    )}
                                  </ul>
                                  <button
                                    className="btn ghost"
                                    type="button"
                                    onClick={handleRefreshEntitySubphaseOverview}
                                  >
                                    Refresh web brief
                                  </button>
                                </div>
                                <div className="subphase-section">
                                  <h4>Shared draft</h4>
                                  <div className="editor-toolbar">
                                    <input
                                      type="text"
                                      value={selectedEntitySubphase.prompt}
                                      onChange={(event) =>
                                        updateSelectedEntitySubphase({
                                          prompt: event.target.value,
                                        })
                                      }
                                      placeholder="Ask the AI to draft a paper..."
                                    />
                                    <button
                                      className="btn primary"
                                      type="button"
                                      onClick={handleGenerateEntityDraft}
                                    >
                                      Generate draft
                                    </button>
                                    <button
                                      className="btn ghost"
                                      type="button"
                                      onClick={handleSuggestEntityEdits}
                                    >
                                      Suggest edits
                                    </button>
                                  </div>
                                  <textarea
                                    className="editor"
                                    rows={10}
                                    value={selectedEntitySubphase.draft}
                                    onChange={(event) =>
                                      updateSelectedEntitySubphase({
                                        draft: event.target.value,
                                      })
                                    }
                                  />
                                  <p className="editor-meta">
                                    Shared draft space for you and the AI. Edit
                                    the text directly and link sources as you
                                    work.
                                  </p>
                                </div>
                                <div className="subphase-section">
                                  <h4>Reading text</h4>
                                  <textarea
                                    className="editor"
                                    rows={6}
                                    value={selectedEntitySubphase.readingText}
                                    onChange={(event) =>
                                      updateSelectedEntitySubphase({
                                        readingText: event.target.value,
                                      })
                                    }
                                  />
                                  <p className="editor-meta">
                                    Paste or edit source text here so both you
                                    and the AI can work directly on it.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      {activeEntityTab === 'Sources' && (
                        <div
                          className={`panel-grid sources ${
                            selectedEntity.sources.length ? '' : 'empty'
                          }`}
                        >
                          <div className="panel-card upload">
                            <h3>Add sources</h3>
                            <p>
                              Link documents, PDFs, and images to this entity.
                            </p>
                            <button
                              className="btn primary"
                              type="button"
                              onClick={handleOpenSourceModal}
                            >
                              Add source
                            </button>
                          </div>
                          {selectedEntity.sources.length ? (
                            <div className="source-grid">
                              {selectedEntity.sources.map((source) => (
                                <div key={source.id} className="source-card">
                                  <div className="source-actions">
                                    <button
                                      className="delete"
                                      type="button"
                                      onClick={() => handleDeleteSource(source.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  <div className="source-meta">
                                    <span className="chip">{source.type}</span>
                                    <span className="muted">
                                      {source.date} - {source.origin}
                                    </span>
                                  </div>
                                  <h4>{source.title}</h4>
                                  <p>{source.excerpt}</p>
                                {source.fileName ? (
                                  <p className="source-file">
                                    File: {source.fileName}
                                    {source.fileSize
                                      ? ` (${formatFileSize(source.fileSize)})`
                                      : ''}
                                  </p>
                                ) : null}
                                {source.fileUrl ? (
                                  <a
                                    className="source-link"
                                    href={resolveSyncFileUrl(source.fileUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open file
                                  </a>
                                ) : null}
                                <div className="source-tags">
                                  {source.tags.map((tag) => (
                                    <span key={tag} className="chip muted">
                                      {tag}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="confidence">
                                    {source.confidence}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="empty-state">
                              <h3>No sources yet</h3>
                              <p>Add your first source to start linking evidence.</p>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          )}

          {activeSection === 'Library' && (
            <div className="library-view">
              <div className="page-header">
                <div>
                  <p className="eyebrow">Library</p>
                  <h1>Your uploaded materials</h1>
                  <p className="lede">
                    PDFs, photos, and manuscripts with OCR and metadata.
                  </p>
                </div>
                <div className="header-stats">
                  <div className="stat">
                    <span className="stat-label">Items</span>
                    <span className="stat-value">{libraryItems.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Need review</span>
                    <span className="stat-value">1</span>
                  </div>
                </div>
              </div>
              <div className="library-toolbar">
                <button className="btn ghost" type="button">
                  Filter by phase
                </button>
                <button className="btn ghost" type="button">
                  Filter by type
                </button>
              </div>
              <div className="library-grid">
                {libraryItems.map((item) => (
                  <div key={item.title} className="library-card">
                    <div className="library-header">
                      <h3>{item.title}</h3>
                      <span className="chip muted">{item.type}</span>
                    </div>
                    <p className="muted">Phase: {item.phase}</p>
                    <div className="library-meta">
                      <span>{item.status}</span>
                      <span>Added: {item.added}</span>
                    </div>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => handleOpenLibraryItem(item)}
                    >
                      Open source
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </main>
      </div>

      {isPhaseModalOpen ? (
        <div
          className="modal-scrim"
          onClick={() => setIsPhaseModalOpen(false)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-card">
              <div className="modal-header">
                <h3>New phase</h3>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setIsPhaseModalOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="modal-body">
                <label className="form-field">
                  Describe the phase
                  <textarea
                    rows={4}
                    value={phaseForm.prompt}
                    onChange={(event) =>
                      setPhaseForm((prev) => ({
                        ...prev,
                        prompt: event.target.value,
                      }))
                    }
                    placeholder="French Revolution 1789-1799, causes, major turning points, and key figures."
                  />
                </label>
                <p className="muted">
                  The AI will create the phase narrative and a starter
                  subphase you can refine later.
                </p>
              </div>
              <div className="modal-actions">
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setIsPhaseModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn primary"
                  type="button"
                  onClick={handleAddPhase}
                  disabled={!phaseForm.prompt.trim() || isCreatingPhase}
                >
                  {isCreatingPhase ? 'Creating...' : 'Create phase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isEntityModalOpen && isEntitySection(activeSection) ? (
        <div
          className="modal-scrim"
          onClick={() => setIsEntityModalOpen(false)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-card">
              <div className="modal-header">
                <h3>New entry</h3>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setIsEntityModalOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="modal-body">
                <label className="form-field">
                  Describe the entry
                  <textarea
                    rows={4}
                    value={entityForm.prompt}
                    onChange={(event) =>
                      setEntityForm((prev) => ({
                        ...prev,
                        prompt: event.target.value,
                      }))
                    }
                    placeholder="Ottoman Empire 1450-1700, expansion, trade routes, and governance."
                  />
                </label>
                <p className="muted">
                  The AI will create the entry narrative and a starter
                  subphase you can refine later.
                </p>
              </div>
              <div className="modal-actions">
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setIsEntityModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn primary"
                  type="button"
                  onClick={handleAddEntity}
                  disabled={!entityForm.prompt.trim() || isCreatingEntity}
                >
                  {isCreatingEntity ? 'Creating...' : 'Create entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Source Modal */}
      {isSourceModalOpen ? (
        <div
          className="modal-scrim"
          onClick={() => setIsSourceModalOpen(false)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-card">
              <div className="modal-header">
                <h3>Add Source</h3>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setIsSourceModalOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="modal-body">
                <label className="form-field">
                  Upload document
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.rtf,text/plain,image/*"
                    onChange={handleSourceFileChange}
                  />
                </label>
                <label className="form-field">
                  Title
                  <input
                    type="text"
                    value={sourceForm.title}
                    onChange={(e) =>
                      setSourceForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Royal decree on trade regulations"
                  />
                </label>
                <div className="form-row">
                  <label className="form-field">
                    Type
                    <select
                      value={sourceForm.type}
                      onChange={(e) =>
                        setSourceForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                    >
                      <option value="Document">Document</option>
                      <option value="Letter">Letter</option>
                      <option value="Ledger">Ledger</option>
                      <option value="Map">Map</option>
                      <option value="Speech">Speech</option>
                      <option value="Treaty">Treaty</option>
                      <option value="Edict">Edict</option>
                      <option value="Diary">Diary</option>
                      <option value="Book">Book</option>
                      <option value="Article">Article</option>
                      <option value="PDF">PDF</option>
                      <option value="Image">Image</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label className="form-field">
                    Date
                    <input
                      type="text"
                      value={sourceForm.date}
                      onChange={(e) =>
                        setSourceForm((prev) => ({ ...prev, date: e.target.value }))
                      }
                      placeholder="1598"
                    />
                  </label>
                </div>
                <label className="form-field">
                  Origin / Location
                  <input
                    type="text"
                    value={sourceForm.origin}
                    onChange={(e) =>
                      setSourceForm((prev) => ({ ...prev, origin: e.target.value }))
                    }
                    placeholder="Paris, France"
                  />
                </label>
                <label className="form-field">
                  Excerpt / Key Content
                  <textarea
                    rows={3}
                    value={sourceForm.excerpt}
                    onChange={(e) =>
                      setSourceForm((prev) => ({ ...prev, excerpt: e.target.value }))
                    }
                    placeholder="Key passage or description of the source..."
                  />
                </label>
                <label className="form-field">
                  Tags (comma separated)
                  <input
                    type="text"
                    value={sourceForm.tags}
                    onChange={(e) =>
                      setSourceForm((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    placeholder="trade, policy, law"
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setIsSourceModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn primary"
                  type="button"
                  onClick={handleAddSource}
                >
                  Add Source
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Knowledge Graph */}
      {showGraph ? (
        <div className="graph-container" onClick={() => setShowGraph(false)}>
          <div className="graph-panel" onClick={(e) => e.stopPropagation()}>
            <div className="graph-header">
              <h2>Knowledge Graph</h2>
              <button
                className="btn ghost"
                type="button"
                onClick={() => setShowGraph(false)}
              >
                Close
              </button>
            </div>
            <div className="graph-canvas">
              <div className="graph-section">
                <div className="graph-section-title">Phases</div>
                <div className="graph-nodes">
                  {phaseData.map((phase) => {
                    const count = getConnectionCount({
                      kind: 'phase',
                      phaseId: phase.id,
                    })
                    return (
                      <div
                        key={phase.id}
                        className={`graph-node phase${
                          count > 0 ? ' linked' : ''
                        }`}
                        onClick={() => {
                          setSelectedPhaseId(phase.id)
                          setActiveSection('Phases')
                          setShowGraph(false)
                        }}
                      >
                        <div className="graph-node-title">{phase.title}</div>
                        <div className="graph-node-meta">{phase.range}</div>
                        {count > 0 && (
                          <div className="graph-node-meta">
                            {count} connections
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="graph-section">
                <div className="graph-section-title">Phase subphases</div>
                <div className="graph-nodes">
                  {phaseData
                    .flatMap((phase) =>
                      phase.subphases.map((subphase) => ({
                        phase,
                        subphase,
                      })),
                    )
                    .filter(
                      ({ phase, subphase }) =>
                        getConnectionCount({
                          kind: 'phase-subphase',
                          phaseId: phase.id,
                          subphaseId: subphase.id,
                        }) > 0,
                    )
                    .map(({ phase, subphase }) => {
                      const count = getConnectionCount({
                        kind: 'phase-subphase',
                        phaseId: phase.id,
                        subphaseId: subphase.id,
                      })
                      return (
                        <div
                          key={subphase.id}
                          className={`graph-node subphase${
                            count > 0 ? ' linked' : ''
                          }`}
                          onClick={() => {
                            setSelectedPhaseId(phase.id)
                            setSelectedSubphaseId(subphase.id)
                            setActiveSection('Phases')
                            setActivePhaseTab('Subphases')
                            setShowGraph(false)
                          }}
                        >
                          <div className="graph-node-title">
                            {subphase.title}
                          </div>
                          <div className="graph-node-meta">{phase.title}</div>
                          {count > 0 && (
                            <div className="graph-node-meta">
                              {count} connections
                            </div>
                          )}
                        </div>
                      )
                    })}
                  {!phaseData.some((phase) =>
                    phase.subphases.some(
                      (subphase) =>
                        getConnectionCount({
                          kind: 'phase-subphase',
                          phaseId: phase.id,
                          subphaseId: subphase.id,
                        }) > 0,
                    ),
                  ) ? (
                    <p className="muted">No linked phase subphases yet.</p>
                  ) : null}
                </div>
              </div>

              {entitySections.map((section) => (
                <div key={section} className="graph-section">
                  <div className="graph-section-title">{section}</div>
                  <div className="graph-nodes">
                    {entityData[section].map((entity) => {
                      const count = getConnectionCount({
                        kind: 'entity',
                        section,
                        entityId: entity.id,
                      })
                      return (
                        <div
                          key={entity.id}
                          className={`graph-node entity${
                            count > 0 ? ' linked' : ''
                          }`}
                          onClick={() => {
                            setEntitySelection((prev) => ({
                              ...prev,
                              [section]: entity.id,
                            }))
                            setActiveSection(section)
                            setShowGraph(false)
                          }}
                        >
                          <div className="graph-node-title">{entity.name}</div>
                          <div className="graph-node-meta">{entity.era}</div>
                          {count > 0 && (
                            <div className="graph-node-meta">
                              {count} connections
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div className="graph-section">
                <div className="graph-section-title">Entry subphases</div>
                <div className="graph-nodes">
                  {entitySections
                    .flatMap((section) =>
                      entityData[section].flatMap((entity) =>
                        entity.subphases.map((subphase) => ({
                          section,
                          entity,
                          subphase,
                        })),
                      ),
                    )
                    .filter(
                      ({ section, entity, subphase }) =>
                        getConnectionCount({
                          kind: 'entity-subphase',
                          section,
                          entityId: entity.id,
                          subphaseId: subphase.id,
                        }) > 0,
                    )
                    .map(({ section, entity, subphase }) => {
                      const count = getConnectionCount({
                        kind: 'entity-subphase',
                        section,
                        entityId: entity.id,
                        subphaseId: subphase.id,
                      })
                      return (
                        <div
                          key={subphase.id}
                          className={`graph-node subphase${
                            count > 0 ? ' linked' : ''
                          }`}
                          onClick={() => {
                            setEntitySelection((prev) => ({
                              ...prev,
                              [section]: entity.id,
                            }))
                            setSelectedEntitySubphaseId(subphase.id)
                            setActiveSection(section)
                            setActiveEntityTab('Subphases')
                            setShowGraph(false)
                          }}
                        >
                          <div className="graph-node-title">
                            {subphase.title}
                          </div>
                          <div className="graph-node-meta">{entity.name}</div>
                          {count > 0 && (
                            <div className="graph-node-meta">
                              {count} connections
                            </div>
                          )}
                        </div>
                      )
                    })}
                  {!entitySections.some((section) =>
                    entityData[section].some((entity) =>
                      entity.subphases.some(
                        (subphase) =>
                          getConnectionCount({
                            kind: 'entity-subphase',
                            section,
                            entityId: entity.id,
                            subphaseId: subphase.id,
                          }) > 0,
                      ),
                    ),
                  ) ? (
                    <p className="muted">No linked entry subphases yet.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    </>
  )
}

export default App
