import AnkiExport from "anki-apkg-export";
import { writeFileSync } from "fs";
import { join } from "path";
import { crawl } from "./crawler";

export async function generateDeck() {
  const data = await crawl();
  const deck = new AnkiExport("Aria");

  for (const propOrState of data.propertiesAndStates) {
    deck.addCard(
      `'${propOrState.name}' é do uma property ou state?`,
      propOrState.type!,
    );

    const valueHref = propOrState.value.type;
    const value = data.valueTypes.find(x => x.href === valueHref);

    deck.addCard(`'${propOrState.name}' é de que tipo?`, value!.name);
  }

  return deck;
}

generateDeck()
  .then(deck => deck.save())
  .then(buf => writeFileSync(join(__dirname, "deck.apkg"), buf, "binary"));
