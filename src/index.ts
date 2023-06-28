import { Predicate } from "@infra-blocks/types";

export function range(stop: number): Generator<number>;
export function range(start: number, stop: number): Generator<number>;
export function range(
  start: number,
  stop: number,
  step: number
): Generator<number>;
/**
 * Creates a lazy iterable over the range [start, stop[ using the step value to iterate.
 *
 * This function resembles closely the python equivalent.
 *
 * @param startOrStop - If only this parameter is provided, then it designates the exclusive
 * stop boundary, and the start boundary defaults to 0. If the stop parameter is provided, then
 * this is the value for the start inclusive boundary.
 * @param stop - Stop exclusive boundary.
 * @param step - Step value in between iteration, can be negative.
 */
export function* range(
  startOrStop: number,
  stop?: number,
  step?: number
): Generator<number> {
  let start = startOrStop;
  if (step == null) {
    step = 1;
  }
  if (stop == null) {
    stop = startOrStop;
    start = 0;
  }

  if (step === 0) {
    throw new Error(`invalid step parameter: ${step}`);
  }

  // If we are going forward
  if (step > 0) {
    for (let i = start; i < stop; i += step) {
      yield i;
    }
    // If we are going backward.
  } else {
    for (let i = start; i > stop; i += step) {
      yield i;
    }
  }
}

/**
 * Iterates the iterable by yielding tuples of 2 elements, where the first one is the index of the iteration
 * and the second one is the item itself.
 *
 * @param iterable - The iterable to go over.
 */
export function* enumerate<T>(iterable: Iterable<T>): Generator<[number, T]> {
  let i = 0;

  for (const item of iterable) {
    yield [i, item];
    i++;
  }
}

/**
 * Creates a lazy iterable over batches of elements.
 *
 * This function takes any iterable as its source and generates batches of the provided
 * size successively, until the final batch, which will contain the remaining elements.
 *
 * @param iterable The items source
 * @param batchSize The size of the batches
 */
export function* batches<T>(
  iterable: Iterable<T>,
  batchSize: number
): Generator<Array<T>> {
  let batch = [];
  for (const item of iterable) {
    batch.push(item);
    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) {
    yield batch;
  }
}

/**
 * The async equivalent to {@link batches}, which works on async iterables.
 *
 * @param iterable The async item source
 * @param batchSize The size of the batches
 */
export async function* asyncBatches<T>(
  iterable: AsyncIterable<T>,
  batchSize: number
): AsyncGenerator<Array<T>> {
  let batch = [];
  for await (const item of iterable) {
    batch.push(item);
    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) {
    yield batch;
  }
}

/**
 * Collects the async iterable into an array.
 *
 * @param iterable The items source
 *
 * @return An array containing the items yielded by the provided async iterable
 */
export async function asyncArrayCollect<T>(
  iterable: AsyncIterable<T>
): Promise<Array<T>> {
  const result = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}

/**
 * Creates a lazy async iterable over filtered elements of an async iterable.
 *
 * Items are kept when the provided predicate returns true, otherwise they are not yielded.
 *
 * @param iterable The items source
 * @param predicate The predicate function determining whether to keep or not the items
 */
export async function* asyncFilter<T>(
  iterable: AsyncIterable<T>,
  predicate: Predicate<T>
): AsyncGenerator<T> {
  for await (const item of iterable) {
    if (predicate(item)) {
      yield item;
    }
  }
}

/**
 * Eagerly finds the first item for which the predicate returns true from an async iterable source.
 *
 * @param iterable The items source
 * @param predicate The predicate function determining which item to find
 *
 * @return The first item for which the predicate returns true, undefined if none could be found.
 */
export async function asyncFind<T>(
  iterable: AsyncIterable<T>,
  predicate: Predicate<T>
): Promise<T | undefined> {
  for await (const item of iterable) {
    if (predicate(item)) {
      return item;
    }
  }
  return undefined;
}
