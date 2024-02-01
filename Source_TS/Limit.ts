import { player } from './Player';

/* This is version has all settings (and other stuff) removed (for better speed) */
export const overlimit = {
  Limit: (number: string | number | [number, number]) => {
    const { technical } = overlimit;
    let result = technical.convert(number);

    return {
      plus: function(...numbers: Array<string | number | [number, number]>) {
        if (numbers.length === 0) { return this; }
        const array = technical.convertAll(numbers);

        for (const el of array) { // Reduce
          result = technical.add(result, el);
        }

        return this;
      },
      minus: function(...numbers: Array<string | number | [number, number]>) {
        if (numbers.length === 0) { return this; }
        const array = technical.convertAll(numbers);

        for (const el of array) {
          result = technical.sub(result, el);
        }

        return this;
      },
      multiply: function(...numbers: Array<string | number | [number, number]>) {
        if (numbers.length === 0) { return this; }
        const array = technical.convertAll(numbers);

        for (const el of array) {
          result = technical.mult(result, el);
        }

        return this;
      },
      divide: function(...numbers: Array<string | number | [number, number]>) {
        if (numbers.length === 0) { return this; }
        const array = technical.convertAll(numbers);

        for (const el of array) {
          result = technical.div(result, el);
        }

        return this;
      },
      power: function(power: number) {
        result = technical.pow(result, power);
        return this;
      },
      log: function(base = 2.718_281_828_459_045) {
        result = technical.log(result, base);
        return this;
      },
      abs: function() {
        result[0] = Math.abs(result[0]);
        return this;
      },
      trunc: function() {
        result = technical.trunc(result);
        return this;
      },
      floor: function() {
        result = technical.floor(result);
        return this;
      },
      ceil: function() {
        result = technical.ceil(result);
        return this;
      },
      round: function() {
        result = technical.round(result);
        return this;
      },
      isNaN: (): boolean => Number.isNaN(result[0]) || Number.isNaN(result[1]),
      isFinite: (): boolean => Number.isFinite(result[0]) && Number.isFinite(result[1]),
      lessThan: (compare: string | number | [number, number]): boolean => technical.less(result, technical.convert(compare)),
      lessOrEqual: (compare: string | number | [number, number]): boolean => technical.lessOrEqual(result, technical.convert(compare)),
      moreThan: (compare: string | number | [number, number]): boolean => technical.more(result, technical.convert(compare)),
      moreOrEqual: (compare: string | number | [number, number]): boolean => technical.moreOrEqual(result, technical.convert(compare)),
      notEqual: (compare: string | number | [number, number]): boolean => technical.notEqual(result, technical.convert(compare)),
      equal: (...compare: Array<string | number | [number, number]>): boolean => {
        if (compare.length === 0) { return true; }
        const array = technical.convertAll(compare);

        let allEqual = technical.equal(result, array[0]);
        for (let i = 1; i < array.length; i++) {
          if (!allEqual) { return false; }
          allEqual = technical.equal(array[i - 1], array[i]);
        }

        return allEqual;
      },
      max: function(...compare: Array<string | number | [number, number]>) {
        if (compare.length === 0) { return this; }
        const array = technical.convertAll(compare);

        for (const el of array) {
          if (Number.isNaN(el[0])) {
            result = [Number.NaN, Number.NaN];
            break;
          }

          if (technical.less(result, el)) { result = el; }
        }

        return this;
      },
      min: function(...compare: Array<string | number | [number, number]>) {
        if (compare.length === 0) { return this; }
        const array = technical.convertAll(compare);

        for (const el of array) {
          if (Number.isNaN(el[0])) {
            result = [Number.NaN, Number.NaN];
            break;
          }

          if (technical.more(result, el)) { result = el; }
        }

        return this;
      },
      format: (settings = {} as { digits?: number; type?: 'number' | 'input'; padding?: boolean }): string => technical.format(result, settings),
      toNumber: (): number => Number(technical.convertBack(result)),
      toString: (): string => technical.convertBack(result),
      toArray: (): [number, number] => technical.prepare(result),
    };
  },
  LimitAlt: {
    abs: (number: string): string => number.startsWith('-') ? number.slice(1) : number,
    isNaN: (number: string): boolean => number.includes('NaN'),
    isFinite: (number: string): boolean => !number.includes('Infinity') && !number.includes('NaN'),
    clone: (number: [number, number]): [number, number] => [number[0], number[1]],
    /* Sort is WIP, need to figure out how to add easy to use return function instead of 'descend' (also maybe some optimization) */
    sort: <sortType extends Array<string | number | [number, number]>>(toSort: sortType, descend = false) => {
      if (toSort.length < 2) { return; }
      const numbers = overlimit.technical.convertAll(toSort);
      const compare = descend ? overlimit.technical.moreOrEqual : overlimit.technical.lessOrEqual;

      let main: number[] | number[][] = [[0]];
      initial:
      for (let i = 1; i < numbers.length; i++) {
        const target = main[main.length - 1];
        if (compare(numbers[i - 1], numbers[i])) {
          do {
            target.push(i);
            i++;
            if (i >= numbers.length) { break initial; }
          } while (compare(numbers[i - 1], numbers[i]));
          main.push([i]);
        } else {
          do {
            target.push(i);
            i++;
            if (i >= numbers.length) {
              target.reverse();
              break initial;
            }
          } while (compare(numbers[i], numbers[i - 1]));
          target.reverse();
          main.push([i]);
        }
      }

      const merge = (array: number[][]): number[] | number[][] => {
        if (array.length === 1) { return array[0]; }
        let main: number[] | number[][] = [] as number[][];

        let i;
        for (i = 0; i < array.length - 1; i += 2) {
          main.push([]);
          const target = main[main.length - 1];
          const first = array[i];
          const second = array[i + 1];
          let f = 0;
          let s = 0;
          while (f < first.length || s < second.length) {
            if (s >= second.length || (f < first.length && compare(numbers[first[f]], numbers[second[s]]))) {
              target.push(first[f]);
              f++;
            } else {
              target.push(second[s]);
              s++;
            }
          }
        }
        if (i === array.length - 1) { main.push(array[i]); }

        main = merge(main);
        return main;
      };
      main = merge(main) as number[];

      const clone = [...toSort];
      toSort.length = 0;
      for (let i = 0; i < clone.length; i++) {
        toSort.push(clone[main[i]]);
      }
    },
  },
  technical: {
    add: (left: [number, number], right: [number, number]): [number, number] => {
      if (right[0] === 0) { return left; }
      if (left[0] === 0) { return right; }
      if (!Number.isFinite(left[0]) || !Number.isFinite(right[0])) {
        const check = left[0] + right[0]; // Infinity + -Infinity === NaN
        return Number.isNaN(left[0]) || Number.isNaN(right[0]) || Number.isNaN(check) ? [Number.NaN, Number.NaN] : [check, Number.POSITIVE_INFINITY];
      }

      const difference = left[1] - right[1];
      if (Math.abs(difference) > 15) { return difference > 0 ? left : right; }

      if (difference === 0) {
        left[0] += right[0];
      } else if (difference > 0) {
        left[0] += right[0] / 10 ** difference;
      } else {
        right[0] += left[0] / 10 ** (-difference);
        left = right;
      }

      const after = Math.abs(left[0]);
      if (after === 0) {
        left[1] = 0;
      } else if (after >= 10) {
        left[0] /= 10;
        left[1]++;
      } else if (after < 1) {
        const digits = -Math.floor(Math.log10(after));
        left[0] *= 10 ** digits;
        left[1] -= digits;
      }

      left[0] = Math.round(left[0] * 1e14) / 1e14;
      if (Math.abs(left[0]) === 10) {
        left[0] = 1;
        left[1]++;
      }

      return left;
    },
    sub: (left: [number, number], right: [number, number]): [number, number] => {
      right[0] *= -1; // Easier this way
      return overlimit.technical.add(left, right);
    },
    mult: (left: [number, number], right: [number, number]): [number, number] => {
      if (left[0] === 0 || right[0] === 0) { return [0, 0]; }

      left[1] += right[1];
      left[0] *= right[0];

      if (Math.abs(left[0]) >= 10) {
        left[0] /= 10;
        left[1]++;
      }

      left[0] = Math.round(left[0] * 1e14) / 1e14;
      if (Math.abs(left[0]) === 10) {
        left[0] = 1;
        left[1]++;
      }

      return left;
    },
    div: (left: [number, number], right: [number, number]): [number, number] => {
      if (right[0] === 0) { return [Number.NaN, Number.NaN]; }
      if (left[0] === 0) { return [0, 0]; }

      left[1] -= right[1];
      left[0] /= right[0];

      if (Math.abs(left[0]) < 1) {
        left[0] *= 10;
        left[1]--;
      }

      left[0] = Math.round(left[0] * 1e14) / 1e14;
      if (Math.abs(left[0]) === 10) {
        left[0] = 1;
        left[1]++;
      }

      return left;
    },
    pow: (left: [number, number], power: number): [number, number] => {
      if (power === 0) { return left[0] === 0 || Number.isNaN(left[0]) ? [Number.NaN, Number.NaN] : [1, 0]; }
      if (left[0] === 0) { return power < 0 ? [Number.NaN, Number.NaN] : [0, 0]; }
      if (!Number.isFinite(power)) {
        if (left[1] === 0 && (left[0] === 1 || (left[0] === -1 && !Number.isNaN(power)))) { return [1, 0]; }
        if ((power === Number.NEGATIVE_INFINITY && left[1] >= 0) || (power === Number.POSITIVE_INFINITY && left[1] < 0)) { return [0, 0]; }
        return Number.isNaN(power) || Number.isNaN(left[0]) ? [Number.NaN, Number.NaN] : [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
      }

      const negative = left[0] < 0 ? Math.abs(power) % 2 : undefined;
      if (negative !== undefined) { // Complex numbers are not supported
        if (Math.floor(power) !== power) { return [Number.NaN, Number.NaN]; }
        left[0] *= -1;
      }

      const base10 = power * (Math.log10(left[0]) + left[1]);
      if (!Number.isFinite(base10)) {
        if (Number.isNaN(left[0])) { return [Number.NaN, Number.NaN]; }
        if (base10 === Number.NEGATIVE_INFINITY) { return [0, 0]; }
        return [negative === 1 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
      }

      const target = Math.floor(base10);
      left[0] = 10 ** (base10 - target);
      left[1] = target;

      left[0] = Math.round(left[0] * 1e14) / 1e14;
      if (left[0] === 10) {
        left[0] = 1;
        left[1]++;
      }

      if (negative === 1) { left[0] *= -1; }
      return left;
    },
    log: (left: [number, number], base: number): [number, number] => {
      if (Math.abs(base) === 1 || (left[0] === -1 && left[1] === 0)) { return [Number.NaN, Number.NaN]; }
      if (left[0] === 1 && left[1] === 0) { return [0, 0]; }
      if (base === 0) { return [Number.NaN, Number.NaN]; } // Order matters (0 ** 0 === 1)
      if (left[0] === 0) { return Number.isNaN(base) ? [Number.NaN, Number.NaN] : [Math.abs(base) > 1 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]; }
      if (!Number.isFinite(base)) { return [Number.NaN, Number.NaN]; } // Order matters (Infinity ** 0 === 1 || Infinity ** -Infinity === 0)
      if (!Number.isFinite(left[0])) {
        if (Number.isNaN(left[0]) || left[0] === Number.NEGATIVE_INFINITY) { return [Number.NaN, Number.NaN]; }
        return [Math.abs(base) < 1 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
      }

      const negative = left[0] < 0;
      if (negative) { // Complex numbers are not supported
        if (base > 0) { return [Number.NaN, Number.NaN]; }
        left[0] *= -1;
      }

      const tooSmall = left[1] < 0; // Minor issue with negative power
      const base10 = Math.log10(Math.abs(Math.log10(left[0]) + left[1]));
      const target = Math.floor(base10);
      left[0] = 10 ** (base10 - target);
      left[1] = target;

      if (tooSmall) { left[0] *= -1; } // Already can be negative
      if (base !== 10) {
        left[0] /= Math.log10(Math.abs(base));

        const after = Math.abs(left[0]);
        if (after < 1 || after >= 10) {
          const digits = Math.floor(Math.log10(after));
          left[0] /= 10 ** digits;
          left[1] += digits;
        }
      }

      if (base < 0 || negative) { // Special test for negative numbers
        if (left[1] < 0) { return [Number.NaN, Number.NaN]; }
        // Due to floats (1.1 * 100 !== 110), test is done in this way
        const test = left[1] < 16 ? Math.abs(Math.round(left[0] * 1e14) / 10 ** (14 - left[1])) % 2 : 0;
        if (base < 0 && !negative) {
          if (test !== 0) { return [Number.NaN, Number.NaN]; } // Result must be even
        } else { // base < 0 && negative
          if (test !== 1) { return [Number.NaN, Number.NaN]; } // Result must be uneven
        }
      }

      left[0] = Math.round(left[0] * 1e14) / 1e14;
      if (Math.abs(left[0]) === 10) {
        left[0] = 1;
        left[1]++;
      }

      return left;
    },
    less: (left: [number, number], right: [number, number]): boolean => {
      if (left[0] === 0 || right[0] === 0 || left[1] === right[1]) { return left[0] < right[0]; }
      if (left[0] > 0 && right[0] > 0) { return left[1] < right[1]; }
      if (left[0] < 0 && right[0] > 0) { return true; }
      if (right[0] < 0 && left[0] > 0) { return false; }
      return left[1] > right[1];
    },
    lessOrEqual: (left: [number, number], right: [number, number]): boolean => {
      if (left[0] === 0 || right[0] === 0 || left[1] === right[1]) { return left[0] <= right[0]; }
      if (left[0] > 0 && right[0] > 0) { return left[1] < right[1]; }
      if (left[0] < 0 && right[0] > 0) { return true; }
      if (right[0] < 0 && left[0] > 0) { return false; }
      return left[1] > right[1];
    },
    more: (left: [number, number], right: [number, number]): boolean => {
      if (left[0] === 0 || right[0] === 0 || left[1] === right[1]) { return left[0] > right[0]; }
      if (left[0] > 0 && right[0] > 0) { return left[1] > right[1]; }
      if (left[0] < 0 && right[0] > 0) { return false; }
      if (right[0] < 0 && left[0] > 0) { return true; }
      return left[1] < right[1];
    },
    moreOrEqual: (left: [number, number], right: [number, number]): boolean => {
      if (left[0] === 0 || right[0] === 0 || left[1] === right[1]) { return left[0] >= right[0]; }
      if (left[0] > 0 && right[0] > 0) { return left[1] > right[1]; }
      if (left[0] < 0 && right[0] > 0) { return false; }
      if (right[0] < 0 && left[0] > 0) { return true; }
      return left[1] < right[1];
    },
    equal: (left: [number, number], right: [number, number]): boolean => {
      return left[1] === right[1] && left[0] === right[0];
    },
    notEqual: (left: [number, number], right: [number, number]): boolean => {
      return left[1] !== right[1] || left[0] !== right[0];
    },
    trunc: (left: [number, number]): [number, number] => {
      if (left[1] < 0) {
        return [0, 0];
      } else if (left[1] === 0) {
        left[0] = Math.trunc(left[0]);
      } else if (left[1] <= 14) {
        left[0] = Math.trunc(left[0] * 10 ** left[1]) / 10 ** left[1];
      }

      return left;
    },
    floor: (left: [number, number]): [number, number] => {
      if (left[1] < 0) {
        return [left[0] < 0 ? -1 : 0, 0];
      } else if (left[1] === 0) {
        left[0] = Math.floor(left[0]);
      } else if (left[1] <= 14) {
        left[0] = Math.floor(left[0] * 10 ** left[1]) / 10 ** left[1];
      }

      return left;
    },
    ceil: (left: [number, number]): [number, number] => {
      if (left[1] < 0) {
        return [left[0] < 0 ? 0 : 1, 0];
      } else if (left[1] === 0) {
        left[0] = Math.ceil(left[0]);
      } else if (left[1] <= 14) {
        left[0] = Math.ceil(left[0] * 10 ** left[1]) / 10 ** left[1];
      }

      return left;
    },
    round: (left: [number, number]): [number, number] => {
      if (left[1] < 0) {
        return [left[1] === -1 ? Math.round(left[0] / 10) : 0, 0];
      } else if (left[1] === 0) {
        left[0] = Math.round(left[0]);
      } else if (left[1] <= 14) {
        left[0] = Math.round(left[0] * 10 ** left[1]) / 10 ** left[1];
      }

      return left;
    },
    format: (left: [number, number], settings: { digits?: number; type?: 'number' | 'input'; padding?: boolean }): string => {
      const [base, power] = left;
      if (!Number.isFinite(base) || !Number.isFinite(power)) { return overlimit.technical.convertBack(left); }

      // 1.23ee123 (-1.23e-e123)
      if ((power >= 1e4 || power <= -1e4) && settings.type !== 'input') {
        const digits = settings.digits ?? 2;
        let exponent = Math.floor(Math.log10(Math.abs(power)));
        let result = Math.abs(Math.round(power / 10 ** (exponent - digits)) / 10 ** digits);
        if (result === 10) {
          result = 1;
          exponent++;
        }
        if (base < 0) { result *= -1; }
        return `${(settings.padding === true ? result.toFixed(digits) : `${result}`).replace('.', player.separator[1])}e${power < 0 ? '-' : ''}e${exponent}`;
      }

      // 1.23e123
      if (power >= 6 || power < -3) {
        const digits = settings.digits ?? 2;
        let exponent = power;
        let result = Math.round(base * 10 ** digits) / 10 ** digits;
        if (Math.abs(result) === 10) {
          result = 1;
          exponent++;
        }
        const formated = settings.padding === true ? result.toFixed(digits) : `${result}`;
        return settings.type === 'input' ? `${formated}e${exponent}` : `${formated.replace('.', player.separator[1])}e${exponent}`;
      }

      // 12345
      // There is 1 known bug: number like 999999.9 will be converted into 1000000, which is above of maximum allowed
      const digits = settings.digits ?? Math.max(4 - Math.max(power, 0), 0);
      const result = Math.round(base * 10 ** (digits + power)) / 10 ** digits;
      const formated = settings.padding === true ? result.toFixed(digits) : `${result}`;
      return settings.type === 'input' ? formated : result >= 1e3 ? formated.replace('.', player.separator[1]).replace(/\B(?=(\d{3})+(?!\d))/, player.separator[0]) : formated.replace('.', player.separator[1]);
    },
    convert: (number: string | number | [number, number]): [number, number] => {
      let result: [number, number];
      if (typeof number === 'object') { result = [number[0], number[1]]; } else { // Not an Array
        if (typeof number !== 'string') { number = `${number}`; } // Using log10 could cause floating point error
        const index = number.indexOf('e'); // About 5+ times quicker than regex
        result = index === -1 ? [Number(number), 0] : [Number(number.slice(0, index)), Number(number.slice(index + 1))];
      } // Not instant return, because might need a fix

      if (!Number.isFinite(result[0])) { return Number.isNaN(result[0]) ? [Number.NaN, Number.NaN] : [result[0], Number.POSITIVE_INFINITY]; }

      const after = Math.abs(result[0]);
      if (after === 0) {
        return [0, 0];
      } else if (after < 1 || after >= 10) {
        const digits = Math.floor(Math.log10(after));
        result[0] /= 10 ** digits;
        result[1] += digits;

        if (Math.abs(result[0]) < 1) { // Happens more often than you would think
          result[0] *= 10;
          result[1]--;
        }
      }

      // Float fix always done after exponent, because (11.1 / 10 !== 1.11)
      result[0] = Math.round(result[0] * 1e14) / 1e14;
      if (Math.abs(result[0]) === 10) {
        result[0] = 1;
        result[1]++;
      }

      return result;
    },
    convertAll: (numbers: Array<string | number | [number, number]>): Array<[number, number]> => {
      const result = [];
      const { convert } = overlimit.technical;
      for (let i = 0; i < numbers.length; i++) {
        result[i] = convert(numbers[i]);
      }
      return result;
    },
    prepare: (number: [number, number]): [number, number] => {
      if (Number.isFinite(number[0]) && Number.isFinite(number[1])) { return number; }
      if (number[0] === 0 || number[1] === Number.NEGATIVE_INFINITY) { return [0, 0]; }
      if (Number.isNaN(number[0]) || Number.isNaN(number[1])) { return [Number.NaN, Number.NaN]; }
      return [number[0] < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]; // Base can be non Infinity
    },
    convertBack: (number: [number, number]): string => {
      number = overlimit.technical.prepare(number);
      if (!Number.isFinite(number[0])) { return `${number[0]}`; }
      return number[1] === 0 ? `${number[0]}` : `${number[0]}e${number[1]}`;
    },
  },
};

export const { Limit, LimitAlt } = overlimit;
export default Limit;
