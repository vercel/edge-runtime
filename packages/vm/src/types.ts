/**
 * Just any type of object indexed by string or numbers where the value can
 * be anything or the provided generic.
 */
export interface Dictionary<T = any> {
  [key: string | number]: T
}
