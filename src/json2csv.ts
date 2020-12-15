import {DefaultMap, forEachField, isPlainObject} from './util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertToObject(val: any): {} {
  if (Array.isArray(val)) {
    return {
      array: val,
    };
  }
  if (!isPlainObject(val)) {
    return {
      value: val,
    };
  }
  return val;
}

class CSVBuilder {
  private _rows: {id: number}[] = [];
  private _orderedFields = ['id'];
  private _fields = new Set<string>(this._orderedFields);
  private _nextId = 1;
  //age, user.lastName, user.firstName id
  constructor(
    private _tableName: string,
    private _tables: DefaultMap<string, CSVBuilder>
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addRows(objs: any[]) {
    if (objs.length === 0) {
      return;
    }
    for (let obj of objs) {
      obj = convertToObject(obj);
      const id = (obj.id = obj.id ?? this._nextId);
      //This will probably lead to some funny bidness. Either don't override, or force override the id column
      this._nextId = Math.max(id, this._nextId) + 1;
      //
      this._addNestedFields(obj, obj, this._tableName, null, id);
      for (const field in obj) {
        if (!this._fields.has(field)) {
          this._orderedFields.push(field);
          this._fields.add(field);
        }
      }
      this._rows.push(obj);
    }
  }

  private _addNestedFields(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    host: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj: any,
    parentTableName: string,
    parentName: string | null,
    parentId: number
  ) {
    const parentPath = parentName ? `${parentName}.` : '';
    forEachField(obj, (v, field) => {
      delete obj[field];
      if (Array.isArray(v)) {
        if (!v.length) {
          return;
        }
        this._tables.get(`${parentTableName}.${parentPath}${field}`).addRows(
          (v as {}[]).map((v, i) => ({
            [`${parentTableName}.id`]: parentId,
            ['array.index']: i + 1,
            ...convertToObject(v),
          }))
        );
      } else if (isPlainObject(v)) {
        this._addNestedFields(
          host,
          v,
          parentTableName,
          `${parentPath}${field}`,
          parentId
        );
      } else {
        host[`${parentPath}${field}`] = v;
      }
    });
  }

  toCSV() {
    const headers =
      Array.from(this._orderedFields)
        .map(f => `"${f}"`)
        .join(',') + '\n';
    return (
      headers +
      this._rows
        .sort(({id: a}, {id: b}) => a - b)
        .map(row => {
          const vals: string[] = [];
          for (const field of this._orderedFields) {
            const val = row[field as keyof typeof row];
            if (val === undefined) {
              vals.push('');
            } else {
              vals.push(JSON.stringify(val));
            }
          }
          return vals.join(',');
        })
        .join('\n')
    );
  }
}

export function parseJSONToCSV(objs: {}[], tableName: string) {
  const tables: DefaultMap<string, CSVBuilder> = new DefaultMap<
    string,
    CSVBuilder
  >(key => new CSVBuilder(key, tables));
  tables.get(tableName).addRows(objs);
  return Array.from(tables).map(([tableName, builder]) => ({
    tableName,
    text: builder.toCSV(),
  }));
}
