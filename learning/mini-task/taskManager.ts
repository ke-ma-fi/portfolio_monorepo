const categories = ["work", "personal", "coding"];
const priorities = [1, 2, 3, 4, 5];

type Category = (typeof categories)[number];
type Priority = (typeof priorities)[number];

interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  state: boolean;
  notes: string[];
}

class TaskManager {
  private tasks: Task[] = [];
  private activeIds: Set<string> = new Set();
  private readonly PATH = "./tasks.json";

  async loadFile() {
    let file = Bun.file(this.PATH);

    if (await file.exists()) {
      this.tasks = await file.json();
      this.tasks.forEach((t) => {
        this.activeIds.add(t.id);
      });
    } else {
      console.log("File not found. Initializing new task list.");
      this.tasks = [];
      await Bun.write(this.PATH, JSON.stringify(this.tasks));
    }
  }

  async writeFile() {
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

  add(title: string, category: Category, priority: Priority) {
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

  toggle(id: string, state: boolean) {
    const index = this.tasks.findIndex((t) => t.id == id);
  }
}

/*
CLI __________________________________________________
*/

const tm = new TaskManager();
await tm.loadFile();

console.log("Welcome to the Task Manager CLI!");

while (true) {
  console.log("Available commands: 1 add task, 2 toggle task, 3 exit");
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

    // handle exit case
    case "3":
    case "exit":
      await tm.writeFile();
      console.log("Goodbye!");
      process.exit(0);

    // handle default
    default:
      console.log("Unknown command. Please try again.");
  }
}
