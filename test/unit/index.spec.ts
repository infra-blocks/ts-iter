import {
  asyncArrayCollect,
  asyncBatches,
  asyncFilter,
  asyncFind,
  batches,
  enumerate,
  range,
} from "../../src/index.js";
import * as sinon from "sinon";
import { expect } from "@infra-blocks/test";

describe("iter", function () {
  describe(range.name, function () {
    it("should respect exclusive stop parameter", function () {
      expect(Array.from(range(5))).to.deep.equals([0, 1, 2, 3, 4]);
    });

    it("should respect inclusive start parameter and exclusive stop", function () {
      const expected = [5, 6, 7, 8, 9];
      expect(Array.from(range(5, 10))).to.deep.equals(expected);
    });

    it("should respect the step parameter set", function () {
      const expected = [-1, 2, 5, 8];
      const actual = Array.from(range(-1, 11, 3));
      expect(actual).to.deep.equals(expected);
    });

    it("should handle backwards iteration", function () {
      const expected = [15, 14, 13, 12, 11, 10];
      const actual = Array.from(range(15, 9, -1));
      expect(actual).to.deep.equals(expected);
    });

    it("should throw if step is 0", function () {
      expect(() => Array.from(range(1, 2, 0))).throw();
    });
  });
  describe(enumerate.name, function () {
    it("should work with an empty array", function () {
      const result = Array.from(enumerate([]));
      expect(result).to.have.lengthOf(0);
    });
    it("should work with a singleton array", function () {
      const source = ["toto"];
      const result = Array.from(enumerate(source));
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.deep.equal([0, source[0]]);
    });
    it("should work with an array of several items", function () {
      const source = ["toto", "tata", "tutu"];
      const result = Array.from(enumerate(source));
      expect(result).to.have.lengthOf(3);
      expect(result[0]).to.deep.equal([0, source[0]]);
      expect(result[1]).to.deep.equal([1, source[1]]);
      expect(result[2]).to.deep.equal([2, source[2]]);
    });
  });
  describe(batches.name, function () {
    it("should work with an empty array", function () {
      const result = Array.from(batches([], 10));
      expect(result).to.have.lengthOf(0);
    });
    it("should work with a singleton array", function () {
      const source = [5];
      const result = Array.from(batches(source, 10));
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.deep.equal(source);
    });
    it("should correctly chunk an array", function () {
      const source = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
      // Batching a 15 element array in batches of 4. The last batch should have 3 elements.
      const result = Array.from(batches(source, 4));
      expect(result).to.have.lengthOf(4);
      expect(result[0]).to.deep.equal([2, 4, 6, 8]);
      expect(result[1]).to.deep.equal([10, 12, 14, 16]);
      expect(result[2]).to.deep.equal([18, 20, 22, 24]);
      expect(result[3]).to.deep.equal([26, 28, 30]);
    });
    it("should correctly chunk a generator", function () {
      function* source(): Generator<number> {
        for (let i = 1; i <= 15; i++) {
          yield 2 * i;
        }
      }
      // Batching a 15 element generator in batches of 4. The last batch should have 3 elements.
      const result = Array.from(batches(source(), 4));
      expect(result).to.have.lengthOf(4);
      expect(result[0]).to.deep.equal([2, 4, 6, 8]);
      expect(result[1]).to.deep.equal([10, 12, 14, 16]);
      expect(result[2]).to.deep.equal([18, 20, 22, 24]);
      expect(result[3]).to.deep.equal([26, 28, 30]);
    });
  });
  describe("async iter utils", function () {
    // eslint-disable-next-line @typescript-eslint/require-await,require-yield
    async function* emptyIterable(): AsyncGenerator<number> {
      return;
    }
    describe(asyncFilter.name, function () {
      it("should work with an empty iterable", async function () {
        const predicate = sinon.fake();
        const result = await asyncArrayCollect(
          asyncFilter(emptyIterable(), predicate)
        );
        expect(result).to.deep.equal([]);
        expect(predicate).to.not.have.been.called;
      });
      it("should work with a singleton iterable", async function () {
        async function* iterable(): AsyncGenerator<number> {
          yield await Promise.resolve(5);
        }
        const predicate = sinon.fake(() => true);
        const result = await asyncArrayCollect(
          asyncFilter(iterable(), predicate)
        );
        expect(result).to.deep.equal([5]);
        expect(predicate).to.have.been.calledOnceWith(5);
      });
      it("should work with an iterable of many elements", async function () {
        async function* iterable(): AsyncGenerator<number> {
          for (const i of range(5)) {
            yield await Promise.resolve(i);
          }
        }
        const predicate = sinon.fake((item: number) => item % 2 === 0);
        const result = await asyncArrayCollect(
          asyncFilter(iterable(), predicate)
        );
        expect(result).to.deep.equal([0, 2, 4]);
        expect(predicate).to.have.callCount(5);
      });
    });
    describe(asyncFind.name, function () {
      it("should return undefined with an empty source", async function () {
        const predicate = sinon.fake();
        expect(await asyncFind(emptyIterable(), predicate)).to.be.undefined;
        expect(predicate).to.not.have.been.called;
      });
      it("should return the first item found with a single occurrence", async function () {
        async function* iterable(): AsyncGenerator<number> {
          yield await Promise.resolve(5);
        }
        const predicate = sinon.fake(() => true);
        expect(await asyncFind(iterable(), predicate)).to.equal(5);
        expect(predicate).to.have.been.calledOnceWith(5);
      });
      it("should return the first item found with many occurrences", async function () {
        async function* iterable(): AsyncGenerator<number> {
          // Generates a small cycle of 0, 1, 2, 0, 1, 2, ...
          for (const i of range(10)) {
            yield await Promise.resolve(i % 3);
          }
        }
        const predicate = sinon.fake((item: number) => item === 2);
        expect(await asyncFind(iterable(), predicate)).to.equal(2);
        expect(predicate).to.have.callCount(3);
      });
    });
    describe(asyncBatches.name, function () {
      it("should work with an empty iterable", async function () {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        async function* source(): AsyncGenerator<number> {}

        const result = await asyncArrayCollect(asyncBatches(source(), 10));
        expect(result).to.have.lengthOf(0);
      });
      it("should work with a singleton iterable", async function () {
        async function* source(): AsyncGenerator<number> {
          yield 0;
        }

        const result = await asyncArrayCollect(asyncBatches(source(), 10));
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.deep.equal([0]);
      });
      it("should correctly chunk an iterable bigger than batch size", async function () {
        async function* source(): AsyncGenerator<number> {
          const sourceArray = [
            2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
          ];
          for (const item of sourceArray) {
            yield item;
          }
        }

        // Batching a 15 element array in batches of 4. The last batch should have 3 elements.
        const result = await asyncArrayCollect(asyncBatches(source(), 4));
        expect(result).to.have.lengthOf(4);
        expect(result[0]).to.deep.equal([2, 4, 6, 8]);
        expect(result[1]).to.deep.equal([10, 12, 14, 16]);
        expect(result[2]).to.deep.equal([18, 20, 22, 24]);
        expect(result[3]).to.deep.equal([26, 28, 30]);
      });
    });
  });
});
