'use client';

type Role = 'user' | 'ai';

interface Message {
  role: Role;
  text: string;
  label?: string;
  terminal?: { cmd: string; out: string; ok?: boolean };
}

interface Section {
  title: string;
  messages: Message[];
}

const sections: Section[] = [
  {
    title: 'Project Kick-off & Scope Definition',
    messages: [
      {
        role: 'user',
        text: 'Muss das für mein Einstellungsinterview bauen. Du bist mein Peer-Engineer. Wie sollten wir in die Aufgabe reinstartet?',
      },
      {
        role: 'ai',
        text: 'Das Wichtigste ist Scope-Management. Ich schlage diese Reihenfolge vor: Supabase Setup → Ingestion Script → RAG API Route → Frontend → Deployment & Doku. Wollen wir mit den zwei Architektur-Entscheidungen beginnen: LLM-Stack und Datenformat?',
      },
      {
        role: 'user',
        text: 'Wir nehmen bei beiden Entscheidungen Option 1 – OpenAI und lokales JSON. Ich hab sowieso schon ein OpenAI-Account mit 10€ Credit.',
        label: 'Entscheidung',
      },
      {
        role: 'ai',
        text: 'Perfekt. OpenAI (gpt-4o-mini + text-embedding-3-small) ist der absolute Industrie-Standard und mit dem Vercel AI SDK extrem schnell eingebunden. Das JSON-Format spart uns komplexe Parser-Logik. Wir können direkt loslegen.',
      },
    ],
  },
  {
    title: 'Architecture Decision: Multi-Tenancy',
    messages: [
      {
        role: 'user',
        text: 'Skizziere kurz was das fertige Feature können muss, wie ist der User Flow und wie sollen die Daten ingested werden?',
        label: 'System Design',
      },
      {
        role: 'ai',
        text: 'Das System muss Fragen ausschließlich auf Basis der eigenen Wissensbasis beantworten. User Flow: Workspace auswählen → Frage stellen → Antwort gestreamt empfangen. Die Mandantentrennung über workspace_id ist dabei nicht optional, sondern ein First-Class-Feature: Fragt IT nach Urlaubsregeln, darf das System kein HR-Dokument nutzen.',
      },
      {
        role: 'user',
        text: 'Solte ich die pgvector Extension auf public oder separatem extensions Schema enablen?',
        label: 'DB-Architektur',
      },
      {
        role: 'ai',
        text: 'Separates extensions Schema – unbedingt. Supabase generiert aus dem public Schema automatisch eine REST-API. pgvector installiert aber interne Hilfsfunktionen, die da nichts zu suchen haben. Best Practice in Postgres: App-Daten (Tabellen, Views) von Infrastruktur-Erweiterungen trennen.',
      },
      {
        role: 'user',
        text: 'Macht Sinn. Dann updaten wir die CLAUDE.md damit die Agenten auch explizit extensions.vector(1536) referenzieren und nicht einfach vector(1536) schreiben.',
        label: 'Entscheidung',
      },
    ],
  },
  {
    title: 'AI-Assisted Workflow: CLAUDE.md Engineering',
    messages: [
      {
        role: 'user',
        text: 'Ich code mit Claude Code und Antigravity. Kannst du mir eine CLAUDE.md fertig machen, welche ich nutzen kann um meine Tools up to date zu bringen? Engineere die Datei optimal für meine Tools und setze klare Richtlinien, Dos and Don\'ts, damit meine Agenten auf einem hohen und sicheren Standard arbeiten.',
        label: 'Tooling',
      },
      {
        role: 'ai',
        text: 'Smarter Move. Ich baue dir die CLAUDE.md so, dass sie LangChain/LlamaIndex explizit verbietet, die pgvector-Extension auf das extensions-Schema festnagelt, das .env.local-Handling absichert und den aktuellen Roadmap-Stand für die Agenten lesbar macht. Ein Agent, der deinen Kontext kennt, macht keine falschen Annahmen.',
      },
      {
        role: 'user',
        text: 'Nice. Und die Datei lebt im Repo-Root, wird also bei jedem Start automatisch von Claude Code eingelesen?',
      },
      {
        role: 'ai',
        text: 'Genau – Claude Code lädt CLAUDE.md beim Start automatisch als Kontext. Cursor liest .cursorrules. Du schreibst sie einmal sauber, alle Agenten-Sessions starten ab dann mit identischen Leitplanken. Das ist dein permanentes Gedächtnis für das Projekt.',
      },
    ],
  },
  {
    title: 'Cutting-Edge Tooling: MCP & Local Dev',
    messages: [
      {
        role: 'user',
        text: 'Supabase hat auch MCP. Sollten wir das nutzen? Kann ich meine KI nicht ohne Backend direkt mit Supabase sprechen lassen?',
        label: 'Architektur',
      },
      {
        role: 'ai',
        text: 'Wichtige Unterscheidung: MCP ist ein Dev-Tool, kein Production-Pattern. Für die Entwicklung kann Claude Code über MCP live in dein Supabase Schema schauen und exakte TypeScript-Interfaces generieren – das ist mächtig. Aber in der App selbst muss das Backend als sicherer Tresor für den OpenAI-Key bleiben. Ohne API-Route müsstest du den Key ins Frontend packen – das ist ein Sicherheitsproblem und würde gegen die Challenge-Vorgaben verstoßen.',
      },
      {
        role: 'user',
        text: 'Kann ich Claude Code auch lokal mit ner IDE nutzen oder geht das nur mit GitHub Repos?',
        label: 'Tooling',
      },
      {
        role: 'ai',
        text: 'Komplett lokal – kein GitHub nötig. Claude Code ist ein CLI-Tool und liest direkt dein lokales Dateisystem. Du öffnest das integrierte Terminal in VS Code oder Cursor, tippst `claude` und der Agent schreibt Dateien direkt auf deine Festplatte. Lokales Git solltest du trotzdem nutzen – KI-Agenten können Dinge überschreiben. Mit git commit nach jedem Schritt kannst du bei Bedarf jederzeit zurückrollen.',
      },
    ],
  },
  {
    title: 'Secrets & Security',
    messages: [
      {
        role: 'user',
        text: 'Wie handhaben wir die API Keys für die Reviewer – die sollen ja das Projekt testen können?',
        label: 'Security',
      },
      {
        role: 'ai',
        text: 'Standard-Pattern: .env.local mit echten Keys kommt in .gitignore und wird nie committed. Im Repo liegt nur .env.example mit Platzhaltern. Die README erklärt in drei Schritten das Setup. Optional deployen wir auf Vercel – dort hinterlegst du die Keys in den Environment Variables, die Reviewer öffnen einfach die URL und fertig: keine lokale Installation nötig.',
      },
      {
        role: 'user',
        text: 'Clean. Dann noch sicherstellen dass der OPENAI_API_KEY server-only bleibt und nie ins Client-Bundle landet.',
        label: 'Entscheidung',
      },
      {
        role: 'ai',
        text: 'Genau. In der CLAUDE.md verankern wir explizit: OPENAI_API_KEY ist server-only. Nur NEXT_PUBLIC_-Variablen dürfen ins Frontend. Der Route Handler in /api/chat ist der einzige Ort, der mit OpenAI und Supabase spricht.',
      },
    ],
  },
  {
    title: 'Coding Session: Der erste Prompt',
    messages: [
      {
        role: 'user',
        text: 'Das dort oben ist die fertige CLAUDE.md. Kannst du unter Berücksichtigung der Aufgabenstellung und des Entwurfs der Datei diesen Ordner initialisieren? Initialisiere dich selbst für optimale Arbeit und auch Tools wie Git.',
        label: 'Session-Start',
      },
      {
        role: 'ai',
        text: 'Verzeichnis ist leer — perfekter Ausgangspunkt. Ich initialisiere Git, schreibe CLAUDE.md aus dem Entwurf, lege .gitignore und .env.example an, sichere den Projektkontext im persistenten Memory und mache den ersten sauberen Commit.',
        terminal: {
          cmd: 'git init && git add CLAUDE.md .gitignore .env.example && git commit -m "chore: initialize project"',
          out: '[main (root-commit) b8679cd] chore: initialize project with CLAUDE.md, gitignore, and env example\n 3 files changed, 107 insertions(+)',
          ok: true,
        },
      },
      {
        role: 'user',
        text: 'Okay lass uns jetzt noch mal den Projektplan zusammen reviewen. Passt der so für dich? Hast du noch Fragen? Gibt\'s noch was zu verbessern?',
        label: 'Plan-Review',
      },
      {
        role: 'ai',
        text: 'Plan ist solide. Einzige kritische Anmerkung: Vercel AI SDK ist aktuell v6 — das hat Breaking Changes gegenüber allen Tutorials. useChat kommt aus @ai-sdk/react, nicht ai. sendMessage statt handleSubmit. msg.parts statt msg.content. convertToModelMessages ist async. Ich halte das im Plan als explizite Gotchas fest, damit der Agent keinen veralteten Code generiert.',
      },
      {
        role: 'user',
        text: 'Nice, Plan approved. Los geht\'s.',
        label: 'Entscheidung',
      },
    ],
  },
  {
    title: 'Quality Gates: TypeCheck, Build & Iterative Fixes',
    messages: [
      {
        role: 'ai',
        text: 'create-next-app schlägt fehl — das Verzeichnis heißt MVP_RAG und npm erlaubt keine Großbuchstaben in Package-Namen. Ich scaffold manuell: package.json, tsconfig, postcss, Verzeichnisstruktur. Das ist sauberer als ein Auto-Scaffold sowieso.',
        terminal: {
          cmd: 'pnpm dlx create-next-app@latest . --typescript --tailwind --app --src-dir',
          out: 'Could not create a project called "MVP_RAG" because of npm naming restrictions:\n  * name can no longer contain capital letters',
          ok: false,
        },
      },
      {
        role: 'ai',
        text: 'TypeScript strict mode schlägt an: Die SDK v6 Message-Typen passen nicht zu den selbst definierten Interfaces. ChatRequestBody modellierte parts als generisches Array — das kollidiert mit dem internen UIMessage-Typ des SDKs. Fix: direkt den SDK-Typ importieren statt duplizieren.',
        terminal: {
          cmd: 'pnpm tsc --noEmit',
          out: "src/app/api/chat/route.ts(14,5): error TS2322: Type '{ role: string; parts: ... }[]' is not assignable to type 'UIMessage[]'",
          ok: false,
        },
      },
      {
        role: 'ai',
        text: 'Supabase hat den Env-Var-Namen ihres Anon-Keys geändert: NEXT_PUBLIC_SUPABASE_ANON_KEY → NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY. .env.example, CLAUDE.md und den Supabase-Client-Factory aktualisiert.',
        terminal: {
          cmd: 'git commit -m "fix: rename anon key env var to Supabase\'s new publishable key name"',
          out: '[main 1b7ec0c] fix: rename anon key env var to Supabase\'s new publishable key name',
          ok: true,
        },
      },
      {
        role: 'ai',
        text: 'prepareSendMessagesRequest ersetzt den kompletten Request-Body — messages fehlten daher im POST an /api/chat. Fix: messages explizit in den Body aufnehmen. Ohne das kämen leere Arrays beim Server an und die RAG-Pipeline hätte keine Query zum Embedden.',
        terminal: {
          cmd: 'git commit -m "fix: include messages in prepareSendMessagesRequest body"',
          out: '[main aff846b] fix: include messages in prepareSendMessagesRequest body',
          ok: true,
        },
      },
      {
        role: 'user',
        text: 'Die Antworten sind manchmal leer, obwohl ich weiß dass die Daten in der DB sind.',
        label: 'Debug',
      },
      {
        role: 'ai',
        text: 'Match-Threshold von 0.5 ist zu konservativ für kurze FAQ-Texte. Cosine Similarity von 0.5 bedeutet, der Query-Vektor muss sehr nah am Dokumenten-Vektor sein — bei kurzen Chunks mit abweichendem Wording schlägt das oft fehl. Ich senke auf 0.2, das gibt dem System ausreichend Spielraum ohne Rauschen.',
        terminal: {
          cmd: 'git commit -m "feat: decrease match threshold in chat API from 0.5 to 0.2"',
          out: '[main 7ac5126] feat: Decrease document match threshold in chat API from 0.5 to 0.2',
          ok: true,
        },
      },
      {
        role: 'ai',
        text: 'Build ist grün. Alle TypeScript-Fehler behoben, Streaming funktioniert, Workspace-Isolation verifiziert: Acme HR beantwortet keine Engineering-Fragen und umgekehrt.',
        terminal: {
          cmd: 'pnpm build',
          out: '✓ Compiled successfully\n✓ Linting and checking validity of types\n✓ Collecting page data\n✓ Generating static pages (3/3)',
          ok: true,
        },
      },
    ],
  },
];

