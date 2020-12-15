import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import {parseJSONToCSV} from './json2csv';

if (!existsSync('./json/')) {
  mkdirSync('./json/');
}
if (!existsSync('./csv/')) {
  mkdirSync('./csv/');
}

const JSON_PATH = './json/';
const CSV_PATH = './csv/';

for (const filename of readdirSync(JSON_PATH)) {
  const [tableName] = filename.split('.');
  const rows = JSON.parse(readFileSync(JSON_PATH + filename).toString());
  const tables = parseJSONToCSV(rows, tableName);

  for (const {tableName, text} of tables) {
    writeFileSync(CSV_PATH + tableName + '.csv', text);
  }
}

//parseJSONToCSV(json, 'test');
