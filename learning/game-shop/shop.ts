/*
Die Challenge: "The Smart Game Shop" (60 Min)

Du sollst eine Klasse GameShop entwickeln. Ein Spieler hat ein Konto und ein Inventar. Der Shop hat Items, die man kaufen kann – aber manche Items haben Voraussetzungen (Requirements).
Die Anforderungen:

    Struktur (Interfaces):

        Item: Hat eine id, einen name, price (in Gold) und optional eine requiredLevel.

        Player: Hat einen name, level, gold und eine Liste von inventory (Item-IDs).

    Die Klasse GameShop:

        private player: Player: Der aktuelle Spieler.

        private catalog: Item[]: Die Liste aller verfügbaren Items im Shop.

    Methoden:

        buyItem(itemId: string): TransactionResult: Ein Spieler kauft ein Item.

            Check 1: Existiert das Item im Katalog?

            Check 2: Hat der Spieler genug Gold?

            Check 3: Erreicht der Spieler das requiredLevel?

            Check 4: Hat der Spieler das Item schon? (Keine Duplikate im Inventar).

        getAffordableItems(): Item[]: Gibt alle Items zurück, die sich der Spieler aktuell leisten kann (Level-Check inklusive!).

    TransactionResult (Typ):

        Die Methode buyItem soll nicht nur true/false zurückgeben, sondern ein Objekt: { success: boolean; message: string; remainingGold?: number }.
        */

type TransactionResult = {
  success: boolean;
  message: string;
  remainingGold?: number;
};

interface Item {
  id: string;
  name: string;
  price: number;
  requiredLevel?: number;
}

interface Player {
  level: number;
  gold: number;
  inventory: string[]; //item IDs
}

class GameShop {
  constructor(
    private player: Player,
    private catalog: Item[],
  ) {}

  getAffordableItems(): Item[] {
    let affordableItems = this.catalog.flatMap((item) =>
      this.player.level >= (item.requiredLevel || 0) &&
      this.player.gold >= item.price
        ? [item]
        : [],
    );
    return affordableItems;
  }

  buyItem(itemId: string): TransactionResult {
    let transaction: TransactionResult = {
      success: false,
      message: "",
      remainingGold: this.player.gold,
    };

    //check catalog and return early if no item is found
    let item = this.catalog.find((i) => i.id == itemId);
    if (!item) {
      transaction.message = "Item is not available in the catalog.";
      return transaction;
    }

    //check if item is affordable and return early if not affordable
    if (!this.getAffordableItems().includes(item)) {
      transaction.message =
        "You cannot afford this Item due to insufficient level or funds.";
      return transaction;
    }

    //check if item is already owned
    if (this.player.inventory.includes(item.id)) {
      transaction.message = "Item is already owned!";
      return transaction;
    }

    //if all checks passed now handle transaction
    this.player.inventory.push(item.id);
    transaction.message = "Item sucessfully added to your inventory!";
    transaction.remainingGold = this.player.gold - item.price;
    this.player.gold = transaction.remainingGold;

    return transaction;
  }
}
