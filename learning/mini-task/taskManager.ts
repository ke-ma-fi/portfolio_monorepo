/*
(The current implementation is very basic and can be improved with better input handling, error checking, and a more user-friendly interface. The focus here is on demonstrating the functionality of the TaskManager class. Also the tasks only get saved permantly when exiting or saving manually. So if the programm crashes or is closed by strg+c, all unsaved changes will be lost. This can be improved by running the writeFile function after every method that changes the state of tasks.)
*/

const categories = ["work", "personal", "coding"];
const priorities = [1, 2, 3, 4, 5];

type Category = (typeof categories)[number];
type Priority = (typeof priorities)[number];
type Filter = { category?: Category; priority?: Priority; state?: boolean };
type Load = { category: Category; load: number };

interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  state: boolean;
  notes: string[];
}

interface ITaskManager {
  loadFile(): Promise<void>;
  writeFile(): Promise<void>;
  add(title: string, category: Category, priority: Priority): void;
  toggle(id: string): boolean;
  note(id: string, note: string): boolean;
  focus(): Load[];
  list({ category, priority, state }: Filter): Task[];
  show(id: string): Task | undefined;
}

class TaskManager implements ITaskManager {
  private tasks: Task[] = [];
  private activeIds: Set<string> = new Set();
  private readonly PATH = "./tasks.json";

  async loadFile(): Promise<void> {
    let file = Bun.file(this.PATH);

    if (await file.exists()) {
      this.tasks = await file.json();
      this.tasks.forEach((t) => {
        this.activeIds.add(t.id);
      });
    } else {
      console.log("File not found. Initializing new task list.");
      await Bun.write(this.PATH, JSON.stringify(this.tasks));
    }
  }

  async writeFile(): Promise<void> {
    const data = JSON.stringify(this.tasks);
    await Bun.write(this.PATH, data);
  }

  private getNewId(): string {
    while (true) {
      const id = Math.random().toString(36).substring(4, 6);
      if (!this.activeIds.has(id)) {
        this.activeIds.add(id);
        return id;
      }
    }
  }

  add(title: string, category: Category, priority: Priority): void {
    const newTask: Task = {
      id: this.getNewId(),
      title,
      category,
      priority,
      state: true,
      notes: [],
    };
    this.tasks.push(newTask);
  }

  toggle(id: string): boolean {
    let task = this.tasks.find((t) => t.id == id);
    if (task) {
      task.state = !task.state;
      return true;
    }
    console.log("This Task ID does not exist.");
    return false;
  }

  note(id: string, note: string): boolean {
    let task = this.tasks.find((t) => t.id == id);
    if (task) {
      task.notes.push(note);
      return true;
    }
    console.log("This Task ID does not exist.");
    return false;
  }

  focus(): Load[] {
    const loadObject = categories.map((c) => {
      const tasks = this.list({ category: c, state: true });
      let loadCount = 0;
      tasks.forEach((t) => {
        loadCount += t.priority;
      });
      return { category: c, load: loadCount };
    });
    return loadObject;
  }

  list({ category, priority, state }: Filter): Task[] {
    const tasks = this.tasks.filter((t) => {
      //Define matching and set the match-Gate to true when no input is provided
      const matchCategory = !category || t.category === category;
      const matchPriority = priority === undefined || t.priority === priority;
      const matchState = state === undefined || t.state === state;
      //return everything that passed the matching gate
      return matchCategory && matchPriority && matchState;
    });
    return tasks;
  }

  show(id: string): Task | undefined {
    const task = this.tasks.find((t) => t.id == id);
    if (!task) {
      return undefined;
    }
    return task;
  }
}

/*
CLI __________________________________________________
*/

const tm = new TaskManager();
await tm.loadFile();

console.log(
  "Welcome to the Task Manager CLI! Type 'help' for available commands.",
);

