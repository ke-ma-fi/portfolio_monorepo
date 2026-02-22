import { WordChainEngine } from "./game";

const game = new WordChainEngine();

console.log("Welcome to Word Chain!");
console.log('Type a word to start (or "exit" to quit):');

while (true) {
  // Bun's built-in prompt() reads from stdin synchronously
  const input = prompt("> ");

  // Handle Ctrl+D or empty input that might signify end of stream
  if (input === null) {
    console.log(`\nFinal Score: ${game.getScore()}`);
    break;
  }

  if (input == "history") {
    const history = game.getHistory();
    if (history.length === 0) {
      console.log("No words added yet.");
    } else {
      console.log("Word History:");
      history.forEach((entry, index) => {
        console.log(
          `${index + 1}. ${entry.word} - Score: ${entry.score}${
            entry.multiply ? " (Multiplier)" : ""
          }`,
        );
      });
    }
    continue;
  }

  const word = input.trim();
  if (word.toLowerCase() === "exit") {
    console.log(`Final Score: ${game.getScore()}`);
    break;
  }

  if (!word) continue;

  const success = game.addWord(word);

  if (success) {
    const history = game.getHistory();
    const last = history[history.length - 1];
    console.log(`Added "${last.word}"! Score: ${game.getScore()}`);
    if (last.multiply) console.log("Multiplier active!");
  } else {
    const history = game.getHistory();
    if (history.length > 0) {
      const lastWord = history[history.length - 1].word;
      const expectedStart = lastWord[lastWord.length - 1];

      if (!word.toLowerCase().startsWith(expectedStart)) {
        console.log(`Invalid! Word must start with "${expectedStart}".`);
      } else {
        console.log(`Invalid! Word might have been used already.`);
      }
    } else {
      console.log("Invalid word.");
    }
  }
}
