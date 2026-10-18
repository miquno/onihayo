import { readFile, writeFile } from 'node:fs/promises';
import { importSelectedWords, readPinnedJmdictArchive, createDataset } from './import.ts';
import { validateSelection, validateWordDataset } from '../../../src/lib/content/words.ts';

const [archivePath, selectionPath, outputPath] = process.argv.slice(2);
if (!archivePath) {
  throw new Error(
    'Usage: node --experimental-strip-types scripts/content/jmdict/cli.ts <JMdict_e_NG.gz> [selection.json] [output.json]'
  );
}
const selectionFilePath = selectionPath ?? 'src/lib/content/vocabulary/selection.json';
const outputFilePath = outputPath ?? 'src/lib/content/vocabulary/words.json';

const [archive, selectionFile] = await Promise.all([
  readFile(archivePath),
  readFile(selectionFilePath, 'utf8')
]);
const selection = validateSelection(JSON.parse(selectionFile) as unknown);
const xml = readPinnedJmdictArchive(archive);
const entries = importSelectedWords(xml, selection.entries, selection.id);
const dataset = createDataset(entries, selection.id);
validateWordDataset(dataset);
await writeFile(outputFilePath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