while (true) {
  console.log("\nEnter a command:");
  const input = prompt(">");
  if (!input) continue;

  switch (input) {
    //handle case 1 'add'
    case "1":
    case "add":
      let newTask: Partial<Task> = {};
      // Get Title from user
      console.log("Title:");
      const title = prompt(">");
      if (!title) {
        console.log("Title is required. Try again!");
        continue;
      }
      newTask.title = title;

      // Get category from user
      console.log("Category (work, [personal], coding)");
      const category = prompt(">");
      if (category && categories.includes(category)) {
        newTask.category = category;
      } else {
        console.log('No valid category provided. Defaulting to "personal".');
        newTask.category = "personal";
      }

      // Get priority from user
      console.log("Priority (1-5)");
      const priorityInput = prompt(">");
      if (priorityInput) {
        const priority = parseInt(priorityInput);
        if (priorities.includes(priority)) {
          newTask.priority = priority;
        } else {
          console.log("Invalid priority provided. Defaulting to 3.");
          newTask.priority = 3;
        }
      } else {
        console.log("No priority provided. Defaulting to 3.");
        newTask.priority = 3;
      }
      // Add the new task to the manager and finish the loop
      tm.add(newTask.title!, newTask.category!, newTask.priority!);
      break;

    // handle toggle case
    case "2":
    case "toggle":
      console.log("Task ID:");
      const toggleId = prompt(">");
      if (!toggleId) {
        console.log("Task ID is required. Try again!");
        continue;
      }
      tm.toggle(toggleId);
      break;

    // handle note case
    case "3":
    case "note":
      console.log("Task ID:");
      const noteId = prompt(">");
      if (!noteId) {
        console.log("Task ID is required. Try again!");
        continue;
      }
      console.log("Note:");
      const note = prompt(">");
      if (!note) {
        console.log("Note is required. Try again!");
        continue;
      }
      tm.note(noteId, note);
      break;

    // handle focus case
    case "4":
    case "focus":
      const load = tm.focus();
      load.forEach((l) => {
        console.log(`${l.category}: ${l.load}`);
      });
      break;

    // handle list case
    case "5":
    case "list":
      console.log(
        "Filter by category (work, personal, coding) or press Enter to skip:",
      );
      const filterCategory = prompt(">");
      console.log("Filter by priority (1-5) or press Enter to skip:");
      const filterPriorityInput = prompt(">");
      let filterPriority: Priority | undefined;
      if (filterPriorityInput) {
        const parsedPriority = parseInt(filterPriorityInput);
        if (priorities.includes(parsedPriority)) {
          filterPriority = parsedPriority;
        } else {
          console.log("Invalid priority filter. Ignoring.");
        }
      }
      console.log("Filter by state (open/closed) or press Enter to skip:");
      const filterStateInput = prompt(">");
      let filterState: boolean | undefined;
      if (filterStateInput) {
        if (filterStateInput.toLowerCase() === "open") {
          filterState = true;
        } else if (filterStateInput.toLowerCase() === "closed") {
          filterState = false;
        } else {
          console.log("Invalid state filter. Ignoring.");
        }
      }
      const filteredTasks = tm.list({
        category: filterCategory as Category,
        priority: filterPriority,
        state: filterState,
      });
      filteredTasks.forEach((t) => {
        console.log(
          `${t.id}: ${t.title} [${t.category}] (Priority: ${t.priority}) - ${t.state ? "open" : "closed"}`,
        );
      });
      break;

    // handle show case
    case "6":
    case "show":
      console.log("Task ID:");
      const showId = prompt(">");
      if (!showId) {
        console.log("Task ID is required. Try again!");
        continue;
      }
      const task = tm.show(showId);
      if (task) {
        console.log(`ID: ${task.id}
Title: ${task.title}
Category: ${task.category}
Priority: ${task.priority}
State: ${task.state ? "Open" : "Closed"}
Notes:
${task.notes.length > 0 ? task.notes.map((n, i) => `  ${i + 1}. ${n}`).join("\n") : "  No notes."}`);
      } else {
        console.log("Task not found.");
      }
      break;

    // handle save case
    case "8":
    case "save":
      await tm.writeFile();
      console.log("Tasks saved successfully.");
      break;

    // handle exit case
    case "9":
    case "exit":
      await tm.writeFile();
      console.log("Goodbye!");
      process.exit(0);

    // handle help case
    case "help":
      console.log(`
Available commands:
1. add - Add a new task
2. toggle - Toggle task state (complete/incomplete)
3. note - Add a note to a task
4. focus - Show load by category
5. list - List tasks with optional filters
6. show - Show details of a specific task
7. help - Show this help message
8. save - Save tasks to file
9. exit - Save and exit the application
      `);
      break;

    // handle default
    default:
      console.log("Unknown command. Please try again.");
  }
}
