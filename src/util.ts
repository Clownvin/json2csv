export class DefaultMap<K, V> extends Map<K, V> {
  constructor(
    protected getDefault: (key: K) => V,
    ...entries: readonly [K, V][]
  ) {
    super(entries);
  }

  get(key: K) {
    let value = super.get(key);
    if (value === undefined) {
      super.set(key, (value = this.getDefault(key)));
    }
    return value;
  }
}

export function forEachField<T>(
  object: T,
  fn: <K extends keyof T>(val: T[K], key: K, obj: T) => unknown
) {
  for (const key in object) {
    fn(object[key], key, object);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPlainObject(object: any) {
  if (!object || typeof object !== 'object' || object.constructor !== Object) {
    return false;
  }
  return true;
}
