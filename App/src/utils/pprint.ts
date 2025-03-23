import { inspect } from 'util';

export function pprint(obj: any, depth = 6): void {
  console.log(inspect(obj, {
    colors: true,
    depth,
    compact: false,
    sorted: true,
    showHidden: false
  }));
}