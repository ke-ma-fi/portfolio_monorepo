/*
Die Challenge: "The Word-Chain Validator"

Stell dir vor, Lotum baut ein neues Spiel, bei dem Spieler Wörter aneinanderreihen müssen. Deine Aufgabe ist es, eine Klasse WordChainEngine zu schreiben, die eine Kette von Wörtern validiert und Punkte berechnet.

Die Regeln:

    Jedes neue Wort muss mit dem letzten Buchstaben des vorherigen Wortes beginnen.

    Ein Wort darf in einer Kette nicht doppelt vorkommen.

    Punktesystem:

        Jeder Buchstabe gibt 10 Punkte.

        Wenn das Wort ein "X", "Y" oder "Z" enthält, gibt es einen Bonus von 50 Punkten für dieses Wort.

    Spezial-Regel: Wenn die Kette länger als 5 Wörter ist, verdoppelt sich die Punktzahl für jedes weitere Wort (Multiplikator).

Deine Aufgabe:
Implementiere eine Klasse WordChainEngine mit folgenden Methoden:

    addWord(word: string): boolean – Fügt ein Wort hinzu, wenn es die Regeln (1 & 2) erfüllt. Gibt true zurück, wenn erfolgreich, sonst false.

    getScore(): number – Berechnet den aktuellen Gesamtscore basierend auf Regel 3 & 4.

    reset(): void – Setzt die Kette zurück.
*/

interface IWordChainEngine {
  addWord(word: string): boolean;
  getHistory(): IWordStats[];
  getScore(): number;
  reset(): WordChainEngine;
}

interface IWordStats {
  word: string;
  score: number;
  multiply: boolean;
}

export class WordChainEngine implements IWordChainEngine {
  private wordChain: string[] = [];
  private usedWords: Set<string> = new Set();

  addWord(word: string): boolean {
    const newWord = word.trim().toLocaleLowerCase();
    const chainLenght = this.wordChain.length;

    //check if word already exists in O(1)
    if (this.usedWords.has(word)) {
      return false;
    }

    //check if last letter of last word matches first letter of new word
    if (chainLenght > 0) {
      const lastWord = this.wordChain[chainLenght - 1];
      if (!lastWord.endsWith(newWord[0])) {
        return false;
      }
    }

    //When all tests passed
    this.wordChain.push(newWord);
    this.usedWords.add(newWord);
    return true;
  }

  getHistory(): IWordStats[] {
    let history: IWordStats[] = this.wordChain.map((word, index) => ({
      word: word,
      score: this.getWordScore(word),
      multiply: index < 5 ? false : true,
    }));

    return history;
  }

  getScore(): number {
    let history = this.getHistory();
    const totalScore = history.reduce((acc, wordStat) => {
      const wordScore = wordStat.score;
      return acc + (wordStat.multiply ? wordScore * 2 : wordScore);
    }, 0);

    return totalScore;
  }

  reset(): WordChainEngine {
    this.wordChain = [];
    this.usedWords.clear();
    return this;
  }

  private getWordScore(word: string): number {
    let score = word.length * 10;

    //check for x,y or z and add bonus
    let bonus =
      word.includes("x") || word.includes("y") || word.includes("z")
        ? true
        : false;
    bonus && (score += 50);

    return score;
  }
}
