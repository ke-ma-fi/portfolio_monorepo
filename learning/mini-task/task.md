# Problem Set: Task-Pilot

## Motivation

In dieser Aufgabe schlüpfst du in die Rolle eines Software-Engineers, der ein Problem löst, das wir alle kennen: **Zu viele Aufgaben, zu wenig Fokus**. Du wirst ein Kommandozeilen-Tool (CLI) entwickeln, das nicht nur Daten verwaltet, sondern dem Nutzer hilft, Prioritäten zu setzen. Dabei nutzt du **Bun**, eine moderne JavaScript-Runtime, um Dateisystem-Operationen performant umzusetzen.

## Lernziele

- Anwendung von **Object-Oriented Programming (OOP)** in TypeScript.
- Implementierung von **File Persistence** (JSON).
- Entwicklung eines einfachen Algorithmus zur **Prioritäts-Gewichtung**.
- Umgang mit **Asynchronität** (`async`/`await`) beim Datei-I/O.

## Spezifikation

Erstelle eine Datei namens `tasky.ts`. Dein Programm muss folgende Anforderungen erfüllen:

### 1. Die Datenstruktur

Definiere einen Datentyp für einen **Task**. Jeder Task muss enthalten:

- Eine eindeutige **ID** (z. B. ein 4-stelliger zufälliger String).
- Einen **Titel**.
- Eine **Kategorie** (Wahl zwischen `'work'`, `'personal'`, `'coding'`).
- Eine **Priorität** (Ganzzahl von 1 bis 5).
- Einen **Status** (Boolean: `erledigt` oder `offen/false`).
- Eine Liste von **Notizen** (Array von Strings).

### 2. Die TaskManager-Klasse

Implementiere eine Klasse, die den Zustand deines Programms verwaltet:

- **Encapsulation**: Die Liste der Tasks muss `private` sein.
- **Persistence**:
  - Beim Instanziieren der Klasse soll eine Datei namens `tasks.json` geladen werden.
  - Nach jeder Änderung am Zustand (**Add**, **Toggle**, **Note**) muss die Datei asynchron überschrieben werden.
  - Nutze hierfür `Bun.file()` und `Bun.write()`.

### 3. Logik & Funktionen

Stelle Methoden für folgende Aktionen bereit:

1. `add`: Erstellt einen neuen Task mit Standardwerten für ID und Status.
2. `toggle`: Ändert den Status eines Tasks anhand seiner ID.
3. `note`: Fügt einem existierenden Task eine Notiz hinzu.
4. `focus`: Implementiere einen Algorithmus, der für jede Kategorie den "Load" berechnet:

   $$
   \text{Load} = \sum (\text{offene Tasks} \times \text{Priorität})
   $$

   Gib eine Empfehlung für die Kategorie mit dem höchsten Load aus.

### 4. Das Interface

Implementiere eine interaktive Schleife im Terminal:

- Nutze `Bun.prompt`, um Eingaben vom Nutzer abzufragen.
- Das Programm soll so lange laufen, bis der Nutzer `exit` eingibt.
- Stelle sicher, dass die Liste der Tasks übersichtlich im Terminal formatiert wird.

> **Pro-Tipps**
>
> - **Defensive Programming**: Was passiert, wenn die `tasks.json` noch nicht existiert? Was, wenn der Nutzer eine ID eingibt, die nicht existiert? Dein Programm sollte nicht abstürzen.
> - **Clean Code**: Halte deine Methoden kurz. Eine Methode sollte genau eine Sache tun (z. B. nur validieren oder nur speichern).