function TerminalBlock({ cmd, out, ok }: { cmd: string; out: string; ok?: boolean }) {
  return (
    <div className="mt-3 rounded-lg bg-zinc-950 border border-zinc-700 overflow-hidden text-xs font-mono">
      <div className="flex items-center gap-2 border-b border-zinc-700 px-3 py-1.5 bg-zinc-900">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-1 text-zinc-500">terminal</span>
      </div>
      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex items-start gap-2">
          <span className="text-emerald-400 shrink-0">$</span>
          <span className="text-zinc-300 break-all">{cmd}</span>
        </div>
        <div className={`pl-4 whitespace-pre-wrap leading-relaxed ${ok === false ? 'text-red-400' : 'text-zinc-500'}`}>
          {out}
        </div>
        {ok === true && (
          <div className="pl-4 text-emerald-400 flex items-center gap-1">
            <span>✓</span>
            <span>exit 0</span>
          </div>
        )}
      </div>
    </div>
  );
}

function UserBubble({ text, label }: { text: string; label?: string }) {
  return (
    <div className="flex flex-col items-end gap-1">
      {label && (
        <span className="text-xs font-semibold tracking-wide uppercase text-indigo-400 mr-1">
          {label}
        </span>
      )}
      <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-sm leading-relaxed text-white shadow-md">
        {text}
      </div>
    </div>
  );
}

function AiBubble({ text, terminal }: { text: string; terminal?: Message['terminal'] }) {
  return (
    <div className="flex items-start gap-3 max-w-[88%]">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-bold text-white shadow">
        AI
      </div>
      <div className="flex-1 rounded-2xl rounded-tl-sm bg-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-md">
        {text}
        {terminal && (
          <TerminalBlock cmd={terminal.cmd} out={terminal.out} ok={terminal.ok} />
        )}
      </div>
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">RAG Challenge</h1>
            <p className="text-xs text-zinc-400">AI-Assisted Engineering · Planning Session</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/50 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Next.js · Supabase · OpenAI
            </span>
          </div>
        </div>
      </header>

      {/* Intro */}
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="mb-10 text-center text-sm text-zinc-400 leading-relaxed">
          A curated look at how I used AI as a peer-engineering partner across the full project lifecycle —
          from architecture decisions and structured prompting to iterative type-checking and shipping a clean build.
        </p>

        <div className="space-y-14">
          {sections.map((section) => (
            <section key={section.title}>
              {/* Section label */}
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  {section.title}
                </span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              {/* Messages */}
              <div className="space-y-4">
                {section.messages.map((msg, i) =>
                  msg.role === 'user' ? (
                    <UserBubble key={i} text={msg.text} label={msg.label} />
                  ) : (
                    <AiBubble key={i} text={msg.text} terminal={msg.terminal} />
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-zinc-800 pt-8 text-center">
          <p className="text-xs text-zinc-500">
            Built with Next.js · Supabase pgvector · Vercel AI SDK · OpenAI
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Multi-tenant RAG system with workspace-scoped vector search
          </p>
        </div>
      </div>
    </div>
  );
}
